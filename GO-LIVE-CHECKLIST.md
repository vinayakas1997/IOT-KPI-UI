# Go-live checklist

Everything below is what's **left**. The dashboard itself (transform → `in_*` →
KPI compute → SSE push → wallboard, EN/JP, light/dark, liveness badge, config
Settings, Shift Reset, epoch/baseline/archive) is done and runs end-to-end in
mock mode today.

---

## 1. Machine DB connection

- [ ] `server/.env` → set `MACHINE_DB_MODE=sqlserver`
- [ ] `server/.env` → fill `MACHINE_DB_SERVER`, `MACHINE_DB_DATABASE`, `MACHINE_DB_USER`,
      `MACHINE_DB_PASSWORD`, `MACHINE_DB_DRIVER` (and `MACHINE_DB_EXTRA` if needed)
- [ ] `pip install pyodbc` into `server/.venv`
- [ ] Install the **ODBC Driver for SQL Server** on the machine running the backend
- [ ] `GET /api/health` → confirm `machineDbMode: "sqlserver"` and no connection error

---

## 2. SQL queries — the only real code you write

File: **`server/app/machine_db.py` → `_read_sqlserver()`**. Four `TODO: your SQL`
blocks. Each returns the shape documented on the `MachineReading` dataclass; the
poller lands it into `in_*` and everything downstream is automatic.

- [ ] **Block 1 — line counters** → `passed_count`, `defect_count`,
      `line_total_produced`, `active_alarm_count`, **`reset_signal` (0/1)**
- [ ] **Block 2 — per-interval produced** → 6 rows, `produced`, ordered by interval
- [ ] **Block 3 — per-machine registers** → 5 rows: `machine_no`, `actual_ct`,
      `state` (0–4), `op_passed`, `op_total`, `energy_total_kwh`, `failure_count`,
      `total_down_min`
- [ ] **Block 4 — alarm ring buffer** → `ts_hhmm`, `machine_no`, `code`,
      `description`, `description_jp`, `category` (0/1/2), `duration_min`,
      `active` (0/1), `causes_downtime` (0/1)
- [ ] **Scale note:** don't `SELECT` whole tables every tick. Use SQL Server
      Change Tracking / CDC, or a `ROWVERSION` column + `WHERE rowversion > @last`
      (persist `@last` in the `meta` table). Aggregate only over the delta + the
      current shift window.
- [ ] Verify with `GET /api/inputs` — the four `in_*` tables should show live rows

---

## 3. Reset

The reset **logic and endpoint already exist**. Nothing to build — just decide
how it's triggered:

- **Automatic (preferred):** Block 1's `reset_signal` returns `1` on your daily
  reset register/tag. Rising edge `0 → 1` → the backend archives the day and
  re-bases every cumulative metric to zero.
- **Manual:** ⚙ **Settings → Shift Reset** section → *Reset shift now* →
  *Confirm — zero all counters*. Calls `POST /api/reset`.
- [ ] Confirm: reset zeros every **live** number; **no DB data is deleted** — the
      day is archived to `snapshot_history`, old `reset_epoch` rows are kept,
      display = `current − baseline`.
- [ ] (Optional) If there is **no** machine reset signal and you want an automatic
      time-based reset at shift start, add that small check in `poller.poll_once`.

---

## 4. Operator config (data entry, not code)

Enter once via ⚙ **Settings** (persisted in `app_config`, applied on save):

- [ ] Shift start / end
- [ ] Break windows (≤ 2)
- [ ] The 6 intervals — start / end / label / **target** each
- [ ] Daily target (should ≈ sum of interval targets — the panel shows the sum)
- [ ] Ideal cycle time per machine

Code-only (edit `server/app/config_data.py` + restart): `MACHINES`
(names/count), `MACHINE_COLORS`, `MACHINE_PROFILES` (chart envelopes).

---

## 5. AI analysis panel

**Current state:** the panel renders and the text is generated **client-side**
from the snapshot (bottleneck + end-of-shift projection + top downtime cause).
Real logic, not a placeholder — but no LLM involved yet.

To make it an actual LLM read-out:

- [ ] **Backend endpoint** `GET /api/ai-summary` (or fold into the SSE payload)
      that returns `{ text: [...lines], recommendation, generatedAt }`
- [ ] **Cadence:** regenerate every *N* minutes (default 30) — value comes from
      Settings (`AI_EVERY_MIN`). Do **not** call the LLM on every poll.
- [ ] **Caching:** store the last generated text + timestamp; the wallboard just
      displays it and counts up "updated Xm ago". Regeneration is a background job.
- [ ] **Prompt input = the same snapshot the dashboard shows** (so the read-out
      can never contradict the tiles). Feed it: OEE + A/P/Q, plan-achieve,
      bottleneck machine + actual/ideal, active alarms, top downtime causes,
      utilization per machine, produced vs target + projection.
- [ ] **Prompt output contract:** 3 short insight lines (each tagged
      severity red/amber) + one `▶ Priority` action. Plain language, no jargon,
      must be < ~60 words total.
- [ ] **Model:** pick per cost/latency (a small fast model is fine — it's a
      summary, runs every 30 min). Key/config in `server/.env`.
- [ ] **Frontend:** swap the client-side synth in the AI panel for a fetch of
      `/api/ai-summary`; keep the robot avatar + "updated Xm ago · every 30m"
      stamp + the scan-burst animation on refresh.
- [ ] **Failure mode:** if the LLM call fails, keep showing the last good text
      (stamp goes stale) — never blank the panel.

---

## 6. Optional polish

- [ ] **Demo mode toggle** in the topbar — frontend-only: ignore the live stream,
      show the bundled sample snapshot with a light animator, badge → `DEMO`.
      For presentations / training when the line is down.
- [ ] Tighten `CORSMiddleware` `allow_origins` in `server/app/main.py` for prod.
- [ ] Front the SSE endpoint with nginx `proxy_buffering off;` (header already set).
