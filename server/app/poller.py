"""The 5-second loop: read machine DB -> store -> accumulate -> handle reset."""
from __future__ import annotations

import asyncio
import sqlite3

from . import clock
from .config import POLL_INTERVAL_SECONDS
from .config_data import MACHINES, machine_name
from .db import connect, current_epoch, get_meta, set_meta
from .machine_db import read_machine, reading_to_dict
from .rollover import do_reset, ensure_initialised
from . import events, snapshot

_CAT = {0: "machine", 1: "human", 2: "other"}


def _store_inputs(conn: sqlite3.Connection, epoch: int, payload: dict) -> None:
    """Land one machine reading into the INPUT tables (in_line / in_machine / in_interval).

    One upsert for the line, five for the machines, six for the intervals -- so each
    table always holds the current picture (1 / 5 / 6 rows per reset_epoch).
    """
    ts = payload["taken_at"]
    bdate = clock.now().strftime("%Y-%m-%d")

    conn.execute(
        "INSERT INTO in_line (reset_epoch, business_date, passed_count, defect_count, "
        "line_total_produced, active_alarm_count, reset_signal, updated_at) "
        "VALUES (?, ?, ?, ?, ?, ?, ?, ?) "
        "ON CONFLICT(reset_epoch) DO UPDATE SET "
        "business_date = excluded.business_date, passed_count = excluded.passed_count, "
        "defect_count = excluded.defect_count, line_total_produced = excluded.line_total_produced, "
        "active_alarm_count = excluded.active_alarm_count, reset_signal = excluded.reset_signal, "
        "updated_at = excluded.updated_at",
        (
            epoch, bdate, int(payload["passed_count"]), int(payload["defect_count"]),
            int(payload["line_total_produced"]), int(payload["active_alarm_count"]),
            1 if payload["reset_signal"] else 0, ts,
        ),
    )

    for idx, name in enumerate(MACHINES, start=1):
        mp = payload["machines"].get(name)
        if mp is None:
            continue
        conn.execute(
            "INSERT INTO in_machine (reset_epoch, machine_no, actual_ct, state, op_passed, "
            "op_total, energy_total_kwh, failure_count, total_down_min, updated_at) "
            "VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?) "
            "ON CONFLICT(reset_epoch, machine_no) DO UPDATE SET "
            "actual_ct = excluded.actual_ct, state = excluded.state, op_passed = excluded.op_passed, "
            "op_total = excluded.op_total, energy_total_kwh = excluded.energy_total_kwh, "
            "failure_count = excluded.failure_count, total_down_min = excluded.total_down_min, "
            "updated_at = excluded.updated_at",
            (
                epoch, idx, float(mp["actual_ct"]), int(mp["state"]), int(mp["op_passed"]),
                int(mp["op_total"]), float(mp["energy_total_kwh"]), int(mp["failure_count"]),
                float(mp["total_down_min"]), ts,
            ),
        )

    intervals = payload["interval_produced"]
    for i in range(6):
        produced = int(intervals[i]) if i < len(intervals) else 0
        conn.execute(
            "INSERT INTO in_interval (reset_epoch, interval_no, produced, updated_at) "
            "VALUES (?, ?, ?, ?) "
            "ON CONFLICT(reset_epoch, interval_no) DO UPDATE SET "
            "produced = excluded.produced, updated_at = excluded.updated_at",
            (epoch, i + 1, produced, ts),
        )


def _accumulate_states(conn: sqlite3.Connection, epoch: int, payload: dict) -> None:
    for name, mp in payload["machines"].items():
        conn.execute(
            "INSERT INTO state_accum (reset_epoch, machine, state, seconds) VALUES (?, ?, ?, ?) "
            "ON CONFLICT(reset_epoch, machine, state) DO UPDATE SET seconds = seconds + ?",
            (epoch, name, int(mp["state"]), float(POLL_INTERVAL_SECONDS), float(POLL_INTERVAL_SECONDS)),
        )


def _upsert_alarms(conn: sqlite3.Connection, epoch: int, payload: dict) -> None:
    reset_hhmm = (get_meta(conn, "reset_ts") or "")[11:16]
    reset_min = _to_min(reset_hhmm) if reset_hhmm else -1
    for a in payload["alarms"]:
        # ignore stale ring-buffer entries from before this epoch started today
        if reset_min >= 0 and _to_min(a["ts_hhmm"]) < reset_min:
            continue
        machine = machine_name(int(a["machine_idx"]))
        nkey = f'{a["ts_hhmm"]}|{machine}|{a["code"]}|{a["description"]}'
        conn.execute(
            "INSERT INTO in_alarm (reset_epoch, nkey, ts_hhmm, machine, code, description, "
            "description_jp, category, duration_min, status, causes_downtime) "
            "VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?) "
            "ON CONFLICT(reset_epoch, nkey) DO UPDATE SET "
            "duration_min = excluded.duration_min, status = excluded.status",
            (
                epoch, nkey, a["ts_hhmm"], machine, int(a["code"]),
                a["description"], a["description_jp"], _CAT.get(int(a["category"]), "machine"),
                float(a["duration_min"]),
                "active" if a["active"] else "cleared",
                1 if a["causes_downtime"] else 0,
            ),
        )


def _to_min(hhmm: str) -> int:
    try:
        h, m = hhmm.split(":")
        return int(h) * 60 + int(m)
    except ValueError:
        return -1


def poll_once(conn: sqlite3.Connection) -> None:
    reading = read_machine()
    payload = reading_to_dict(reading)

    ensure_initialised(conn, payload)
    set_meta(conn, "business_date", clock.now().strftime("%Y-%m-%d"))

    # ---- reset signal: rising edge -----------------------------------
    last = get_meta(conn, "last_reset_signal", "0") == "1"
    now_sig = bool(reading.reset_signal)
    if now_sig and not last:
        archived = snapshot.build_current(conn)
        do_reset(conn, payload, reason="signal", archived_payload=archived)
    set_meta(conn, "last_reset_signal", "1" if now_sig else "0")

    epoch = current_epoch(conn)
    _store_inputs(conn, epoch, payload)
    _accumulate_states(conn, epoch, payload)
    _upsert_alarms(conn, epoch, payload)
    set_meta(conn, "last_poll_ts", clock.iso())
    conn.commit()


def _publish_snapshot(conn: sqlite3.Connection) -> None:
    """Build the current snapshot and fan it out to every SSE client."""
    payload = snapshot.build_current(conn)
    if payload is not None:
        payload["ready"] = True
        events.publish(payload)


def manual_reset(conn: sqlite3.Connection) -> int:
    reading = read_machine()
    payload = reading_to_dict(reading)
    ensure_initialised(conn, payload)
    archived = snapshot.build_current(conn)
    new_epoch = do_reset(conn, payload, reason="manual", archived_payload=archived)
    conn.commit()
    poll_once(conn)  # populate the new epoch immediately so /api/snapshot is ready
    _publish_snapshot(conn)
    return new_epoch


async def run_forever(stop: asyncio.Event) -> None:
    conn = connect()
    try:
        while not stop.is_set():
            try:
                poll_once(conn)
                _publish_snapshot(conn)
            except Exception as exc:  # keep the loop alive on transient DB errors
                print(f"[poller] error: {exc!r}")
            try:
                await asyncio.wait_for(stop.wait(), timeout=POLL_INTERVAL_SECONDS)
            except asyncio.TimeoutError:
                pass
    finally:
        conn.close()
