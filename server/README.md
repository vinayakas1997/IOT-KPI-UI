# KPI Dashboard — Backend

FastAPI service that polls the machine's database every 5 s, stores a daily
snapshot in its own SQLite DB, and serves it to the React dashboard.

```
 machine DB (SQL Server)          this service                     React app
 ┌────────────────────┐  poll   ┌───────────────────────┐  HTTP  ┌────────────┐
 │ PLC registers /     │ ─5s──▶ │ poller → compute →     │ ◀────  │ useLiveData│
 │ counters / alarms   │        │ SQLite snapshot        │  /api  │ every 5s   │
 └────────────────────┘         │ + /api/snapshot        │        └────────────┘
        ▲                       └───────────────────────┘
        └── you write these SELECTs (app/machine_db.py)
```

## Run it (mock mode — zero setup)

```bash
cd server
python -m venv .venv
.venv\Scripts\activate            # Windows;  source .venv/bin/activate on *nix
pip install -r requirements.txt   # pyodbc line is optional in mock mode
copy .env.example .env            # cp on *nix
uvicorn app.main:app --reload --port 8000
```

Then in another terminal:

```bash
cd dashboard-app
npm install
npm run dev        # Vite proxies /api → http://127.0.0.1:8000
```

Open the Vite URL. The header shows a green **Live** dot once the poller has data.
`MOCK_TIME_SCALE=120 uvicorn ...` fast-forwards the simulated shift so you can
watch intervals fill.

## Go live against SQL Server

1. `pip install pyodbc` (and the *ODBC Driver for SQL Server*).
2. In `.env`: `MACHINE_DB_MODE=sqlserver` and fill the `MACHINE_DB_*` values.
3. Open **`app/machine_db.py`** → `_read_sqlserver()`. It has four `TODO: your SQL`
   blocks (line counters, per-interval counts, per-machine registers, alarm
   buffer). Replace each placeholder `SELECT` with a real query against your DB.
   The return shape is documented on the `MachineReading` dataclass — fill the
   fields, nothing else changes.
4. The **reset signal**: `_read_sqlserver()` returns `reset_signal` (0/1). Point
   it at whichever register/tag is your daily reset. A rising edge (0→1) archives
   the current day and re-bases every cumulative metric to zero. Until then you
   can test the behaviour with `POST /api/reset`.

Register names in the TODO comments come from
`each-component-explanation/00-PLC-REGISTER-MAP.md`.

## What resets, and when

Everything is partitioned by `reset_epoch`. The reset signal bumps the epoch;
from that moment cumulative signals (counts, energy, downtime minutes, alarm
list, time-in-state) start again from zero. Instantaneous signals (current cycle
time, current state) always show the latest value. The pre-reset day is kept in
`snapshot_history` (`GET /api/history`).

Config that is **not** machine data — shift times, break windows, daily/interval
targets, ideal cycle times, colours — lives in `app/config_data.py`.

## API

| Method | Path            | Purpose                                             |
|--------|-----------------|-----------------------------------------------------|
| GET    | `/api/health`   | poller status, mode, last poll time, current epoch  |
| GET    | `/api/snapshot` | full dashboard payload for the current epoch        |
| POST   | `/api/reset`    | manual reset (archive + re-base) — for testing      |
| GET    | `/api/history`  | archived snapshots from previous epochs             |

## Files

| File                  | Role                                                        |
|-----------------------|------------------------------------------------------------|
| `app/machine_db.py`   | **the seam** — mock + SQL Server reads, reset signal       |
| `app/compute.py`      | KPI math (Python port of the old `mockData.ts` chain)      |
| `app/poller.py`       | the 5 s loop: read → store → accumulate → handle reset     |
| `app/snapshot.py`     | assemble `/api/snapshot` from stored rows (re-base by epoch)|
| `app/rollover.py`     | reset / epoch handling                                     |
| `app/schema.sql`      | SQLite tables                                              |
| `app/config_data.py`  | non-machine config (schedule, targets, colours)           |
| `app/clock.py`        | real clock; a simulated shift clock in mock mode           |
