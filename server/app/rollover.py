"""Reset handling. The reset is driven by a *signal* (see machine_db.read_machine's
`reset_signal` field), not a clock. A rising edge (False -> True) triggers a reset:
the current epoch is archived and every cumulative signal re-bases to zero.

`POST /api/reset` calls `do_reset(reason="manual")` for testing / a manual button.
"""
from __future__ import annotations

import json
import sqlite3
from datetime import datetime

from . import clock
from . import config_data as C
from .db import current_epoch, get_meta, set_meta


def _shift_start_today() -> datetime:
    n = clock.now()
    h, m = C.SHIFT_START.split(":")
    return n.replace(hour=int(h), minute=int(m), second=0, microsecond=0)


def ensure_initialised(conn: sqlite3.Connection, raw_payload: dict) -> None:
    """First run: create epoch 1 + its baseline."""
    if get_meta(conn, "reset_epoch") is None:
        now = clock.iso()
        # Epoch 1's accumulation window is the shift itself (so availability / runtime
        # / MTBF reflect "so far this shift", not "since the poller booted").
        # A real reset signal later anchors the next epoch at the reset moment.
        anchor = min(_shift_start_today(), clock.now()).isoformat(timespec="seconds")
        set_meta(conn, "reset_epoch", "1")
        set_meta(conn, "reset_ts", anchor)
        set_meta(conn, "last_reset_signal", "0")
        # Empty baseline => before the first reset signal, the dashboard simply
        # mirrors the machine's own counters. A reset then re-bases to zero.
        conn.execute(
            "INSERT OR REPLACE INTO baseline (reset_epoch, captured_ts, payload) VALUES (?, ?, ?)",
            (1, now, json.dumps({})),
        )
        conn.execute(
            "INSERT INTO reset_marker (ts, reason) VALUES (?, ?)", (now, "startup")
        )
        conn.commit()


def do_reset(conn: sqlite3.Connection, raw_payload: dict, reason: str,
             archived_payload: dict | None = None) -> int:
    """Archive the current epoch, start a new one, capture a fresh baseline."""
    now = clock.iso()
    epoch = current_epoch(conn)

    if archived_payload is not None:
        conn.execute(
            "INSERT INTO snapshot_history (reset_epoch, archived_ts, payload) VALUES (?, ?, ?)",
            (epoch, now, json.dumps(archived_payload)),
        )

    new_epoch = epoch + 1
    set_meta(conn, "reset_epoch", str(new_epoch))
    set_meta(conn, "reset_ts", now)
    conn.execute(
        "INSERT OR REPLACE INTO baseline (reset_epoch, captured_ts, payload) VALUES (?, ?, ?)",
        (new_epoch, now, json.dumps(raw_payload)),
    )
    conn.execute("INSERT INTO reset_marker (ts, reason) VALUES (?, ?)", (now, reason))
    conn.commit()
    return new_epoch


def reset_ts(conn: sqlite3.Connection) -> datetime:
    raw = get_meta(conn, "reset_ts")
    return datetime.fromisoformat(raw) if raw else datetime.now()
