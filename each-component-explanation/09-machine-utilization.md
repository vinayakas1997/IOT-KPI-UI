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
