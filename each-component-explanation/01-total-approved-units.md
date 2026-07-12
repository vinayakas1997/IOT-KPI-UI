# Total Approved Units

## What is it?
The count of units produced this shift that passed quality inspection, shown as the top-left scorecard number (e.g., `414`, derived from run time × rate rather than a longer cumulative period).

## What is the KPI value of having it?
It's the real-output anchor for downstream ratios like Defect % and Quality, letting supervisors judge pace against the shift target at a glance.

## What things do we need to calculate it?
A timestamped pass/fail result per unit from the **final quality inspection gate** (after Machine 5), tallied since shift start. The product travels through all 5 machines sequentially; only the final gate determines approved vs. rejected.

---
## PLC Register Specification

**Architecture**: Single line, 5 machines in sequence. Quality inspection is ONE gate at the end (after Machine 5). There is no per-machine quality gate.

| Register Name | Type | R/W | Unit | Source | Description |
|---|---|---|---|---|---|
| `PASSED_COUNT_REG` | DINT | RO | units | Quality gate PLC (after Machine 5) | Cumulative good units this shift. Incremented on each pass at final inspection. |
| `UNIT_COMPLETE_BIT` | BOOL | RO | — | Quality gate PLC | Pulses HIGH for ≥1 PLC scan each time a unit is fully evaluated (pass or fail) at the final gate. Used as a strobe to sample `PASS_OR_FAIL_BIT`. |
| `PASS_OR_FAIL_BIT` | BOOL | RO | — | Quality gate PLC | HIGH = unit passed; LOW = unit rejected. Sampled on rising edge of `UNIT_COMPLETE_BIT`. |
| `LINE_RUNNING_BIT` | BOOL | RO | — | Line controller PLC | HIGH while the line is actively producing (not in shift break, not fully stopped). Used to gate counting — units completed during break should not be counted. |

### Calculation
**Method A (Direct)**: `totalApprovedUnits = PASSED_COUNT_REG`
**Method B (Derived from bits)**: Count rising edges of `UNIT_COMPLETE_BIT` where `PASS_OR_FAIL_BIT = HIGH`.

### PLC Team Notes
- Both counters must be **retentive on PLC power cycle** so a brief power loss does not lose shift data.
- `UNIT_COMPLETE_BIT` pulse width must be ≥ PLC scan cycle so the dashboard's polling (every 1–5 s) does not miss a fast unit.
