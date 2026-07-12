# Live Error / Alarm Log

## What is it?
A scrolling, reverse-chronological table of individual error/alarm events with Time, Machine, Error description, and Status (Active/Cleared).

## What is the KPI value of having it?
It's the auditable detail behind the summary metrics (Active Alarms, Hourly Error Pattern, MTBF/MTTR) — the place to check exactly what happened and when.

## What things do we need to calculate it?
No aggregation needed — it's the shared downtime/alarm event list itself, sorted by most recent first.

---
## PLC Register Specification

**Architecture**: Single alarm ring buffer covering all 5 machines. Each entry is tagged with a machine ID (1–5) or 0 for line-level alarms.

| Register Name | Type | R/W | Unit | Source | Description |
|---|---|---|---|---|---|
| `ALARM_LOG_INDEX_REG` | INT | RO | — | Line alarm PLC | Current write index (0..N−1). Increments with each new alarm, wraps at buffer end. |
| `ALARM_LOG_SIZE_REG` | INT | RO | — | Line alarm PLC | Total buffer capacity (fixed, e.g. 100). |
| For each entry n (0..N−1): | | | | | |
| `ALARM_ENTRY_n_TIMESTAMP` | STRING/TIME | RO | HH:MM | Line alarm PLC | Timestamp when alarm n occurred. |
| `ALARM_ENTRY_n_MACHINE_ID` | INT | RO | — | Line alarm PLC | Machine index (1–5) or 0 for line-level. |
| `ALARM_ENTRY_n_CODE` | INT | RO | — | Line alarm PLC | Numeric alarm type code. |
| `ALARM_ENTRY_n_DESCRIPTION` | STRING(20) | RO | — | Line alarm PLC | Short English description. |
| `ALARM_ENTRY_n_DESCRIPTION_JP` | STRING(20) | RO | — | Line alarm PLC | Short Japanese description. |
| `ALARM_ENTRY_n_CATEGORY` | INT | RO | — | Line alarm PLC | 0=machine, 1=human, 2=other. |
| `ALARM_ENTRY_n_DURATION_MIN` | REAL | RO | minutes | Line alarm PLC | Duration (populated when event clears; 0 if still active). |
| `ALARM_ENTRY_n_STATUS` | BOOL | RO | — | Line alarm PLC | TRUE = active, FALSE = cleared. |
| `ALARM_ENTRY_n_CAUSES_DOWNTIME` | BOOL | RO | — | Line alarm PLC | TRUE = alarm stops production. |

### Calculation
1. Read `ALARM_LOG_INDEX_REG` and `ALARM_LOG_SIZE_REG`.
2. Read all entries from the ring buffer.
3. Sort by timestamp descending (most recent first).
4. Render table. Active alarms (STATUS = TRUE) are highlighted.

### PLC Team Notes
- Canonical source for docs 08 (Active Alarms), 13 (Hourly Error), 14 (Shift Timeline), and 17 (MTBF/MTTR).
- Write each entry **atomically** (all fields in one scan) to prevent partial reads.
- Ring buffer wraps: when index reaches end, next write resets to 0 (overwriting oldest).
- Dashboard tracks last-read index to read only new entries since last poll.
