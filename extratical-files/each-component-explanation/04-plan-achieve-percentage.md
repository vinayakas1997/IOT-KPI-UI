# Plan Achieve %

## What is it?
A card showing Run Time, Lost Time, Average UPH, and one overall percentage (e.g., `57%`) for how much of the planned production time the line actually used well.

## What is the KPI value of having it?
It's a throughput/schedule-adherence metric, independent of quality, that feeds the Overall Line Health radar as one of six tracked metrics.

## What things do we need to calculate it?
`Plan Achieve % = Availability % × Performance %` — deliberately excluding Quality, so it reads as a distinct number from OEE.

Availability = time the line was actually running (all 5 machines running) / planned production time.
Performance = bottleneck machine's ideal cycle time / actual cycle time.

---
## PLC Register Specification

**Architecture**: Line-level KPI. The line is "running" only when ALL 5 machines are simultaneously running (no starved, blocked, or fault states). The bottleneck is the slowest of the 5 sequential machines.

| Register Name | Type | R/W | Unit | Source | Description |
|---|---|---|---|---|---|
| `PLANNED_PRODUCTION_TIME_REG` | REAL | RO | minutes | Line controller PLC | Total scheduled production time this shift (shift length − planned buffers). |
| `RUN_TIME_REG` | REAL | RO | minutes | Line controller PLC | Accumulated time ALL 5 machines were running simultaneously. |
| `LOST_TIME_REG` | REAL | RO | minutes | Line controller PLC | Accumulated unplanned downtime this shift (any machine down). |

**Note**: These 3 registers are optional — dashboard computes them from `MACHINE_n_STATE_REG` (Tier 1) if not provided.

### Calculation
```
availabilityPct  = (plannedProductionMin − lostTimeMin) / plannedProductionMin × 100
performancePct   = idealCT / actualCT × 100
                   where idealCT = user-entered in dashboard,
                         actualCT = bottleneck machine's ACTUAL_CT_REG
planAchievePct   = availabilityPct × performancePct / 100
```

### PLC Team Notes
- "Line running" means ALL 5 machines running. If any machine is stopped, the entire line stops.
- Ideal cycle time for the bottleneck is entered in the dashboard input box — no PLC register needed.
