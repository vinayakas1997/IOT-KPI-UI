# Overall Line Health (Radar Chart)

## What is it?
A hexagonal radar combining Availability, Performance, Quality, Reliability, Plan Achieve %, and First Pass Yield into one shape, plus a tile grid of the same six values.

## What is the KPI value of having it?
It's a single visual health snapshot that makes trade-offs visible (e.g., great Quality but poor Reliability) in a way one summary number like OEE would hide.

## What things do we need to calculate it?
Availability/Performance/Quality from the OEE card, Plan Achieve % from its own card, FPY averaged across machines, and Reliability from MTBF/MTTR — all normalized to 0–100%.

---
## PLC Register Specification

**Architecture**: Composite view — no unique registers. All 6 spokes are derived from other components' registers.

| Spoke | Source Card | Source Registers |
|---|---|---|
| **Availability** | OEE (doc 05) | `PLANNED_PRODUCTION_TIME_REG`, `LOST_TIME_REG` |
| **Performance** | OEE (doc 05) | `BOTTLENECK_ACTUAL_CT_REG`, `BOTTLENECK_IDEAL_CT_REG` |
| **Quality** | OEE (doc 05) | `PASSED_COUNT_REG`, `DEFECT_COUNT_REG` (final quality gate) |
| **Plan Achieve %** | Plan Achieve (doc 04) | Same Availability + Performance sources |
| **First Pass Yield** | FPY by Machine (doc 07) | `MACHINE_n_OP_PASSED_REG`, `MACHINE_n_OP_TOTAL_REG` per machine |
| **Reliability** | MTBF/MTTR (doc 17) | Derived from alarm ring buffer down events per machine |

### Calculation
```
fpyAvg        = average of (MACHINE_n_OP_PASSED_REG / MACHINE_n_OP_TOTAL_REG) across n=1..5
reliabilityPct = normalized MTBF/MTTR score (see doc 17)
```
All 6 values normalized to 0–100% on the radar.

### PLC Team Notes
- No dedicated PLC registers needed. If polling load is a concern, the PLC can pre-compute and publish 6 REAL registers (`RADAR_AVAIL_REG`, etc.) for a single read.
