# Active Alarms

## What is it?
A real-time count of currently open/unresolved alarms across the line (e.g., `2`), not a historical total.

## What is the KPI value of having it?
It's a leading indicator — unresolved alarms often precede stoppages or defects — that prompts a response before escalation.

## What things do we need to calculate it?
`Active Alarms = count(events where status = "active")` from the shared downtime/alarm event feed.

---
## PLC Register Specification

**Architecture**: Single alarm system covering all 5 machines. Each alarm event is tagged with a machine ID (1–5). Line-level alarms use machine ID 0.

| Register Name | Type | R/W | Unit | Source | Description |
|---|---|---|---|---|---|
| `ALARM_COUNT_REG` | INT | RO | count | Line alarm PLC | Current count of active (unresolved) alarms across all machines. |
| `ALARM_LOG_INDEX_REG` | INT | RO | — | Line alarm PLC | Current write position in the alarm ring buffer (0..N−1). See doc 16 for the ring buffer entry structure. |

**Method B — Bitmask (Fallback for limited register space)**
| Register | Type | R/W | Description |
|---|---|---|---|
| `MACHINE_n_ALARM_BITMASK_REG` | DINT | RO | Bit 0..31 = one alarm type per bit active on machine n. |

### Calculation
```
activeAlarmsCount = ALARM_COUNT_REG
```

### PLC Team Notes
- `ALARM_COUNT_REG` must update in real time — decrement when an alarm clears, increment when a new alarm triggers.
- The ring buffer (doc 16) is the canonical source. This card uses only the count.
