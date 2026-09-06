"""
============================================================================
 THE SEAM: reading the machine's real database.
============================================================================

Everything the dashboard shows is derived from ONE function, `read_machine()`,
which returns a `MachineReading`. There are two implementations:

  * mock       -> realistic fake data, no external DB. (MACHINE_DB_MODE=mock)
  * sqlserver  -> YOU fill in the SELECT statements below.  (MACHINE_DB_MODE=sqlserver)

To go live:
  1. Set MACHINE_DB_MODE=sqlserver and the MACHINE_DB_* vars in server/.env
  2. `pip install pyodbc`
  3. Replace every "TODO: your SQL" block in `_read_sqlserver()` with a query
     against your machine DB. The shape you must return is documented on
     `MachineReading` -- fill each field, that's it. Nothing else changes.

What happens to the data you return here:
  poller.py lands it into the INPUT tables every poll --
    line-level fields  -> in_line     (1 row)
    machines{}         -> in_machine  (5 rows)
    interval_produced  -> in_interval (6 rows)
    alarms[]           -> in_alarm    (N rows)
  snapshot.py then reads those tables back, re-bases against `baseline`, and
  computes the dashboard payload. See server/DATA-MODEL.md for the whole chain.

Register names referenced below come from
  each-component-explanation/00-PLC-REGISTER-MAP.md
============================================================================
"""
from __future__ import annotations

import random
from dataclasses import dataclass, field

from . import clock, config
from .config_data import MACHINES

# state codes: 0=Running 1=Starved 2=Blocked 3=Fault 4=Idle
STATE_RUNNING, STATE_STARVED, STATE_BLOCKED, STATE_FAULT, STATE_IDLE = range(5)


@dataclass
class MachinePoint:
    """Raw per-machine registers for one machine, right now."""
    actual_ct: float          # MACHINE_n_ACTUAL_CT_REG  -- seconds, last cycle
    state: int                # MACHINE_n_STATE_REG      -- 0..4
    op_passed: int            # MACHINE_n_OP_PASSED_REG  -- cumulative
    op_total: int             # MACHINE_n_OP_TOTAL_REG   -- cumulative
    energy_total_kwh: float   # MACHINE_n_ENERGY_TOTAL_REG -- cumulative
    failure_count: int        # MACHINE_n_FAILURE_COUNT_REG -- cumulative
    total_down_min: float     # MACHINE_n_TOTAL_DOWN_MIN_REG -- cumulative


@dataclass
class AlarmRow:
    """One entry from the alarm ring buffer (ALARM_ENTRY_n_*)."""
    ts_hhmm: str
    machine_idx: int          # 1..5, or 0 for line-level
    code: int
    description: str
    description_jp: str
    category: int             # 0=machine 1=human 2=other
    duration_min: float
    active: bool
    causes_downtime: bool


@dataclass
class MachineReading:
    """
    Everything read from the machine DB in one poll. All cumulative counters are
    "since the machine's own reset"; the dashboard re-bases them on its reset
    signal, so absolute origin doesn't matter.
    """
    taken_at: str                                   # ISO timestamp
    passed_count: int                               # PASSED_COUNT_REG
    defect_count: int                               # DEFECT_COUNT_REG
    line_total_produced: int                        # LINE_TOTAL_PRODUCED_REG
    interval_produced: list[int]                    # INTERVAL_1..6_PRODUCED_REG (len 6)
    active_alarm_count: int                         # ALARM_COUNT_REG
    reset_signal: bool                              # <-- YOUR reset signal (see check note)
    machines: dict[str, MachinePoint] = field(default_factory=dict)
    alarms: list[AlarmRow] = field(default_factory=list)


# ===========================================================================
#  MOCK implementation
# ===========================================================================

_MOCK_ALARMS: list[AlarmRow] = []
_rng = random.Random(42)

_IDEAL = {"Machine 1": 36, "Machine 2": 40, "Machine 3": 45, "Machine 4": 38, "Machine 5": 32}
_ALARM_TEXT = [
    ("Conveyor jam forces stoppage", "コンベアジャムによる停止", 0, True),
    ("Mold temperature runaway shutdown", "金型温度異常上昇による停止", 0, True),
    ("Feed hopper blockage", "原料ホッパーの詰まり", 0, True),
    ("Operator emergency stop", "オペレーターによる非常停止", 1, True),
    ("Pressure spike detected", "圧力の急上昇を検知", 0, False),
    ("Cycle time exceeded threshold", "サイクルタイムが閾値を超過", 0, False),
    ("Nozzle alignment deviation", "ノズル位置のずれ", 0, False),
    ("Pneumatic pressure drop", "空圧の低下", 0, False),
]


def _mock_reading() -> MachineReading:
    now = clock.now()
    elapsed_min = max(clock.minutes_since_shift_start(), 1.0)

    machines: dict[str, MachinePoint] = {}
    line_produced = 0
    for i, m in enumerate(MACHINES):
        ideal = _IDEAL[m]
        # Machine 3 is the mock bottleneck: drifts noticeably slower.
        drift = 1.28 if m == "Machine 3" else 1.06
        actual_ct = round(ideal * drift + _rng.uniform(-1.5, 1.5), 1)

        r = _rng.random()
        if r < 0.80:
            state = STATE_RUNNING
        elif r < 0.88:
            state = STATE_STARVED if i > 0 else STATE_BLOCKED
        elif r < 0.95:
            state = STATE_BLOCKED if i < len(MACHINES) - 1 else STATE_STARVED
        else:
            state = STATE_FAULT

        cycles = int(elapsed_min * 60 / actual_ct)
        pass_rate = {"Machine 1": 0.98, "Machine 2": 0.95, "Machine 3": 0.89,
                     "Machine 4": 0.97, "Machine 5": 0.99}[m]
        op_total = cycles
        op_passed = int(cycles * pass_rate)
        energy = round(elapsed_min * {"Machine 1": 0.30, "Machine 2": 0.46, "Machine 3": 0.63,
                                      "Machine 4": 0.35, "Machine 5": 0.25}[m], 2)
        failures = int(elapsed_min // 90) + (1 if m == "Machine 3" else 0)
        down_min = round(failures * (18 if m == "Machine 3" else 9) * _rng.uniform(0.8, 1.2), 1)

        machines[m] = MachinePoint(actual_ct, state, op_passed, op_total, energy, failures, down_min)
        if m == "Machine 5":
            line_produced = op_total

    defect_rate = 0.14
    defect_count = int(line_produced * defect_rate)
    passed_count = line_produced - defect_count

    # bucket produced-so-far across the 6 intervals by wall-clock position
    interval_produced = _mock_intervals(line_produced, now)

    if not _MOCK_ALARMS:
        _seed_mock_alarms(now, elapsed_min)
    # occasionally append a fresh alarm at the current mock time
    elif _rng.random() < 0.12:
        _MOCK_ALARMS.append(_make_alarm(now.strftime("%H:%M")))
    active = sum(1 for a in _MOCK_ALARMS if a.active)

    return MachineReading(
        taken_at=now.isoformat(timespec="seconds"),
        passed_count=passed_count,
        defect_count=defect_count,
        line_total_produced=line_produced,
        interval_produced=interval_produced,
        active_alarm_count=active,
        reset_signal=False,  # mock never asserts it; use POST /api/reset to test
        machines=machines,
        alarms=list(_MOCK_ALARMS),
    )


def _make_alarm(ts_hhmm: str) -> AlarmRow:
    text, jp, cat, downs = _rng.choice(_ALARM_TEXT)
    return AlarmRow(
        ts_hhmm=ts_hhmm, machine_idx=_rng.randint(1, 5), code=100 + cat,
        description=text, description_jp=jp, category=cat,
        duration_min=round(_rng.uniform(12, 40), 1) if downs else round(_rng.uniform(2, 8), 1),
        active=bool(_rng.random() < 0.25), causes_downtime=downs,
    )


def _seed_mock_alarms(now, elapsed_min: float) -> None:
    """Populate a plausible shift-so-far history the first time we're polled."""
    start_min = now.hour * 60 + now.minute - int(elapsed_min)
    count = max(2, int(elapsed_min // 70))
    for _ in range(count):
        t = start_min + _rng.randint(10, max(11, int(elapsed_min) - 5))
        a = _make_alarm(f"{(t // 60) % 24:02d}:{t % 60:02d}")
        a.active = False  # historical events are already cleared
        _MOCK_ALARMS.append(a)
    _MOCK_ALARMS.sort(key=lambda a: a.ts_hhmm)


def _mock_intervals(total: int, now) -> list[int]:
    from .config_data import SHIFT_INTERVAL_BOUNDARIES

    def to_min(s: str) -> int:
        h, m = s.split(":")
        return int(h) * 60 + int(m)

    cur = now.hour * 60 + now.minute
    bounds = [to_min(b) for b in SHIFT_INTERVAL_BOUNDARIES]
    weights = []
    for i in range(6):
        lo, hi = bounds[i], bounds[i + 1]
        weights.append(max(0.0, min(1.0, (cur - lo) / (hi - lo))))
    wsum = sum(weights)
    if wsum <= 0:
        return [0] * 6
    out = [int(round(total * w / wsum)) for w in weights]
    out[-1] += total - sum(out)  # reconcile rounding
    return [max(v, 0) for v in out]


# ===========================================================================
#  SQL SERVER implementation  --  FILL IN THE QUERIES
# ===========================================================================

def _sqlserver_connect():
    import pyodbc  # imported lazily so `mock` mode needs no driver

    return pyodbc.connect(config.sqlserver_connection_string(), timeout=5)


def _read_sqlserver() -> MachineReading:
    # SCALE NOTE: at large row counts, don't SELECT whole tables every tick.
    # Use SQL Server Change Tracking / CDC, or add a ROWVERSION column and query
    # `WHERE rowversion > @last_seen` (persist @last_seen in the `meta` table).
    # Aggregate only over the delta + the current shift window.
    conn = _sqlserver_connect()
    try:
        cur = conn.cursor()
        now = clock.now()

        # -------------------------------------------------------------------
        # 1) LINE-LEVEL COUNTERS  -> in_line
        #    Return one row: passed_count, defect_count, line_total_produced,
        #                    active_alarm_count, reset_signal (0/1)
        # TODO: your SQL
        # -------------------------------------------------------------------
        row = cur.execute(
            """
            SELECT
                passed_count        = 0,   -- e.g. PASSED_COUNT_REG
                defect_count        = 0,   -- e.g. DEFECT_COUNT_REG
                line_total_produced = 0,   -- e.g. LINE_TOTAL_PRODUCED_REG
                active_alarm_count  = 0,   -- e.g. ALARM_COUNT_REG
                reset_signal        = 0    -- <-- your daily reset signal (0/1)
            """
        ).fetchone()

        # -------------------------------------------------------------------
        # 2) PER-INTERVAL PRODUCED  (6 values, interval 1..6)  -> in_interval
        # TODO: your SQL  -- return 6 rows ordered by interval_no, column `produced`
        # -------------------------------------------------------------------
        interval_rows = cur.execute(
            "SELECT produced = 0 WHERE 1 = 0"  # placeholder -> empty
        ).fetchall()
        interval_produced = [int(r.produced) for r in interval_rows] or [0] * 6
        interval_produced = (interval_produced + [0] * 6)[:6]

        # -------------------------------------------------------------------
        # 3) PER-MACHINE REGISTERS  -> in_machine
        #    Return one row per machine (5 rows), columns:
        #      machine_no, actual_ct, state, op_passed, op_total,
        #      energy_total_kwh, failure_count, total_down_min
        # TODO: your SQL
        # -------------------------------------------------------------------
        machine_rows = cur.execute(
            "SELECT machine_no = 0, actual_ct = 0.0, state = 4, op_passed = 0, "
            "op_total = 0, energy_total_kwh = 0.0, failure_count = 0, "
            "total_down_min = 0.0 WHERE 1 = 0"
        ).fetchall()

        machines: dict[str, MachinePoint] = {}
        by_no = {int(r.machine_no): r for r in machine_rows}
        for idx, name in enumerate(MACHINES, start=1):
            r = by_no.get(idx)
            if r is None:
                machines[name] = MachinePoint(0.0, STATE_IDLE, 0, 0, 0.0, 0, 0.0)
            else:
                machines[name] = MachinePoint(
                    float(r.actual_ct), int(r.state), int(r.op_passed), int(r.op_total),
                    float(r.energy_total_kwh), int(r.failure_count), float(r.total_down_min),
                )

        # -------------------------------------------------------------------
        # 4) ALARM RING BUFFER  -> in_alarm
        #    Return rows: ts_hhmm, machine_no, code, description, description_jp,
        #                 category (0/1/2), duration_min, active (0/1), causes_downtime (0/1)
        # TODO: your SQL
        # -------------------------------------------------------------------
        alarm_rows = cur.execute(
            "SELECT ts_hhmm = '', machine_no = 0, code = 0, description = '', "
            "description_jp = '', category = 0, duration_min = 0.0, active = 0, "
            "causes_downtime = 0 WHERE 1 = 0"
        ).fetchall()
        alarms = [
            AlarmRow(
                ts_hhmm=str(a.ts_hhmm), machine_idx=int(a.machine_no), code=int(a.code),
                description=str(a.description), description_jp=str(a.description_jp),
                category=int(a.category), duration_min=float(a.duration_min),
                active=bool(a.active), causes_downtime=bool(a.causes_downtime),
            )
            for a in alarm_rows
        ]

        return MachineReading(
            taken_at=now.isoformat(timespec="seconds"),
            passed_count=int(row.passed_count),
            defect_count=int(row.defect_count),
            line_total_produced=int(row.line_total_produced),
            interval_produced=interval_produced,
            active_alarm_count=int(row.active_alarm_count),
            reset_signal=bool(row.reset_signal),
            machines=machines,
            alarms=alarms,
        )
    finally:
        conn.close()


# ===========================================================================
#  Public entry point
# ===========================================================================

def read_machine() -> MachineReading:
    if config.MACHINE_DB_MODE == "sqlserver":
        return _read_sqlserver()
    return _mock_reading()


def reading_to_dict(r: MachineReading) -> dict:
    return {
        "taken_at": r.taken_at,
        "passed_count": r.passed_count,
        "defect_count": r.defect_count,
        "line_total_produced": r.line_total_produced,
        "interval_produced": r.interval_produced,
        "active_alarm_count": r.active_alarm_count,
        "reset_signal": r.reset_signal,
        "machines": {k: vars(v) for k, v in r.machines.items()},
        "alarms": [vars(a) for a in r.alarms],
    }
