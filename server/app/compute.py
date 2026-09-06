"""
Turn a (re-based) machine reading + accumulators into the exact payload the
React dashboard already expects. This is the Python port of the calculation
chain that used to live in dashboard-app/src/data/mockData.ts.
"""
from __future__ import annotations

from datetime import datetime

from . import clock
from . import config_data as C

_STATE_NAMES = {0: "Running", 1: "Starved", 2: "Blocked", 3: "Fault", 4: "Idle"}
_CAT_NAMES = {0: "machine", 1: "human", 2: "other"}


def _to_min(hhmm: str) -> int:
    h, m = hhmm.split(":")
    return int(h) * 60 + int(m)


def _hhmm(total_min: float) -> str:
    total_min = int(round(total_min))
    return f"{total_min // 60:02d}:{total_min % 60:02d}"


def _clamp(v: float, lo: float = 0.0, hi: float = 100.0) -> float:
    return max(lo, min(hi, v))


def _buffer_minutes_elapsed(now: datetime) -> int:
    cur = now.hour * 60 + now.minute
    total = 0
    for b in C.BUFFERS:
        start, end = _to_min(b["start"]), _to_min(b["end"])
        if cur >= end:
            total += end - start
        elif cur > start:
            total += cur - start
    return total


def build_payload(reading: dict, state_seconds: dict, alarms: list[dict],
                  elapsed_since_reset_min: float, business_date: str) -> dict:
    now = clock.now()
    machines = reading["machines"]

    # ---- planned production time so far (minutes) --------------------------
    planned_min = max(elapsed_since_reset_min - _buffer_minutes_elapsed(now), 1.0)

    # ---- downtime events (from the alarm feed) ---------------------------
    downtime_events = _downtime_events(alarms, now)
    stage_breakdowns = _stage_breakdowns(downtime_events)
    lost_time_min = _union_minutes(downtime_events)

    # ---- OEE factors ----------------------------------------------------
    passed = int(reading["passed_count"])
    defect = int(reading["defect_count"])
    produced = passed + defect

    availability_pct = _clamp((planned_min - lost_time_min) / planned_min * 100)

    compare = [
        {"machine": m, "actual": round(machines[m]["actual_ct"], 1),
         "ideal": C.IDEAL_CYCLE_TIME[m]}
        for m in C.MACHINES
    ]
    bottleneck_machine = _pick_bottleneck(compare)
    b_actual = next(c["actual"] for c in compare if c["machine"] == bottleneck_machine)
    b_ideal = C.IDEAL_CYCLE_TIME[bottleneck_machine]

    performance_pct = _clamp(b_ideal / b_actual * 100) if b_actual else 0.0
    actual_uph = round(3600 / b_actual) if b_actual else 0

    quality_pct = _clamp(passed / produced * 100) if produced else 100.0
    defect_pct = _clamp(defect / produced * 100) if produced else 0.0

    oee_pct = round(availability_pct / 100 * performance_pct / 100 * quality_pct / 100 * 100)
    plan_achieve_pct = round(availability_pct / 100 * performance_pct / 100 * 100)

    # ---- per-machine cards --------------------------------------------
    fpy = []
    for m in C.MACHINES:
        ot = machines[m]["op_total"]
        op = machines[m]["op_passed"]
        fpy.append({"machine": m, "pct": round(op / ot * 100) if ot else 100})

    utilization = _utilization(state_seconds)
    reliability_pct = _reliability(machines, planned_min)

    energy_by_machine = {m: round(machines[m]["energy_total_kwh"], 2) for m in C.MACHINES}
    state_by_machine = {m: _STATE_NAMES.get(machines[m]["state"], "Idle") for m in C.MACHINES}

    # ---- time-bucketed charts --------------------------------------
    hours = _hours(reading["interval_produced"], now)
    err_hours = _err_hours(downtime_events)

    return {
        "generatedAt": now.isoformat(timespec="seconds"),
        "businessDate": business_date,
        "MACHINES": C.MACHINES,

        "scorecardTotals": {
            "totalApprovedUnits": passed,
            "totalDefects": defect,
            "defectPct": round(defect_pct),
        },
        "planAchieve": {
            "runTimeHours": round((planned_min - lost_time_min) / 60, 2),
            "lostTimeHours": round(lost_time_min / 60, 1),
            "avgUph": actual_uph,
            "planAchievePct": plan_achieve_pct,
        },
        "oeeBreakdown": {
            "availabilityPct": round(availability_pct),
            "performancePct": round(performance_pct),
            "qualityPct": round(quality_pct),
            "oeePct": oee_pct,
        },
        "bottleneck": {
            "machine": bottleneck_machine,
            "cycleTimeActual": round(b_actual, 1),
            "cycleTimeIdeal": b_ideal,
            "compare": compare,
        },
        "fpyByMachine": fpy,
        "activeAlarmsCount": int(reading["active_alarm_count"]),
        "utilization": utilization,
        "reliabilityPct": reliability_pct,

        "hours": hours,
        "dailyTarget": C.DAILY_TARGET,
        "errHours": err_hours,
        "downtimeEvents": downtime_events,
        "stageBreakdowns": stage_breakdowns,

        "energyByMachine": energy_by_machine,
        "stateByMachine": state_by_machine,

        "buffers": C.BUFFERS,
        "shiftDate": business_date,
        "shiftStart": C.SHIFT_START,
        "shiftEnd": C.SHIFT_END,
        "machineProfiles": C.MACHINE_PROFILES,
        "machineColors": C.MACHINE_COLORS,
    }


# --------------------------------------------------------------------------


def _pick_bottleneck(compare: list[dict]) -> str:
    positive = [(c["actual"] - c["ideal"], c["machine"]) for c in compare]
    over = [p for p in positive if p[0] > 0]
    if over:
        return max(over)[1]
    return max(compare, key=lambda c: c["actual"])["machine"]


def _downtime_events(alarms: list[dict], now: datetime) -> list[dict]:
    cur = now.hour * 60 + now.minute
    out = []
    for a in alarms:
        start_min = _to_min(a["ts_hhmm"])
        dur = a["duration_min"]
        if a["status"] == "active" and dur <= 0:
            dur = max(cur - start_min, 1)
        out.append({
            "machine": a["machine"],
            "start": a["ts_hhmm"],
            "durationMin": round(dur, 1),
            "category": a["category"],
            "description": a["description"],
            "descriptionJp": a["description_jp"],
            "status": a["status"],
            "causesDowntime": bool(a["causes_downtime"]),
        })
    out.sort(key=lambda e: _to_min(e["start"]))
    return out


def _stage_breakdowns(events: list[dict]) -> dict:
    result = {m: [] for m in C.MACHINES}
    for e in events:
        if not e["causesDowntime"]:
            continue
        if e["machine"] not in result:
            continue
        s = _to_min(e["start"])
        result[e["machine"]].append({"start": e["start"], "end": _hhmm(s + e["durationMin"])})
    return result


def _union_minutes(events: list[dict]) -> float:
    spans = sorted(
        (_to_min(e["start"]), _to_min(e["start"]) + e["durationMin"])
        for e in events if e["causesDowntime"]
    )
    if not spans:
        return 0.0
    total = 0.0
    cs, ce = spans[0]
    for s, e in spans[1:]:
        if s <= ce:
            ce = max(ce, e)
        else:
            total += ce - cs
            cs, ce = s, e
    total += ce - cs
    return round(total, 1)


def _utilization(state_seconds: dict) -> list[dict]:
    out = []
    for m in C.MACHINES:
        s = state_seconds.get(m, {})
        total = sum(s.values())
        if total <= 0:
            out.append({"machine": m, "runPct": 0, "starvedPct": 0, "blockedPct": 0})
            continue
        out.append({
            "machine": m,
            "runPct": round(s.get(0, 0) / total * 100),
            "starvedPct": round(s.get(1, 0) / total * 100),
            "blockedPct": round(s.get(2, 0) / total * 100),
        })
    return out


def _reliability(machines: dict, planned_min: float) -> int:
    ratios = []
    for m in C.MACHINES:
        down = machines[m]["total_down_min"]
        up = max(planned_min - down, 0)
        ratios.append(up / planned_min if planned_min else 1.0)
    return round(sum(ratios) / len(ratios) * 100) if ratios else 0


def _hours(interval_produced: list[int], now: datetime) -> list[dict]:
    cur = now.hour * 60 + now.minute
    bounds = [_to_min(b) for b in C.SHIFT_INTERVAL_BOUNDARIES]
    out = []
    for i, label in enumerate(C.SHIFT_INTERVAL_LABELS):
        lo, hi = bounds[i], bounds[i + 1]
        produced = interval_produced[i] if i < len(interval_produced) else 0
        target = C.INTERVAL_TARGETS[i] if i < len(C.INTERVAL_TARGETS) else 0
        if cur >= hi:
            status = "done"
        elif cur >= lo:
            status = "current"
        else:
            status = "future"
        row = {"label": label, "target": target, "produced": produced, "status": status}
        if status == "done" and produced < target:
            row["annotation"] = "*"
        out.append(row)
    return out


def _err_hours(events: list[dict]) -> list[dict]:
    bounds = [_to_min(b) for b in C.SHIFT_INTERVAL_BOUNDARIES]
    out = []
    for i, label in enumerate(C.SHIFT_INTERVAL_LABELS):
        lo, hi = bounds[i], bounds[i + 1]
        bucket = [
            {"min": _to_min(e["start"]) - lo, "cat": e["category"], "machine": e["machine"]}
            for e in events if lo <= _to_min(e["start"]) < hi
        ]
        out.append({"label": label, "events": bucket, "durationMin": hi - lo})
    return out
