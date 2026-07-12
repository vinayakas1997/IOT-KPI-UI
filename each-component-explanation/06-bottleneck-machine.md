# Bottleneck Machine

## What is it?
The machine with the highest cycle time on the line (e.g., "Machine 3, 58s"), which sets the pace for the whole sequential line.

## What is the KPI value of having it?
It directs improvement effort to the one machine that actually limits throughput — fixing any other machine won't help.

## What things do we need to calculate it?
Per-machine actual cycle time compared to a manually-entered ideal/rated cycle time, taking the machine with the largest gap. The product passes through all 5 machines sequentially — the bottleneck is the slowest one, which caps the entire line's throughput.

---
## PLC Register Specification

**Architecture**: 5 machines in sequence. Each machine has its own cycle time for its specific operation. The bottleneck is the machine where `actualCT − idealCT` is largest and positive.

| Register Name | Type | R/W | Unit | Source | Description |
|---|---|---|---|---|---|
| `MACHINE_n_ACTUAL_CT_REG` | REAL | RO | seconds | Machine n PLC (n=1..5) | Moving average cycle time of last N cycles on machine n. |
| `BOTTLENECK_ID_REG` | INT | RO | — | Line controller PLC | Machine index (1–5) the PLC identifies as bottleneck. **FULLY OPTIONAL — dashboard computes from per-machine CTs.** |

### Calculation

**Method A (dashboard computes — no BOTTLENECK_ID_REG needed):**
```
gap_n = MACHINE_n_ACTUAL_CT_REG − idealCT_n (for n = 1..5)
       where idealCT_n = value entered in dashboard input box for machine n
bottleneck = argmax(gap_n) where gap_n > 0. If all gaps ≤ 0, no bottleneck.
```

**Method B (if BOTTLENECK_ID_REG is provided):**
```
bottleneck = BOTTLENECK_ID_REG
```

### PLC Team Notes
- `BOTTLENECK_ID_REG` is **fully optional**. The 5 per-machine `ACTUAL_CT_REG` registers (Tier 1 Core) plus user-entered ideal CT values in dashboard input boxes are used by the dashboard to compute the bottleneck.
- `ACTUAL_CT_REG` should be a **moving average** of the last 10–20 cycles, not the instantaneous value.
- The 5 `MACHINE_n_ACTUAL_CT_REG` registers also feed the Cycle Time Analysis chart (doc 10).
