# Production vs Target — Interval Tracking (incl. Overtime)

## What is it?
An interval-by-interval bar chart of units produced vs. target across the shift (including overtime blocks), plus a running "Produced Today" total against the daily target (e.g., `374/1000`).

## What is the KPI value of having it?
It catches shortfalls within the current interval rather than at shift end, and its cumulative total is the headline signal for whether overtime will be needed.

## What things do we need to calculate it?
A per-interval target (from the daily target split) and actual units produced per interval: `% = Produced / Target × 100`.

"Produced" = units that exit the final quality gate (after Machine 5). Only fully finished products count toward the target.

## Human Input (set once)
Daily Target and its per-interval split are entered once per shift by production planning, then held fixed while actuals track automatically against it.

---
## PLC Register Specification

**Architecture**: Production is counted at the end of the line (Machine 5's completion signal feeds the interval counters). Only finished products count toward targets.

| Register Name | Type | R/W | Unit | Source | Description |
|---|---|---|---|---|---|
| `DAILY_TARGET_REG` | DINT | R/W | units | HMI / Production planning | Total production target for the shift. Set at shift start. |
| `INTERVAL_n_TARGET_REG` | DINT | R/W | units | HMI / Production planning | Target for interval n (n=1..6). Set at shift start. |
| `INTERVAL_n_PRODUCED_REG` | DINT | RO | units | Line controller PLC | Units produced in interval n. Frozen at each interval boundary, resets at next boundary. |
| `LINE_TOTAL_PRODUCED_REG` | DINT | RO | units | Line controller PLC | Total units produced shift-to-date (sum of all interval counts). |

**Method B (fallback — no per-interval counters)**
| Register | Type | R/W | Description |
|---|---|---|---|
| `MACHINE_5_CYCLE_COMPLETE_BIT` | BOOL | RO | Pulses when Machine 5 finishes processing one unit. This is the final output signal. |
| `CURRENT_INTERVAL_ID_REG` | INT | RO | Current interval index (0..5). Changes at interval boundaries. |

Dashboard counts `MACHINE_5_CYCLE_COMPLETE_BIT` rising edges per interval, bucketed by `CURRENT_INTERVAL_ID_REG`.

### Calculation
```
pct_n          = INTERVAL_n_PRODUCED_REG / INTERVAL_n_TARGET_REG × 100
cumulativePct  = LINE_TOTAL_PRODUCED_REG / DAILY_TARGET_REG × 100
```

### PLC Team Notes
- The interval boundaries are: `["08:20","10:20","13:00","15:10","17:20","19:20","21:20"]`.
- At each boundary, the PLC freezes the current interval's produced counter, resets it to 0, and starts incrementing the next interval's counter.
- `MACHINE_5_CYCLE_COMPLETE_BIT` is the correct signal for counting finished products — Machine 5 is the last processing station before the quality gate. However, `INTERVAL_n_PRODUCED_REG` should count units that pass the quality gate (finished goods), not just Machine 5 output (which might include units that later fail at quality). Coordinate with the Quality Gate PLC.
