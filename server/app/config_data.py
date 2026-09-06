"""
Static + editable dashboard configuration.

Per the PLC register map these values are "dashboard input box" settings -- they
do NOT come from the machine.

  * NOT editable from the UI  -> plain constants below (machine list, colours,
    chart envelopes). Change them here and restart.
  * Editable from the settings panel -> `DEFAULT_SETTINGS` + the module-level
    names refreshed by `apply_settings()`. The live values are persisted in the
    `app_config` table and loaded at startup (see app/config_store.py).

`apply_settings()` is called once at import (with the defaults) and again every
time the settings panel saves. The poller / compute code just reads the
module-level names (`SHIFT_START`, `INTERVAL_TARGETS`, ...) and always sees the
current values.
"""
from __future__ import annotations

import re

# ============================================================ NOT UI-editable

MACHINES = ["Machine 1", "Machine 2", "Machine 3", "Machine 4", "Machine 5"]

MACHINE_COLORS = {
    "Machine 1": "#0d9488",
    "Machine 2": "#3b82f6",
    "Machine 3": "#ec4899",
    "Machine 4": "#f59e0b",
    "Machine 5": "#8b5cf6",
}

# Cosmetic ranges for the two scatter/spline charts (min/max envelope shading).
MACHINE_PROFILES = {
    "Machine 1": {"cycleMin": 35, "cycleMax": 42, "energyMin": 15, "energyMax": 20},
    "Machine 2": {"cycleMin": 40, "cycleMax": 48, "energyMin": 25, "energyMax": 30},
    "Machine 3": {"cycleMin": 50, "cycleMax": 58, "energyMin": 35, "energyMax": 42},
    "Machine 4": {"cycleMin": 38, "cycleMax": 45, "energyMin": 18, "energyMax": 24},
    "Machine 5": {"cycleMin": 30, "cycleMax": 38, "energyMin": 12, "energyMax": 18},
}


def machine_name(idx: int) -> str:
    """Machine index (1-5) -> name, for alarm rows that arrive with a numeric id."""
    if 1 <= idx <= len(MACHINES):
        return MACHINES[idx - 1]
    return "Line"


# ============================================================ UI-editable

INTERVAL_COUNT = 6

DEFAULT_SETTINGS: dict = {
    "shiftStart": "08:20",
    "shiftEnd": "19:20",
    # Up to two break windows that don't count as planned production time.
    "buffers": [
        {"start": "08:20", "end": "08:30"},
        {"start": "13:00", "end": "13:10"},
    ],
    # Exactly INTERVAL_COUNT rows. Drives Production-vs-Target and Interval-Error charts.
    "intervals": [
        {"start": "08:20", "end": "10:20", "label": "8:20-10:20", "target": 150},
        {"start": "10:20", "end": "13:00", "label": "10:20-13:00", "target": 200},
        {"start": "13:00", "end": "15:10", "label": "13:00-15:10", "target": 200},
        {"start": "15:10", "end": "17:20", "label": "15:10-17:20", "target": 150},
        {"start": "17:20", "end": "19:20", "label": "17:20-19:20 (OT)", "target": 150},
        {"start": "19:20", "end": "21:20", "label": "19:20-21:20 (OT)", "target": 150},
    ],
    "dailyTarget": 1000,
    # Ideal / rated cycle time per machine (seconds) -- bottleneck + performance.
    "idealCycleTime": {
        "Machine 1": 36, "Machine 2": 40, "Machine 3": 45,
        "Machine 4": 38, "Machine 5": 32,
    },
}

# --- module-level names the rest of the codebase reads (kept in sync below) ---
SHIFT_START = DEFAULT_SETTINGS["shiftStart"]
SHIFT_END = DEFAULT_SETTINGS["shiftEnd"]
BUFFERS: list[dict] = []
SHIFT_INTERVAL_BOUNDARIES: list[str] = []
SHIFT_INTERVAL_LABELS: list[str] = []
DAILY_TARGET = DEFAULT_SETTINGS["dailyTarget"]
INTERVAL_TARGETS: list[int] = []
IDEAL_CYCLE_TIME: dict = {}

_current_settings: dict = dict(DEFAULT_SETTINGS)

_HHMM = re.compile(r"^([01]?\d|2[0-3]):[0-5]\d$")


def _is_hhmm(v) -> bool:
    return isinstance(v, str) and bool(_HHMM.match(v))


def validate_settings(s: dict) -> list[str]:
    """Return a list of human-readable problems. Empty list == OK to save."""
    errs: list[str] = []
    if not isinstance(s, dict):
        return ["settings must be an object"]

    for k in ("shiftStart", "shiftEnd"):
        if not _is_hhmm(s.get(k)):
            errs.append(f"{k} must be HH:MM")

    buffers = s.get("buffers", [])
    if not isinstance(buffers, list) or len(buffers) > 2:
        errs.append("buffers must be a list of at most 2 windows")
    else:
        for i, b in enumerate(buffers, 1):
            if not (isinstance(b, dict) and _is_hhmm(b.get("start")) and _is_hhmm(b.get("end"))):
                errs.append(f"break {i} needs valid start/end (HH:MM)")

    intervals = s.get("intervals", [])
    if not isinstance(intervals, list) or len(intervals) != INTERVAL_COUNT:
        errs.append(f"intervals must be a list of exactly {INTERVAL_COUNT} rows")
    else:
        prev_start = None
        for i, iv in enumerate(intervals, 1):
            if not isinstance(iv, dict):
                errs.append(f"interval {i} is malformed")
                continue
            if not _is_hhmm(iv.get("start")) or not _is_hhmm(iv.get("end")):
                errs.append(f"interval {i} needs valid start/end (HH:MM)")
            if not str(iv.get("label", "")).strip():
                errs.append(f"interval {i} needs a label")
            try:
                if int(iv.get("target")) < 0:
                    errs.append(f"interval {i} target must be 0 or more")
            except (TypeError, ValueError):
                errs.append(f"interval {i} target must be a whole number")
            if _is_hhmm(iv.get("start")):
                if prev_start is not None and _to_min(iv["start"]) < prev_start:
                    errs.append(f"interval {i} starts before interval {i - 1}")
                prev_start = _to_min(iv["start"])

    try:
        if int(s.get("dailyTarget")) < 0:
            errs.append("dailyTarget must be 0 or more")
    except (TypeError, ValueError):
        errs.append("dailyTarget must be a whole number")

    ict = s.get("idealCycleTime", {})
    if not isinstance(ict, dict):
        errs.append("idealCycleTime must be an object keyed by machine")
    else:
        for m in MACHINES:
            try:
                if float(ict.get(m)) <= 0:
                    errs.append(f"ideal cycle time for {m} must be greater than 0")
            except (TypeError, ValueError):
                errs.append(f"ideal cycle time for {m} must be a number")
    return errs


def normalize_settings(s: dict) -> dict:
    """Coerce types and fill any missing keys from the defaults. Assumes validated."""
    d = dict(DEFAULT_SETTINGS)
    s = s or {}
    d["shiftStart"] = s.get("shiftStart", d["shiftStart"])
    d["shiftEnd"] = s.get("shiftEnd", d["shiftEnd"])
    d["buffers"] = [
        {"start": b["start"], "end": b["end"]}
        for b in s.get("buffers", d["buffers"])
        if isinstance(b, dict) and b.get("start") and b.get("end")
    ]
    d["intervals"] = [
        {
            "start": iv["start"],
            "end": iv["end"],
            "label": str(iv["label"]).strip(),
            "target": int(iv["target"]),
        }
        for iv in s.get("intervals", d["intervals"])
    ]
    d["dailyTarget"] = int(s.get("dailyTarget", d["dailyTarget"]))
    src_ict = s.get("idealCycleTime", {})
    d["idealCycleTime"] = {
        m: _num(src_ict.get(m, DEFAULT_SETTINGS["idealCycleTime"].get(m, 40)))
        for m in MACHINES
    }
    return d


def apply_settings(s: dict) -> None:
    """Refresh the module-level config names from a settings doc."""
    global SHIFT_START, SHIFT_END, BUFFERS, SHIFT_INTERVAL_BOUNDARIES
    global SHIFT_INTERVAL_LABELS, DAILY_TARGET, INTERVAL_TARGETS, IDEAL_CYCLE_TIME
    global _current_settings

    d = normalize_settings(s)
    _current_settings = d

    SHIFT_START = d["shiftStart"]
    SHIFT_END = d["shiftEnd"]
    BUFFERS = [dict(b) for b in d["buffers"]]

    ivs = d["intervals"]
    SHIFT_INTERVAL_BOUNDARIES = [iv["start"] for iv in ivs] + [ivs[-1]["end"]]
    SHIFT_INTERVAL_LABELS = [iv["label"] for iv in ivs]
    INTERVAL_TARGETS = [int(iv["target"]) for iv in ivs]

    DAILY_TARGET = int(d["dailyTarget"])
    IDEAL_CYCLE_TIME = dict(d["idealCycleTime"])


def current_settings() -> dict:
    """The current editable settings as a plain dict (for GET /api/config)."""
    return {
        "shiftStart": SHIFT_START,
        "shiftEnd": SHIFT_END,
        "buffers": [dict(b) for b in BUFFERS],
        "intervals": [dict(iv) for iv in _current_settings["intervals"]],
        "dailyTarget": DAILY_TARGET,
        "idealCycleTime": dict(IDEAL_CYCLE_TIME),
    }


def _to_min(hhmm: str) -> int:
    h, m = hhmm.split(":")
    return int(h) * 60 + int(m)


def _num(v):
    f = float(v)
    return int(f) if f.is_integer() else f


apply_settings(DEFAULT_SETTINGS)
