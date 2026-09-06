-- Dashboard's own database (SQLite).  See server/DATA-MODEL.md for the full picture.
--
-- Everything is partitioned by `reset_epoch`: the reset signal bumps the epoch,
-- which makes every cumulative signal effectively start again from zero.
--
-- Three layers:
--   INPUT    in_line / in_machine / in_interval / in_alarm
--            -> filled every poll from the machine DB (see app/machine_db.py).
--            -> THIS is what your SELECT queries populate when you go live.
--   DERIVED  baseline / state_accum / snapshot_history
--            -> written by the backend, never by you.
--   CONFIG   lives in app/config_data.py (shift, targets, ideal cycle times,
--            colours) -- "dashboard input box" values, not machine data.

-- One-time cleanup of the pre-refactor cache tables (safe: pure derived data).
DROP TABLE IF EXISTS raw_reading;
DROP TABLE IF EXISTS alarm_event;

CREATE TABLE IF NOT EXISTS meta (
    key   TEXT PRIMARY KEY,
    value TEXT NOT NULL
);

-- Editable settings from the dashboard's own settings panel (shift schedule,
-- intervals, targets, ideal cycle times). One row. Seeded from
-- config_data.DEFAULT_SETTINGS on first run. See app/config_store.py.
CREATE TABLE IF NOT EXISTS app_config (
    id         INTEGER PRIMARY KEY CHECK (id = 1),
    payload    TEXT NOT NULL,                       -- JSON settings document
    updated_at TEXT NOT NULL
);

-- ===========================================================================
--  INPUT LAYER  -- one concern per table, upserted every poll
-- ===========================================================================

-- Line-level counters.  Exactly ONE row per reset_epoch.
CREATE TABLE IF NOT EXISTS in_line (
    reset_epoch         INTEGER PRIMARY KEY,
    business_date       TEXT    NOT NULL,           -- local YYYY-MM-DD
    passed_count        INTEGER NOT NULL DEFAULT 0, -- PASSED_COUNT_REG, cumulative
    defect_count        INTEGER NOT NULL DEFAULT 0, -- DEFECT_COUNT_REG, cumulative
    line_total_produced INTEGER NOT NULL DEFAULT 0, -- LINE_TOTAL_PRODUCED_REG, cumulative
    active_alarm_count  INTEGER NOT NULL DEFAULT 0, -- ALARM_COUNT_REG, instantaneous
    reset_signal        INTEGER NOT NULL DEFAULT 0, -- 0/1 daily reset signal
    updated_at          TEXT    NOT NULL            -- ISO ts of the poll that wrote this
);

-- Per-machine registers.  FIVE rows per reset_epoch (machine_no 1..5).
CREATE TABLE IF NOT EXISTS in_machine (
    reset_epoch      INTEGER NOT NULL,
    machine_no       INTEGER NOT NULL,              -- 1..5
    actual_ct        REAL    NOT NULL DEFAULT 0,    -- seconds, last cycle       (instantaneous)
    state            INTEGER NOT NULL DEFAULT 4,    -- 0=Run 1=Starved 2=Blocked 3=Fault 4=Idle
    op_passed        INTEGER NOT NULL DEFAULT 0,    -- cumulative
    op_total         INTEGER NOT NULL DEFAULT 0,    -- cumulative
    energy_total_kwh REAL    NOT NULL DEFAULT 0,    -- cumulative
    failure_count    INTEGER NOT NULL DEFAULT 0,    -- cumulative
    total_down_min   REAL    NOT NULL DEFAULT 0,    -- cumulative
    updated_at       TEXT    NOT NULL,
    PRIMARY KEY (reset_epoch, machine_no)
);

-- Per-interval production.  SIX rows per reset_epoch (interval_no 1..6).
CREATE TABLE IF NOT EXISTS in_interval (
    reset_epoch  INTEGER NOT NULL,
    interval_no  INTEGER NOT NULL,                  -- 1..6, matches config_data.SHIFT_INTERVAL_LABELS
    produced     INTEGER NOT NULL DEFAULT 0,        -- units produced in this interval so far
    updated_at   TEXT    NOT NULL,
    PRIMARY KEY (reset_epoch, interval_no)
);

-- Alarm / downtime events.  N rows.  `nkey` dedupes the same event across polls.
CREATE TABLE IF NOT EXISTS in_alarm (
    id              INTEGER PRIMARY KEY AUTOINCREMENT,
    reset_epoch     INTEGER NOT NULL,
    nkey            TEXT    NOT NULL,               -- natural key: ts|machine|code|description
    ts_hhmm         TEXT    NOT NULL,               -- "HH:MM"
    machine         TEXT    NOT NULL,
    code            INTEGER NOT NULL DEFAULT 0,
    description     TEXT    NOT NULL DEFAULT '',
    description_jp  TEXT    NOT NULL DEFAULT '',
    category        TEXT    NOT NULL DEFAULT 'machine',  -- machine | human | other
    duration_min    REAL    NOT NULL DEFAULT 0,
    status          TEXT    NOT NULL DEFAULT 'active',   -- active | cleared
    causes_downtime INTEGER NOT NULL DEFAULT 0,
    UNIQUE (reset_epoch, nkey)
);

-- ===========================================================================
--  DERIVED LAYER  -- written by the backend
-- ===========================================================================

-- The input counters captured at the moment of each reset.
-- Displayed cumulative value = (latest in_* - baseline).
CREATE TABLE IF NOT EXISTS baseline (
    reset_epoch INTEGER PRIMARY KEY,
    captured_ts TEXT NOT NULL,
    payload     TEXT NOT NULL                       -- JSON {passed_count,defect_count,...,machines:{}}
);

CREATE TABLE IF NOT EXISTS reset_marker (
    id     INTEGER PRIMARY KEY AUTOINCREMENT,
    ts     TEXT NOT NULL,
    reason TEXT NOT NULL                            -- 'signal' | 'manual' | 'startup'
);

-- Time-in-state accumulator, for Machine Utilization %.
-- state: 0=Running 1=Starved 2=Blocked 3=Fault 4=Idle
CREATE TABLE IF NOT EXISTS state_accum (
    reset_epoch INTEGER NOT NULL,
    machine     TEXT NOT NULL,
    state       INTEGER NOT NULL,
    seconds     REAL NOT NULL DEFAULT 0,
    PRIMARY KEY (reset_epoch, machine, state)
);

-- Full computed snapshot archived at each reset, for later trend charts.
CREATE TABLE IF NOT EXISTS snapshot_history (
    id           INTEGER PRIMARY KEY AUTOINCREMENT,
    reset_epoch  INTEGER NOT NULL,
    archived_ts  TEXT NOT NULL,
    payload      TEXT NOT NULL
);
