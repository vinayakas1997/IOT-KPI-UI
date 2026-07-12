# Hourly Error Pattern (count + within-hour timing)

## What is it?
A per-interval chart showing error counts plus a per-machine timing track of exactly when within the interval each error happened, categorized machine/human/other.

## What is the KPI value of having it?
Within-interval timing reveals clustering patterns a simple count would miss, and the category split separates equipment issues from training/process issues.

## What things do we need to calculate it?
Derived from the shared downtime/alarm event list: each event's start time is bucketed into a shift interval and positioned by its offset into that interval's actual duration.

---
## PLC Register Specification

**Architecture**: Single alarm system covering all 5 machines. Each event is tagged with a machine ID. Events are stored in a ring buffer.

| Register Name | Type | R/W | Unit | Source | Description |
|---|---|---|---|---|---|
| `ALARM_LOG_INDEX_REG` | INT | RO | — | Line alarm PLC | Current write index in the alarm ring buffer (0..N−1). |
| `ALARM_LOG_SIZE_REG` | INT | RO | — | Line alarm PLC | Total ring buffer capacity (fixed, e.g. 100). |
| `ALARM_ENTRY_n_TIMESTAMP` | STRING/TIME | RO | HH:MM | Line alarm PLC | Time when entry n was triggered. |
| `ALARM_ENTRY_n_MACHINE_ID` | INT | RO | — | Line alarm PLC | Machine index (1–5), or 0 for line-level alarms. |
| `ALARM_ENTRY_n_CODE` | INT | RO | — | Line alarm PLC | Numeric alarm type code. |
| `ALARM_ENTRY_n_CATEGORY` | INT | RO | — | Line alarm PLC | 0 = machine, 1 = human, 2 = other. |
| `ALARM_ENTRY_n_DURATION_MIN` | REAL | RO | minutes | Line alarm PLC | Duration in minutes (filled when event clears; 0 if still active). |
| `ALARM_ENTRY_n_CAUSES_DOWNTIME` | BOOL | RO | — | Line alarm PLC | TRUE = event stopped production. |
| `ALARM_ENTRY_n_STATUS` | BOOL | RO | — | Line alarm PLC | TRUE = active, FALSE = cleared. |

### Calculation
1. Read ring buffer entries.
2. Bucket each event into a shift interval by its `TIMESTAMP`.
3. Per interval: error count = number of events. Within-interval position = `(eventTimestamp − intervalStart) / (intervalEnd − intervalStart) × 100%`.

### PLC Team Notes
- The same ring buffer serves the Live Alarm Log (doc 16), Shift Timeline (doc 14), and MTBF/MTTR (doc 17).
- `DURATION_MIN` is populated only when a stoppage event clears.
