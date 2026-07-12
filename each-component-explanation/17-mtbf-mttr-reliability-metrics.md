# MTBF / MTTR — Reliability Metrics

## What is it?
The two summary numbers shown next to each machine's row on the Shift Timeline: MTBF and MTTR, plus the small "Since `<date>`, `<time>`" label shown above the card that marks the start of the window they're calculated over — right now, that window is a single shift.

MTBF, mean time between failures, is the average stretch of running time a machine manages before it breaks down again. Higher is more reliable.

MTTR, mean time to repair, is the average time it takes to get the machine back up once it has failed. Lower is a faster repair response.

Only unplanned Down time counts as a failure here. Scheduled stops — breaks, changeovers, planned maintenance — are tracked separately as Buffer time on the timeline and never count against either number.

## What is the KPI value of having it?
MTBF and MTTR measure two different things and point to two different fixes. A low or shrinking MTBF means the machine is failing more often — invest in preventive maintenance and root-cause elimination, not faster repairs. A high MTTR means that however rare the failures are, each one costs a lot of time when it happens — invest in spare-parts availability, technician response time, or better diagnostics, not necessarily reliability engineering.

A machine can be strong on one and weak on the other: rarely fails but takes hours to fix each time, or fails constantly but is back up in minutes. Reading the two numbers side by side, next to the timeline's block pattern, tells you which failure profile you're looking at instead of leaving you to interpret one blended reliability score.

The "Since `<date>`" label exists so these numbers are never read as more authoritative than they are: MTBF and MTTR are averages, so they only become statistically meaningful once computed over many failures across many shifts — a handful of failures in one shift is too small a sample to trust as a stable reliability number. A shift with zero or one failure will show a MTBF/MTTR that swings wildly shift to shift; that volatility is expected for a single-shift sample, not a sign the numbers are wrong. Trust the trend across many shifts, not any single shift's absolute value.

## What things do we need to calculate it?
Derived from the shared downtime/alarm event list's stoppage entries per machine, restricted to the shift window.

Failures is the count of unplanned Down blocks for that machine in the shift. Total down time is the sum of their durations.

MTBF = (Shift length − Buffer time − Down time) / Failures. Buffer and Down time are both removed from the shift length first, so planned stoppages neither count as failures nor get averaged into the "up" time that MTBF is based on.

MTTR = Down time / Failures.

With zero failures so far in the shift, there is nothing to divide by: MTBF falls back to the running time itself and MTTR reads as 0 — that is a "no failures yet" state, not a literal zero repair time.

The "Since" label itself has no calculation of its own — it just echoes the same shift date and shift start already used by this math. Extending it to a real multi-shift or multi-day tracking window would require accumulating failure/downtime events across days, which the current data model does not yet do.

---
## PLC Register Specification

**Architecture**: Per-machine reliability derived from the alarm ring buffer. Each machine is a station in the sequential 5-machine line. Only unplanned down events count toward MTBF/MTTR.

### Schedule Configuration (Dashboard Input — No PLC Registers)
Shift start/end times and buffer windows are entered in dashboard input boxes. No PLC registers needed.

### Down Events (from alarm ring buffer — same as doc 16)
| Register | Type | R/W | Description |
|---|---|---|---|
| `ALARM_ENTRY_n_MACHINE_ID` | INT | RO | Machine affected (1–5). |
| `ALARM_ENTRY_n_TIMESTAMP` | STRING/TIME | RO | When stoppage began. |
| `ALARM_ENTRY_n_DURATION_MIN` | REAL | RO | Duration (filled when event clears). |
| `ALARM_ENTRY_n_CAUSES_DOWNTIME` | BOOL | RO | Must be TRUE to count as failure. |

### Pre-Computed Registers (Method A — Preferred)
| Register Name | Type | R/W | Unit | Source | Description |
|---|---|---|---|---|---|
| `MACHINE_n_FAILURE_COUNT_REG` | INT | RO | count | Machine n PLC | Number of unplanned down events this shift. |
| `MACHINE_n_TOTAL_DOWN_MIN_REG` | REAL | RO | minutes | Machine n PLC | Cumulative down time this shift. |
| `MACHINE_n_MTBF_REG` | REAL | RO | minutes | Machine n PLC | Mean time between failures. |
| `MACHINE_n_MTTR_REG` | REAL | RO | minutes | Machine n PLC | Mean time to repair. |

### Calculation
```
shiftLengthMin    = shiftEnd − shiftStart (user-entered in dashboard)
totalBufferMin    = Σ(bufferEnd − bufferStart) (user-entered in dashboard)
runningTimeMin    = shiftLengthMin − totalBufferMin − totalDownMin
mtbfMin           = runningTimeMin / failureCount   (if > 0, else runningTimeMin)
mttrMin           = totalDownMin / failureCount      (if > 0, else 0)
```

### PLC Team Notes
- Only **unplanned** downtime counts as failures. Scheduled buffers/breaks do not.
- `MACHINE_n_FAILURE_COUNT_REG` counts **distinct** down blocks — coalesce overlapping alarms from the same machine into a single failure.
- In a sequential line, a fault at Machine 3 will cause Machine 2 to show Blocked and Machine 4 to show Starved — these are NOT failures; they are cascade effects. Only the originating fault (Machine 3 in Fault state) should be counted. The PLC should tag the root-cause machine for each down event.
