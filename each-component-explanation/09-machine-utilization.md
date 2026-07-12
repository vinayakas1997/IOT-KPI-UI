# Machine Utilization (Run / Starved / Blocked)

## What is it?
A stacked bar per machine splitting its time into three states: Running, Starved, and Blocked.

Running — the machine is actively performing its cycle: consuming input material and producing output.

Starved — the machine is available and able to run, but has nothing to work on yet. It is waiting for input from the station (or buffer) before it, so it sits idle even though nothing on it is broken.

Blocked — the machine has already finished a part but cannot release it, because the station (or buffer) after it is full or unavailable. It is ready and able, but has nowhere to put its output.

## What is the KPI value of having it?
It explains why a machine wasn't running, separating three different problems: low Running% points at the machine itself (slow cycle, quality stops, faults). Starved points upstream — something before this machine is too slow, stopped, or under-buffered. Blocked points downstream — something after this machine is too slow, stopped, or its buffer is full.

A machine that is mostly Blocked is usually healthy and fast — it is being throttled by whatever comes after it. A machine that is mostly Starved is waiting on whatever comes before it. Read this alongside the Bottleneck Machine card: the true bottleneck is the machine that everything else is Blocked or Starved because of, not necessarily the one with the worst Running%.

## How it affects Cycle Time
Starved and Blocked time do not change a machine's own net cycle time — the physical time it takes to make one part once it is actually running. What they change is the effective cycle time seen from outside: the elapsed clock time per unit, which includes any time spent waiting.

Effective cycle time = Net cycle time + Starved time + Blocked time, per unit. A machine can have an excellent rated cycle time on paper and still produce far below that rate, purely because part of the shift is spent waiting rather than broken.

This also cascades along the line. Blocked time on a machine is always caused by a problem one step downstream — a slower machine, a stoppage, or a full buffer. Starved time on a machine is always caused by a problem one step upstream. A single slow or stopped machine anywhere in the line shows up as Blocked time on everything before it and Starved time on everything after it, and with small buffers between stations that ripple can reach the whole line within minutes.

## What things do we need to calculate it?
A continuous per-machine state signal (running / starved / blocked) from the PLC or MES, not just a simple up/down flag. The three states are mutually exclusive at any instant and should sum to roughly 100% of shift time.

Percent in a state = time spent in that state divided by total shift time.

To connect utilization back to cycle time impact, also capture the per-unit net cycle time, so "slow because blocked or starved" can be separated from "slow because the process itself is slow."

---
## PLC Register Specification

**Architecture**: 5 machines in sequence. State cascade rules apply (see below).

| Register Name | Type | R/W | Unit | Source | Description |
|---|---|---|---|---|---|
| `MACHINE_n_STATE_REG` | INT | RO | — | Machine n PLC (n=1..5) | Current state: 0=Running, 1=Starved, 2=Blocked, 3=Fault/Down, 4=Off/Idle. Mutually exclusive. |

**Method B — Individual Bits (Fallback)**
| Register | Type | R/W | Description |
|---|---|---|---|
| `MACHINE_n_RUNNING_BIT` | BOOL | RO | HIGH = machine actively cycling. |
| `MACHINE_n_STARVED_BIT` | BOOL | RO | HIGH = waiting for input from upstream. |
| `MACHINE_n_BLOCKED_BIT` | BOOL | RO | HIGH = cannot discharge to downstream. |
| `MACHINE_n_FAULT_BIT` | BOOL | RO | HIGH = machine in error/down state. |
| `MACHINE_n_IDLE_BIT` | BOOL | RO | HIGH = powered but no active state. |

**Pre-computed percentages (PLC can optionally provide)**
| Register | Type | R/W | Description |
|---|---|---|---|
| `MACHINE_n_RUN_PCT_REG` | REAL | RO | % of shift time machine n was Running. |
| `MACHINE_n_STARVED_PCT_REG` | REAL | RO | % of shift time machine n was Starved. |
| `MACHINE_n_BLOCKED_PCT_REG` | REAL | RO | % of shift time machine n was Blocked. |

### State Cascade Rules (CRITICAL)

In a pure sequential line, **not all states are valid for all machines**:

| State | M1 | M2 | M3 | M4 | M5 |
|---|---|---|---|---|---|
| Running | Yes | Yes | Yes | Yes | Yes |
| Starved | **No** | Yes | Yes | Yes | Yes |
| Blocked | Yes | Yes | Yes | Yes | **No** |
| Fault | Yes | Yes | Yes | Yes | Yes |
| Off/Idle | Yes | Yes | Yes | Yes | Yes |

**Cascade example — Machine 3 faults:**
```
T+0:    M3 stops (Fault)
T+0.1:  M2 cannot discharge → M2 Blocked
        M4 has no input → M4 Starved
T+0.2:  M1 cannot discharge (M2 blocked) → M1 Blocked
        M5 has no input (M4 starved) → M5 Starved
```
Result: 1 machine stopped → entire line stopped within ~2 cycle times.

### Calculation
Option A — Dashboard samples `MACHINE_n_STATE_REG` at fixed interval (e.g. 1s) and accumulates percentages.
Option B — Dashboard reads pre-computed `MACHINE_n_RUN_PCT_REG`, `STARVED_PCT_REG`, `BLOCKED_PCT_REG`.

### PLC Team Notes
- The state signal is the **most valuable diagnostic** on the dashboard. Prioritize correct Running/Starved/Blocked/Fault transitions for each machine.
- Starved/Blocked at a middle machine (2,3,4) is always caused by a different machine — this is the key diagnostic that lets operators trace the line's true bottleneck.
