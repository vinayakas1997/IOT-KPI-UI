"""
One source of "now".

In real mode this is just datetime.now(). In mock mode it returns a *simulated*
shift clock so the dashboard looks alive whatever the actual wall-clock time is:
it starts ~40 min into the configured shift and advances in real time (optionally
sped up with MOCK_TIME_SCALE). This keeps the mock machine data and the interval
status logic consistent with each other.
"""
from __future__ import annotations

import os
import time
from datetime import datetime, timedelta

from . import config
from . import config_data

_ANCHOR_WALL = time.time()
_SCALE = float(os.environ.get("MOCK_TIME_SCALE", "1"))
# Where in the shift the mock clock starts (minutes after SHIFT_START). Starting
# mid-shift makes the first render look realistic; override with MOCK_START_OFFSET_MIN.
_START_OFFSET_MIN = float(os.environ.get("MOCK_START_OFFSET_MIN", "300"))


def now() -> datetime:
    if config.MACHINE_DB_MODE != "mock":
        return datetime.now()
    real = datetime.now()
    h, m = config_data.SHIFT_START.split(":")
    base = real.replace(hour=int(h), minute=int(m), second=0, microsecond=0)
    elapsed_sec = (time.time() - _ANCHOR_WALL) * _SCALE
    return base + timedelta(minutes=_START_OFFSET_MIN, seconds=elapsed_sec)


def iso() -> str:
    return now().isoformat(timespec="seconds")


def minutes_since_shift_start() -> float:
    n = now()
    h, m = config_data.SHIFT_START.split(":")
    start = n.replace(hour=int(h), minute=int(m), second=0, microsecond=0)
    return max((n - start).total_seconds() / 60.0, 0.0)
