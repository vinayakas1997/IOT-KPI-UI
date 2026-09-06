# Cycle Time Energy Consumption (Chart)

## What is it?
A scatter/trend chart of each machine's energy draw (kW) per cycle across the shift, mirroring the Cycle-Time Analysis chart but for power instead of speed.

## What is the KPI value of having it?
Abnormal energy draw for a given cycle time can flag mechanical strain or poor maintenance before failure, and supports energy-cost-per-unit reporting.

## What things do we need to calculate it?
Per-cycle energy consumption per machine from power meters/IoT sensors, aligned to the same shift interval buckets used elsewhere. Each machine's energy is measured independently for its own operation.

---
## PLC Register Specification

**Architecture**: 5 machines in sequence. Each machine has an independent power meter measuring its own energy consumption per cycle.

| Register Name | Type | R/W | Unit | Source | Description |
|---|---|---|---|---|---|
| `MACHINE_n_ENERGY_CONSMP_REG` | REAL | RO | kWh | Power meter / Machine n PLC | Energy consumed by machine n during its last completed cycle. |
| `MACHINE_n_CYCLE_COMPLETE_BIT` | BOOL | RO | — | Machine n PLC | Same bit as doc 10 — pulses when machine n completes one cycle. Dashboard samples `ENERGY_CONSMP_REG` on rising edge. |
| `MACHINE_n_ENERGY_TOTAL_REG` | REAL | RO | kWh | Power meter / Machine n PLC | Cumulative energy consumed by machine n shift-to-date. |

**Method B (fallback — power draw + cycle time)**
| Register | Type | R/W | Description |
|---|---|---|---|
| `MACHINE_n_POWER_DRAW_REG` | REAL | RO | kW instantaneous power draw of machine n. |

Dashboard: `energy = MACHINE_n_POWER_DRAW_REG × MACHINE_n_ACTUAL_CT_REG / 3600`

### Calculation
On each `MACHINE_n_CYCLE_COMPLETE_BIT` rising edge:
- X-axis: `MACHINE_n_ACTUAL_CT_REG` (from doc 10)
- Y-axis: `MACHINE_n_ENERGY_CONSMP_REG`
Plot as scatter chart + interval trend line.

### PLC Team Notes
- Per-cycle energy (`ENERGY_CONSMP_REG`) requires the PLC to integrate power draw over the machine's cycle duration and reset at the start of each cycle.
- If power meters are upstream/downstream of the PLC, the PLC reads them via Modbus or analog input at the start and end of each cycle, computing the delta.
