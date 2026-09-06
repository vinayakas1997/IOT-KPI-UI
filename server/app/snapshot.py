"""Assemble the dashboard payload on demand from what the poller has stored."""
from __future__ import annotations

import json
import sqlite3

from . import clock, compute
from . import config_data as C
from .db import current_epoch, get_meta
from .rollover import reset_ts

_CUMULATIVE_LINE = ("passed_count", "defect_count", "line_total_produced")
_CUMULATIVE_MACHINE = ("op_passed", "op_total", "energy_total_kwh",
                       "failure_count", "total_down_min")
_MACHINE_FIELDS = ("actual_ct", "state", "op_passed", "op_total",
                   "energy_total_kwh", "failure_count", "total_down_min")


def _rebase(raw: dict, baseline: dict) -> dict:
    """(raw - baseline) for cumulative fields; instantaneous fields pass through."""
    out = json.loads(json.dumps(raw))  # deep copy
    for k in _CUMULATIVE_LINE:
        out[k] = max(raw.get(k, 0) - baseline.get(k, 0), 0)
    for m, mp in out.get("machines", {}).items():
        bmp = baseline.get("machines", {}).get(m, {})
        for k in _CUMULATIVE_MACHINE:
            mp[k] = max(mp.get(k, 0) - bmp.get(k, 0), 0)
    return out


def _read_inputs(conn: sqlite3.Connection, epoch: int) -> dict | None:
    """Reassemble the machine-reading dict from the INPUT tables.

    Shape matches machine_db.reading_to_dict() so compute.build_payload() is unchanged.
    Returns None until the poller has written the first in_line row for this epoch.
    """
    line = conn.execute(
        "SELECT passed_count, defect_count, line_total_produced, active_alarm_count "
        "FROM in_line WHERE reset_epoch = ?",
        (epoch,),
    ).fetchone()
    if line is None:
        return None

    machines: dict[str, dict] = {}
    for r in conn.execute(
        "SELECT machine_no, actual_ct, state, op_passed, op_total, energy_total_kwh, "
        "failure_count, total_down_min FROM in_machine WHERE reset_epoch = ? ORDER BY machine_no",
        (epoch,),
    ).fetchall():
        no = int(r["machine_no"])
        name = C.MACHINES[no - 1] if 1 <= no <= len(C.MACHINES) else f"Machine {no}"
        machines[name] = {k: r[k] for k in _MACHINE_FIELDS}
    for name in C.MACHINES:  # a machine the poll hasn't written yet -> zeros
        machines.setdefault(name, {k: 0 for k in _MACHINE_FIELDS})

    interval_produced = [0] * 6
    for r in conn.execute(
        "SELECT interval_no, produced FROM in_interval WHERE reset_epoch = ?", (epoch,)
    ).fetchall():
        no = int(r["interval_no"])
        if 1 <= no <= 6:
            interval_produced[no - 1] = int(r["produced"])

    return {
        "passed_count": int(line["passed_count"]),
        "defect_count": int(line["defect_count"]),
        "line_total_produced": int(line["line_total_produced"]),
        "active_alarm_count": int(line["active_alarm_count"]),
        "interval_produced": interval_produced,
        "machines": machines,
    }


def _baseline(conn: sqlite3.Connection, epoch: int) -> dict:
    row = conn.execute(
        "SELECT payload FROM baseline WHERE reset_epoch = ?", (epoch,)
    ).fetchone()
    return json.loads(row["payload"]) if row else {}


def _state_seconds(conn: sqlite3.Connection, epoch: int) -> dict:
    rows = conn.execute(
        "SELECT machine, state, seconds FROM state_accum WHERE reset_epoch = ?", (epoch,)
    ).fetchall()
    out: dict[str, dict[int, float]] = {}
    for r in rows:
        out.setdefault(r["machine"], {})[int(r["state"])] = r["seconds"]
    return out


def _alarms(conn: sqlite3.Connection, epoch: int) -> list[dict]:
    rows = conn.execute(
        "SELECT ts_hhmm, machine, code, description, description_jp, category, "
        "duration_min, status, causes_downtime FROM in_alarm "
        "WHERE reset_epoch = ? ORDER BY ts_hhmm",
        (epoch,),
    ).fetchall()
    return [
        {
            "ts_hhmm": r["ts_hhmm"], "machine": r["machine"], "code": r["code"],
            "description": r["description"], "description_jp": r["description_jp"],
            "category": r["category"], "duration_min": r["duration_min"],
            "status": r["status"], "causes_downtime": bool(r["causes_downtime"]),
        }
        for r in rows
    ]


def build_current(conn: sqlite3.Connection) -> dict | None:
    epoch = current_epoch(conn)
    raw = _read_inputs(conn, epoch)
    if raw is None:
        return None
    rebased = _rebase(raw, _baseline(conn, epoch))

    started = reset_ts(conn)
    elapsed_min = max((clock.now() - started).total_seconds() / 60.0, 0.5)
    business_date = get_meta(conn, "business_date") or clock.now().strftime("%Y-%m-%d")

    return compute.build_payload(
        reading=rebased,
        state_seconds=_state_seconds(conn, epoch),
        alarms=_alarms(conn, epoch),
        elapsed_since_reset_min=elapsed_min,
        business_date=business_date,
    )
