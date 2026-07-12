# OEE % Analysis

## What is it?
The Overall Equipment Effectiveness card: Availability, Performance, and Quality sub-factors plus one combined percentage, the standard summary of how well the line used its available time.

Availability asks: of the time the line was scheduled to run, how much of it was actually spent running? It drops for changeovers, breakdowns, and any stop — planned or unplanned — that eats into the shift.

Performance asks: while the line was running, was it running at its rated speed? It drops whenever the bottleneck machine is running slower than its ideal cycle time, even with zero stoppages — this is pure speed loss, not downtime.

Quality asks: of everything actually produced, how much was good on the first try? It drops for scrap, rework, and rejects — this is the same ratio the Defect Percentage card reports, just expressed the other way round.

## What is the KPI value of having it?
The combined percentage is the one number a manager can watch to judge overall equipment effectiveness for a shift, but the real value is diagnostic: each of the three sub-factors points to a completely different fix. Low Availability means chase downtime and changeovers. Low Performance means the bottleneck is running slow even though it's up — look at Cycle Time Analysis and the Bottleneck Machine card. Low Quality means chase defects, not machine speed.

Because the three factors multiply rather than average, a single weak one drags the whole OEE down even if the other two are strong. In this dashboard's own numbers, Availability 73%, Performance 78%, and Quality 86% combine to just 49% OEE — each factor looks "okay" on its own, but the product compounds the loss. Reaching the textbook "world class" benchmark of 85% OEE requires all three factors to be strong at the same time, typically each above roughly 95%.

Availability, Performance, and Quality are also three of the six spokes on the Overall Line Health radar — they feed it directly, unmodified. So a spoke shrinking on the radar always traces straight back to one specific row on this card. Availability x Performance alone, without Quality, is exactly what the Plan Achieve % card reports — so Plan Achieve % answers "did we hit the production number" while OEE additionally asks "and was what we made actually good."

## What things do we need to calculate it?
Availability = Run Time / Planned Production Time, so only downtime against the planned schedule counts against it.

Performance = Bottleneck's ideal cycle time / actual cycle time. It is measured on the bottleneck specifically, because the bottleneck's pace is what caps the whole line's output — this is the same actual cycle time driven up by Blocked/Starved waiting described on the Machine Utilization card.

Quality = Total Approved Units / (Total Approved Units + Defects) — the inverse of the ratio the Defect Percentage card shows.

OEE % = Availability x Performance x Quality. It is a product of three fractions, not an average of three percentages — that's what makes a single weak factor so costly to the final number.

---
## PLC Register Specification

**Architecture**: Line-level OEE. Availability = ALL 5 machines running simultaneously. Performance = bottleneck's speed. Quality = final gate output.

### Registers for Availability

| Register Name | Type | R/W | Unit | Source | Description |
|---|---|---|---|---|---|
| `LOST_TIME_REG` | REAL | RO | minutes | Line controller PLC | Accumulated unplanned downtime — any machine in Fault/Down excludes the entire line. |

**Note**: Shift start/end times and buffer windows are entered in dashboard input boxes. `LOST_TIME_REG` is optional — dashboard computes from `MACHINE_n_STATE_REG` if not provided.

### Registers for Performance

| Register Name | Type | R/W | Unit | Source | Description |
|---|---|---|---|---|---|
| `BOTTLENECK_ACTUAL_CT_REG` | REAL | RO | seconds | Line controller PLC | Actual cycle time of the bottleneck machine (the slowest of 5 machines). |

**Note**: Ideal cycle time is entered in the dashboard input box — no PLC register needed.

### Registers for Quality

| Register Name | Type | R/W | Unit | Source | Description |
|---|---|---|---|---|---|
| `PASSED_COUNT_REG` | DINT | RO | units | Quality gate PLC (after Machine 5) | Same register as doc 01. |
| `DEFECT_COUNT_REG` | DINT | RO | units | Quality gate PLC (after Machine 5) | Same register as doc 02. |

### Calculation
```
plannedProductionMin = shiftEnd − shiftStart − Σ(bufferEnd − bufferStart)
                       (shift times entered in dashboard)
lostTimeMin          = LOST_TIME_REG (or dashboard computed from MACHINE_n_STATE_REG)
availabilityPct      = (plannedProductionMin − lostTimeMin) / plannedProductionMin × 100

performancePct       = idealCT / BOTTLENECK_ACTUAL_CT_REG × 100
                       (idealCT entered in dashboard input box)

totalUnits           = PASSED_COUNT_REG + DEFECT_COUNT_REG
qualityPct           = PASSED_COUNT_REG / totalUnits × 100

oeePct               = (availabilityPct × performancePct × qualityPct) / 10000
```

### PLC Team Notes
- Availability drops when **any** of the 5 machines stops — in a sequential line, one stopped machine stops the entire flow.
- The bottleneck machine is determined from the 5 per-machine `ACTUAL_CT_REG` registers plus user-entered ideal CT per machine.
