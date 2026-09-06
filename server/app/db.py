"""Tiny SQLite helper layer -- no ORM, just a connection and a schema bootstrap."""
from __future__ import annotations

import sqlite3
from pathlib import Path

from .config import DASHBOARD_DB_PATH

_SCHEMA = Path(__file__).resolve().parent / "schema.sql"


def connect() -> sqlite3.Connection:
    DASHBOARD_DB_PATH.parent.mkdir(parents=True, exist_ok=True)
    conn = sqlite3.connect(DASHBOARD_DB_PATH, timeout=10)
    conn.row_factory = sqlite3.Row
    conn.execute("PRAGMA journal_mode=WAL;")
    conn.execute("PRAGMA foreign_keys=ON;")
    return conn


def init_db() -> None:
    conn = connect()
    try:
        conn.executescript(_SCHEMA.read_text(encoding="utf-8"))
        conn.commit()
    finally:
        conn.close()


def get_meta(conn: sqlite3.Connection, key: str, default: str | None = None) -> str | None:
    row = conn.execute("SELECT value FROM meta WHERE key = ?", (key,)).fetchone()
    return row["value"] if row else default


def set_meta(conn: sqlite3.Connection, key: str, value: str) -> None:
    conn.execute(
        "INSERT INTO meta (key, value) VALUES (?, ?) "
        "ON CONFLICT(key) DO UPDATE SET value = excluded.value",
        (key, str(value)),
    )


def current_epoch(conn: sqlite3.Connection) -> int:
    return int(get_meta(conn, "reset_epoch", "1") or "1")
