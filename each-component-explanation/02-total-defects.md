# Total Defects

## What is it?
The count of units produced this shift that failed quality inspection, shown next to Total Approved Units (e.g., `67`, shift-scoped rather than a longer cumulative period).

## What is the KPI value of having it?
It's an absolute, floor-relatable measure of quality loss that feeds Defect % and the Quality factor of OEE.

## What things do we need to calculate it?
The same per-unit inspection stream as Total Approved Units from the **final quality gate** (after Machine 5), counting "fail" results instead of "pass."

---
## PLC Register Specification

**Architecture**: Single quality gate at the end of the line (after Machine 5). Same source as doc 01.

| Register Name | Type | R/W | Unit | Source | Description |
|---|---|---|---|---|---|
| `DEFECT_COUNT_REG` | DINT | RO | units | Quality gate PLC (after Machine 5) | Cumulative rejected units this shift. Incremented on each fail at final inspection. |
| `UNIT_COMPLETE_BIT` | BOOL | RO | — | Quality gate PLC | Same bit as doc 01 — pulses each time a unit evaluation completes at the final gate. |
| `PASS_OR_FAIL_BIT` | BOOL | RO | — | Quality gate PLC | LOW = unit rejected. Sampled on rising edge of `UNIT_COMPLETE_BIT`. |

### Calculation
**Method A (Direct)**: `totalDefects = DEFECT_COUNT_REG`
**Method B (Derived)**: Count rising edges of `UNIT_COMPLETE_BIT` where `PASS_OR_FAIL_BIT = LOW`.

### PLC Team Notes
- `DEFECT_COUNT_REG` must follow the same retentive and reset conventions as `PASSED_COUNT_REG` (doc 01).
- The PLC must guarantee mutual exclusivity: for every `UNIT_COMPLETE_BIT` pulse, exactly one of `PASSED_COUNT_REG` or `DEFECT_COUNT_REG` increments — never both, never neither.
