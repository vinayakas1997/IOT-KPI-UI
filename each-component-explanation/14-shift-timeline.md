# Shift Timeline (Running / Down / Buffer)

## What is it?
A per-machine timeline stretching across the shift, made of three colored blocks in sequence: Running (green), Down — unplanned (red), and Buffer — planned (grey). It's a time-ordered map of exactly when each machine was up, down, or on a scheduled stop, not just a summary count.

## What is the KPI value of having it?
A count or percentage tells you how much downtime happened; this timeline tells you when. That matters because the shape of downtime changes the fix: many thin red blocks scattered across the shift reads as frequent small failures, while a few wide red blocks reads as rare but long ones — visible at a glance, without doing any math on the summary numbers.

It also surfaces clustering that a single aggregate number hides. If red blocks bunch up right after a buffer window, that points at start-up-after-break issues rather than random equipment failure. If they cluster late in the shift, that points at fatigue, heat, or wear-in-shift rather than a design flaw.

The grey Buffer blocks matter just as much as the red ones: they mark time that was never expected to be productive, so a machine that looks idle during a buffer window is not misread as broken or unreliable.

This timeline is built from the same underlying downtime/alarm events as Active Alarms, the Hourly Error Pattern, and the Live Error/Alarm Log — those cards summarize the events by status or by hour-of-day; this is the one view that lays them out per machine, in the order they actually happened.

## What things do we need to calculate it?
Derived directly from the shared downtime/alarm event list's stoppage entries per machine, restricted to the shift window, each one placed on the timeline by its start time and duration. Buffer windows come from a separate scheduled-stop list (breaks, changeovers) and are placed the same way. No aggregation or averaging is needed here — only converting each event's start/duration into a left-offset and width as a percentage of the total shift length.

In a sequential line, a single down machine stops the entire line through cascade (see doc 09 for cascade rules).

---
## PLC Register Specification

**Architecture**: 5 machines in sequence. The timeline shows each machine's state over time. Due to cascade effects, a fault at any machine quickly propagates to all others.

### Machine State Registers
| Register Name | Type | R/W | Unit | Source | Description |
|---|---|---|---|---|---|
| `MACHINE_n_STATE_REG` | INT | RO | — | Machine n PLC (n=1..5) | 0=Running, 1=Starved, 2=Blocked, 3=Fault/Down, 4=Off/Idle. |

### Downtime Event Data (from alarm ring buffer)
| Register Name | Type | R/W | Unit | Source | Description |
|---|---|---|---|---|---|
| `ALARM_ENTRY_n_TIMESTAMP` | STRING / TIME | RO | HH:MM | Line alarm PLC | Start time of stoppage. |
| `ALARM_ENTRY_n_MACHINE_ID` | INT | RO | — | Line alarm PLC | Machine affected (1–5). |
| `ALARM_ENTRY_n_DURATION_MIN` | REAL | RO | minutes | Line alarm PLC | Duration (filled when event clears). |
| `ALARM_ENTRY_n_CAUSES_DOWNTIME` | BOOL | RO | — | Line alarm PLC | TRUE = production-stopping event. |

### Schedule Configuration (Dashboard Input — No PLC Registers)
Shift start/end times and buffer windows are entered in dashboard input boxes. No PLC registers needed.

### Calculation
1. Shift length = `SHIFT_END_TIME − SHIFT_START_TIME`.
2. Buffer blocks: grey, positioned at `left = (bufferStart − shiftStart) / shiftLength`, `width = (bufferEnd − bufferStart) / shiftLength`.
3. Down blocks: red, from alarm ring buffer entries where `CAUSES_DOWNTIME = TRUE`, positioned by timestamp and duration.
4. Remaining space = Running (green).

### PLC Team Notes
- Three block colors: **green** (Running), **red** (Down), **grey** (Buffer/planned stop).
- Due to cascade effects, when one machine faults, other machines will quickly show Starved/Blocked. The timeline will show this propagation visually.
- `BUFFER_n_*` registers are **outputs** written by HMI at shift start.
