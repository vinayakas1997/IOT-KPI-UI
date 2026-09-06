"""Environment-driven settings. One place for every knob."""
from __future__ import annotations

import os
from pathlib import Path

from dotenv import load_dotenv

_SERVER_DIR = Path(__file__).resolve().parent.parent
load_dotenv(_SERVER_DIR / ".env")


def _get(name: str, default: str) -> str:
    return os.environ.get(name, default)


POLL_INTERVAL_SECONDS = int(_get("POLL_INTERVAL_SECONDS", "5"))

DASHBOARD_DB_PATH = (_SERVER_DIR / _get("DASHBOARD_DB_PATH", "./data/dashboard.db")).resolve()

API_HOST = _get("API_HOST", "127.0.0.1")
API_PORT = int(_get("API_PORT", "8000"))

# "mock" or "sqlserver"
MACHINE_DB_MODE = _get("MACHINE_DB_MODE", "mock").strip().lower()

MACHINE_DB_DRIVER = _get("MACHINE_DB_DRIVER", "ODBC Driver 18 for SQL Server")
MACHINE_DB_SERVER = _get("MACHINE_DB_SERVER", "localhost,1433")
MACHINE_DB_DATABASE = _get("MACHINE_DB_DATABASE", "MachineDB")
MACHINE_DB_USER = _get("MACHINE_DB_USER", "sa")
MACHINE_DB_PASSWORD = _get("MACHINE_DB_PASSWORD", "")
MACHINE_DB_EXTRA = _get("MACHINE_DB_EXTRA", "TrustServerCertificate=yes")


def sqlserver_connection_string() -> str:
    parts = [
        f"DRIVER={{{MACHINE_DB_DRIVER}}}",
        f"SERVER={MACHINE_DB_SERVER}",
        f"DATABASE={MACHINE_DB_DATABASE}",
        f"UID={MACHINE_DB_USER}",
        f"PWD={MACHINE_DB_PASSWORD}",
    ]
    if MACHINE_DB_EXTRA:
        parts.append(MACHINE_DB_EXTRA.strip().strip(";"))
    return ";".join(parts) + ";"
