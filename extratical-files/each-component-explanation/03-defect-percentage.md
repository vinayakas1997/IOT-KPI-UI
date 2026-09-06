# Defect %

## What is it?
The share of units produced this shift that were rejected as defective (e.g., `14%`), normalizing Total Defects against total production so quality is comparable across periods.

## What is the KPI value of having it?
It's a normalized quality gate for shift reviews and directly feeds the Quality component of OEE.

## What things do we need to calculate it?
`Defect % = Total Defects / (Total Approved Units + Total Defects) × 100`.

---
## PLC Register Specification

**Architecture**: Derived from the single final quality gate after Machine 5. Same registers as docs 01 and 02.

| Register Name | Type | R/W | Unit | Source | Description |
|---|---|---|---|---|---|
| `PASSED_COUNT_REG` | DINT | RO | units | Quality gate PLC (after Machine 5) | Same register as doc 01. |
| `DEFECT_COUNT_REG` | DINT | RO | units | Quality gate PLC (after Machine 5) | Same register as doc 02. |

### Calculation
```
totalUnits = PASSED_COUNT_REG + DEFECT_COUNT_REG
defectPct  = (DEFECT_COUNT_REG / totalUnits) × 100
```
If `totalUnits = 0`, display `—` (no data) or `0%`.

### PLC Team Notes
- Derived KPI — no dedicated PLC register required.
- If a single `DEFECT_PCT_REG (REAL)` is preferred, the PLC must handle divide-by-zero guard.
