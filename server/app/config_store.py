"""Persistence for the UI-editable settings (the `app_config` table).

Flow:
  startup            -> bootstrap()  reads the row (or seeds it) and pushes it
                        into config_data via apply_settings()
  PUT /api/config    -> save()       validates upstream, writes the row, and
                        re-applies so the next poll/snapshot uses it immediately
"""
from __future__ import annotations

import json
import sqlite3

from . import clock, config_data


def load(conn: sqlite3.Connection) -> dict:
    row = conn.execute("SELECT payload FROM app_config WHERE id = 1").fetchone()
    if row is None:
        return dict(config_data.DEFAULT_SETTINGS)
    try:
        return config_data.normalize_settings(json.loads(row["payload"]))
    except (ValueError, KeyError, TypeError):
        return dict(config_data.DEFAULT_SETTINGS)


def save(conn: sqlite3.Connection, settings: dict) -> dict:
    """Persist `settings` and make them live. Caller must validate first."""
    norm = config_data.normalize_settings(settings)
    conn.execute(
        "INSERT INTO app_config (id, payload, updated_at) VALUES (1, ?, ?) "
        "ON CONFLICT(id) DO UPDATE SET payload = excluded.payload, "
        "updated_at = excluded.updated_at",
        (json.dumps(norm), clock.iso()),
    )
    conn.commit()
    config_data.apply_settings(norm)
    return config_data.current_settings()


def bootstrap(conn: sqlite3.Connection) -> None:
    """Load persisted settings into config_data at startup; seed the row if absent."""
    row = conn.execute("SELECT payload FROM app_config WHERE id = 1").fetchone()
    if row is None:
        save(conn, dict(config_data.DEFAULT_SETTINGS))
    else:
        config_data.apply_settings(load(conn))
