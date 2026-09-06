# Cycle-Time Analysis (Chart)

## What is it?
A scatter/trend chart of individual unit cycle times per machine across the shift, with a smoothed per-interval average trend line.

## What is the KPI value of having it?
It reveals cycle-time drift and outlier spikes a single average would hide, and supports validating the Bottleneck Machine finding.

## What things do we need to calculate it?
Per-unit, timestamped cycle times per machine, grouped into the shift's interval buckets for the trend average. Each machine has its own cycle time for its specific operation on the product as it passes through.

---
## PLC Register Specification

**Architecture**: 5 machines in sequence. Each machine's `ACTUAL_CT_REG` measures the time that machine spends on its one operation step per unit. Machine 3's cycle time is independent of Machine 2's.

| Register Name | Type | R/W | Unit | Source | Description |
|---|---|---|---|---|---|
| `MACHINE_n_ACTUAL_CT_REG` | REAL | RO | seconds | Machine n PLC (n=1..5) | Cycle time of the most recently completed cycle on machine n. Instantaneous value. |
| `MACHINE_n_CYCLE_COMPLETE_BIT` | BOOL | RO | — | Machine n PLC | Pulses HIGH for ≥1 scan when machine n completes one cycle. Dashboard samples `ACTUAL_CT_REG` on rising edge. |

**Method B — Rolling History Buffer (if dashboard needs to catch up after disconnect)**
| Register | Type | R/W | Description |
|---|---|---|---|
| `MACHINE_n_CT_HISTORY_INDEX_REG` | INT | RO | Current write index in a rolling buffer of last N cycle times for machine n. |
| `MACHINE_n_CT_HISTORY_n_REG` | REAL | RO | Individual entries in the rolling buffer. |

### Calculation
On each `MACHINE_n_CYCLE_COMPLETE_BIT` rising edge:
- Record (timestamp, `MACHINE_n_ACTUAL_CT_REG`) pair.
- Plot as scatter points.
- Group by shift interval for the trend line average.

### PLC Team Notes
- Use **instantaneous** cycle time here (not moving average) to show true variance. The bottleneck card (doc 06) uses a moving average of the same register.
- The `MACHINE_n_CYCLE_COMPLETE_BIT` is used by: Cycle Time chart (this doc), Cycle Time Energy chart (doc 12), and Interval Production counting (doc 11 — specifically Machine 5's bit for final output).
