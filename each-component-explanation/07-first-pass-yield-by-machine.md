# First Pass Yield (FPY) by Machine

## What is it?
Per-machine first-attempt pass rates (e.g., 98%, 95%, 89%, 97%, 99%), isolating quality performance by station rather than the line-wide Defect %.

## What is the KPI value of having it?
It pinpoints which specific machine drives quality loss, often correlating with the Bottleneck Machine finding, and feeds the Line Health radar's averaged FPY.

## What things do we need to calculate it?
Per-machine, per-unit pass/fail results: `FPY = Units passed first inspection / Total units produced at that machine × 100`.

---
## PLC Register Specification

**Architecture**: The product visits all 5 machines sequentially. FPY measures whether **each machine's operation** succeeded on the first attempt — separate from the final quality gate after Machine 5.

Example flow:
- Machine 1 welds → operation succeeded? (yes → continues, no → rework at M1)
- Machine 2 drills → operation succeeded? (yes → continues, no → rework at M2)
- ...
- Machine 5 tests → operation succeeded? (yes → continues to Quality Gate)

FPY ≠ final pass rate. A unit can pass Machine 3's operation but still fail at the final quality gate.

| Register Name | Type | R/W | Unit | Source | Description |
|---|---|---|---|---|---|
| `MACHINE_1_OP_PASSED_REG` | DINT | RO | units | Machine 1 PLC | Units where Machine 1's operation succeeded on first attempt. |
| `MACHINE_1_OP_TOTAL_REG` | DINT | RO | units | Machine 1 PLC | Total units processed at Machine 1 (pass + fail at this station). |
| `MACHINE_2_OP_PASSED_REG` | DINT | RO | units | Machine 2 PLC | Same for Machine 2. |
| `MACHINE_2_OP_TOTAL_REG` | DINT | RO | units | Machine 2 PLC | Same for Machine 2. |
| `MACHINE_3_OP_PASSED_REG` | DINT | RO | units | Machine 3 PLC | Same for Machine 3. |
| `MACHINE_3_OP_TOTAL_REG` | DINT | RO | units | Machine 3 PLC | Same for Machine 3. |
| `MACHINE_4_OP_PASSED_REG` | DINT | RO | units | Machine 4 PLC | Same for Machine 4. |
| `MACHINE_4_OP_TOTAL_REG` | DINT | RO | units | Machine 4 PLC | Same for Machine 4. |
| `MACHINE_5_OP_PASSED_REG` | DINT | RO | units | Machine 5 PLC | Same for Machine 5. |
| `MACHINE_5_OP_TOTAL_REG` | DINT | RO | units | Machine 5 PLC | Same for Machine 5. |

**Method B — Derive from Bits (if direct counters unavailable)**
| Register | Type | R/W | Description |
|---|---|---|---|
| `MACHINE_n_OP_COMPLETE_BIT` | BOOL | RO | Pulses HIGH when machine n completes its operation on one unit. |
| `MACHINE_n_OP_PASS_BIT` | BOOL | RO | Sampled on rising edge: HIGH = operation succeeded, LOW = failed. |

Dashboard counts rising edges of `MACHINE_n_OP_COMPLETE_BIT` for total, and counts only those where `MACHINE_n_OP_PASS_BIT = HIGH` for passed.

### Calculation
```
fpy_n = MACHINE_n_OP_PASSED_REG / MACHINE_n_OP_TOTAL_REG × 100
```
If `MACHINE_n_OP_TOTAL_REG = 0`, display `—` (no data).

### PLC Team Notes
- `MACHINE_n_OP_PASSED_REG ≤ MACHINE_n_OP_TOTAL_REG` must always hold.
- FPY at each machine is **independent** of the final quality gate. Machine 3 may have 100% FPY (its drill operation always works) while the final gate rejects 14% of finished units (for other reasons).
- If a machine does not have an operation-level pass/fail sensor (e.g. simple conveyor), it can be excluded — set registers to 0 and mark as N/A on the dashboard.
