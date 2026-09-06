# Data model

How a machine reading becomes the dashboard. Three layers, kept deliberately
separate so every KPI is calculated from **one** place and nothing is mixed.

```
  machine's real DB                    dashboard DB (SQLite)                 React app
 ┌────────────────┐   machine_db.py   ┌──────────────────────┐  snapshot.py ┌──────────┐
 │  your SELECTs  │ ────────────────▶ │  INPUT tables (in_*)  │ ───────────▶ │ /api/    │
 │  (you write)   │   every 5 s       │  DERIVED tables       │  compute.py  │ snapshot │
 └────────────────┘                   │  + config_data.py     │              └──────────┘
                                      └──────────────────────┘
```

You only ever touch **two things**: the SELECT queries in
[`app/machine_db.py`](app/machine_db.py) and the constants in
[`app/config_data.py`](app/config_data.py). Everything downstream is automatic.

---

## Layer 1 — INPUT tables (filled every poll from the machine DB)

One concern per table. Upserted each poll, so each table always holds the
*current picture*: **1 / 5 / 6 / N** rows for the current `reset_epoch`.

### `in_line` — line-level counters (1 row)

| column | source register | type | feeds cards |
|---|---|---|---|
| `reset_epoch` | — | PK | partitioning |
| `business_date` | — | `YYYY-MM-DD` | — |
| `passed_count` | `PASSED_COUNT_REG` | cumulative | Total Approved Units, Defect %, OEE-Quality |
| `defect_count` | `DEFECT_COUNT_REG` | cumulative | Total Defects, Defect %, OEE-Quality |
| `line_total_produced` | `LINE_TOTAL_PRODUCED_REG` | cumulative | (informational) |
| `active_alarm_count` | `ALARM_COUNT_REG` | instantaneous | Active Alarms |
| `reset_signal` | your daily reset bit | 0/1 | triggers the rebase |
| `updated_at` | — | ISO ts | staleness dot |

### `in_machine` — per-machine registers (5 rows, `machine_no` 1..5)

| column | source register | type | feeds cards |
|---|---|---|---|
| `actual_ct` | `MACHINE_n_ACTUAL_CT_REG` | instantaneous | Bottleneck, Cycle Time chart, OEE-Performance |
| `state` | `MACHINE_n_STATE_REG` | 0..4 | Machine Utilization, OEE-Availability, Shift Timeline |
| `op_passed` | `MACHINE_n_OP_PASSED_REG` | cumulative | First Pass Yield |
| `op_total` | `MACHINE_n_OP_TOTAL_REG` | cumulative | First Pass Yield |
| `energy_total_kwh` | `MACHINE_n_ENERGY_TOTAL_REG` | cumulative | Energy chart |
| `failure_count` | `MACHINE_n_FAILURE_COUNT_REG` | cumulative | MTBF, Line Health |
| `total_down_min` | `MACHINE_n_TOTAL_DOWN_MIN_REG` | cumulative | MTTR, Reliability |

`state`: `0=Running 1=Starved 2=Blocked 3=Fault 4=Idle`.

### `in_interval` — per-interval production (6 rows, `interval_no` 1..6)

| column | type | feeds cards |
|---|---|---|
| `produced` | units so far in this interval | **Production vs Target**, Cycle Time Analysis |

`interval_no` lines up with `config_data.SHIFT_INTERVAL_LABELS`. Targets are
config, not machine data — see Layer 3.

### `in_alarm` — alarm / downtime events (N rows)

Keyed by `nkey = ts|machine|code|description`; a repeated event across polls
updates `duration_min` / `status` instead of inserting again.

| column | type | feeds cards |
|---|---|---|
| `ts_hhmm`, `machine`, `code` | — | Live Error Log, Hourly Error Pattern |
| `description`, `description_jp` | — | Live Error Log |
| `category` | `machine` \| `human` \| `other` | Hourly Error Pattern |
| `duration_min` | minutes | MTTR, downtime union |
| `status` | `active` \| `cleared` | Live Error Log, Active Alarms |
| `causes_downtime` | 0/1 | Shift Timeline, OEE-Availability |

---

## Layer 2 — DERIVED tables (backend writes, never you)

| table | written by | purpose |
|---|---|---|
| `baseline` | `rollover.py` on each reset | counters captured at reset moment; display = `latest in_* − baseline` |
| `state_accum` | `poller.py` each poll | seconds-in-state per machine, for Machine Utilization % |
| `snapshot_history` | `rollover.py` on each reset | full computed payload archived for trend charts (`/api/history`) |
| `reset_marker` / `meta` | everywhere | bookkeeping (epoch number, last poll ts, reset ts) |

---

## Layer 3 — CONFIG ([`app/config_data.py`](app/config_data.py))

Per the PLC register map these are **"dashboard input box"** values — they do not
come from the machine.

**Editable from the dashboard's settings panel** (gear icon, top-right). Persisted
in the `app_config` table, loaded at startup, re-applied instantly on save:

| setting | feeds |
|---|---|
| `shiftStart` / `shiftEnd` / `buffers` (≤2 breaks) | Shift Timeline, planned-time math |
| `intervals[]` — 6 rows of `start` / `end` / `label` / `target` | Production vs Target, Interval Error Pattern |
| `dailyTarget` | Production vs Target header |
| `idealCycleTime` per machine | Bottleneck, OEE-Performance |

API: `GET /api/config` · `PUT /api/config` (422 with a list of problems if
invalid) · `POST /api/config/reset`. Persistence + validation live in
[`app/config_store.py`](app/config_store.py) and `config_data.validate_settings`.

**Code-only** (edit the file and restart): `MACHINES` (names/count),
`MACHINE_COLORS`, `MACHINE_PROFILES` (chart envelopes).

---

## The poll cycle (`poller.poll_once`)

```
every POLL_INTERVAL_SECONDS:
  reading = machine_db.read_machine()          # mock, or your SELECTs
  if reading.reset_signal rising edge:
      archive current snapshot -> snapshot_history
      capture baseline, bump reset_epoch
  upsert 1  -> in_line
  upsert 5  -> in_machine
  upsert 6  -> in_interval
  upsert N  -> in_alarm
  accumulate -> state_accum
```

## The read path (`snapshot.build_current`, on every `GET /api/snapshot`)

```
read in_line + in_machine + in_interval    -> reassemble the reading dict
subtract baseline (cumulative fields only) -> rebased reading
read state_accum, in_alarm
compute.build_payload(...)                 -> the exact JSON the React app expects
```

## Daily reset

`in_line.reset_signal` going `0 → 1` captures a **baseline** of the current
counters and starts a new `reset_epoch`. Every cumulative card then shows
`current − baseline`, i.e. it starts again from zero. Config and alarm history
are **not** rebased. `POST /api/reset` does the same thing manually.

---

## Checking your queries

- `GET /api/inputs` — raw dump of the four `in_*` tables for the current epoch.
  Run it right after wiring up `machine_db.py` to confirm rows are landing.
- `GET /api/health` — mode, last poll timestamp, current epoch.
- `GET /api/snapshot` — the full computed payload.

## Going live checklist

1. `server/.env`: `MACHINE_DB_MODE=sqlserver` + `MACHINE_DB_*` connection vars.
2. `pip install pyodbc`.
3. Fill the four `TODO: your SQL` blocks in `app/machine_db.py::_read_sqlserver`.
4. Point `reset_signal` at your real daily-reset register.
5. `GET /api/inputs` to verify, then open the dashboard.
