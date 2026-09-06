# PLC Register Map — Single Line, 5 Sequential Machines

## Line Architecture

```
Material → [Machine 1] → [Machine 2] → [Machine 3] → [Machine 4] → [Machine 5] → [Quality Gate] → Output
```

A single product flows through all 5 machines in sequence. Each machine performs one operation step. After Machine 5, the finished product passes through a quality inspection gate.

## Register Categories

- **L** = Line-level (one register for the entire line)
- **M** = Per-machine (one register per machine, 5 instances)

## Priority Tiers

Every register below is tagged with a priority tier so the PLC team knows what to implement first:

| Tier | Label | Description |
|---|---|---|
| **T1** | 🔴 Core | Essential — dashboard is non-functional without these |
| **T2** | 🟡 Important | Enables key diagnostic features (FPY, Alarms) |
| **T3** | 🟢 Nice to have | Adds detail (Energy chart, pre-computed percentages) |
| **T4** | ⚪ Optional | Dashboard can compute these itself (Method B fallback) |

---

## 1. Production Counters

Used by components: 01, 02, 03, 05, 11, 15

### 1a. Good Units Count (L) — Tier: 🔴 Core

The final inspection gate after Machine 5 determines pass/fail.

**Method A — Direct Counter (Preferred)**
| Register | Type | R/W | Tier | Description |
|---|---|---|---|---|
| `PASSED_COUNT_REG` | DINT | RO | 🔴 T1 | Cumulative good units this shift. Incremented by the quality gate PLC each time a unit passes final inspection. |

**Method B — Derive from Bits (Fallback)**
| Register | Type | R/W | Tier | Description |
|---|---|---|---|---|
| `UNIT_COMPLETE_BIT` | BOOL | RO | 🟢 T3 | Pulses HIGH when the quality gate finishes evaluating one unit. |
| `PASS_OR_FAIL_BIT` | BOOL | RO | 🟢 T3 | HIGH = unit passed, LOW = rejected. Sampled on rising edge of `UNIT_COMPLETE_BIT`. |

Dashboard counts rising edges of `UNIT_COMPLETE_BIT` where `PASS_OR_FAIL_BIT = HIGH`.

### 1b. Defect Count (L) — Tier: 🔴 Core

**Method A — Direct Counter (Preferred)**
| Register | Type | R/W | Tier | Description |
|---|---|---|---|---|
| `DEFECT_COUNT_REG` | DINT | RO | 🔴 T1 | Cumulative rejected units this shift. Incremented by the quality gate PLC each time a unit fails final inspection. |

**Method B — Derive from Bits (Fallback)**
Same bits as 1a. Dashboard counts rising edges of `UNIT_COMPLETE_BIT` where `PASS_OR_FAIL_BIT = LOW`.

### 1c. Interval Production Counts (L) — Tier: 🟡 Important

**Method A (Preferred)**
| Register | Type | R/W | Tier | Description |
|---|---|---|---|---|
| `INTERVAL_1_PRODUCED_REG` | DINT | RO | 🟡 T2 | Units produced in interval 1 (frozen at interval boundary). |
| `INTERVAL_2_PRODUCED_REG` | DINT | RO | 🟡 T2 | Same for interval 2. |
| `INTERVAL_3_PRODUCED_REG` | DINT | RO | 🟡 T2 | Same for interval 3. |
| `INTERVAL_4_PRODUCED_REG` | DINT | RO | 🟡 T2 | Same for interval 4. |
| `INTERVAL_5_PRODUCED_REG` | DINT | RO | 🟡 T2 | Same for interval 5. |
| `INTERVAL_6_PRODUCED_REG` | DINT | RO | 🟡 T2 | Same for interval 6. |
| `LINE_TOTAL_PRODUCED_REG` | DINT | RO | 🟡 T2 | Total units produced shift-to-date (sum of all intervals). |

**Method B (Fallback) — ⚪ T4**
Dashboard reads `MACHINE_5_CYCLE_COMPLETE_BIT` at interval boundaries and buckets counts itself using timestamps.

---

## 2. Cycle Time

Used by components: 05, 06, 10, 12

Each machine has its own cycle time for its specific operation step. The bottleneck is the machine with the slowest cycle time.

### 2a. Actual Cycle Time Per Machine (M) — Tier: 🔴 Core

**Method A — Direct Register (Preferred)**
| Register | Type | R/W | Tier | Description |
|---|---|---|---|---|
| `MACHINE_n_ACTUAL_CT_REG` | REAL | RO | 🔴 T1 | Seconds. Cycle time of the most recently completed cycle at machine n. |

**Method B — Derive from Timestamps (Fallback) — 🟡 T2**
| Register | Type | R/W | Tier | Description |
|---|---|---|---|---|
| `MACHINE_n_CYCLE_COMPLETE_BIT` | BOOL | RO | 🟡 T2 | Pulses HIGH when machine n completes one cycle. |
| `MACHINE_n_CYCLE_START_TIMESTAMP` | DINT | RO | 🟢 T3 | Timestamp when current cycle started. |

Dashboard: `cycleTime = (cycleCompleteTimestamp − cycleStartTimestamp)`.

### 2b. Bottleneck ID (L) — Tier: ⚪ Optional

**This register is fully optional.** The dashboard computes the bottleneck from the 5 `MACHINE_n_ACTUAL_CT_REG` registers (Tier 1 Core) plus the ideal cycle times entered in dashboard input boxes.

| Register | Type | R/W | Tier | Description |
|---|---|---|---|---|
| `BOTTLENECK_ID_REG` | INT | RO | ⚪ T4 | Machine index (1–5) with largest positive gap. 0 = none. **Not needed** — dashboard computes from per-machine CTs. |

Dashboard computation (always available, even without this register):
```
gap_n = MACHINE_n_ACTUAL_CT_REG − idealCT_n (for n=1..5)
       where idealCT_n is entered by user in dashboard input box
bottleneck = argmax(gap_n) where gap_n > 0. If all gaps ≤ 0, no bottleneck.
```

---

## 3. Machine State / Utilization

Used by components: 09, 14

Critical architectural note: In a pure sequential line:
- **Machine 1** can only be: Running, Blocked (M2 slow/down), or Fault. Cannot be Starved (no upstream).
- **Machine 5** can only be: Running, Starved (M4 slow/down), or Fault. Cannot be Blocked (no downstream).
- **Machines 2,3,4** can be: Running, Starved (upstream slow), Blocked (downstream slow), or Fault.

### 3a. Machine State Register (M) — Tier: 🔴 Core

**Method A — State Register (Preferred)**
| Register | Type | R/W | Tier | Description |
|---|---|---|---|---|
| `MACHINE_n_STATE_REG` | INT | RO | 🔴 T1 | 0=Running, 1=Starved, 2=Blocked, 3=Fault/Down, 4=Off/Idle. Mutually exclusive. |

**Method B — Individual Bits (Fallback) — 🟡 T2**
| Register | Type | R/W | Tier | Description |
|---|---|---|---|---|
| `MACHINE_n_RUNNING_BIT` | BOOL | RO | 🟡 T2 | HIGH = machine is actively cycling. |
| `MACHINE_n_STARVED_BIT` | BOOL | RO | 🟡 T2 | HIGH = waiting for input from upstream. |
| `MACHINE_n_BLOCKED_BIT` | BOOL | RO | 🟡 T2 | HIGH = cannot discharge to downstream. |
| `MACHINE_n_FAULT_BIT` | BOOL | RO | 🟡 T2 | HIGH = machine in error/down state. |
| `MACHINE_n_IDLE_BIT` | BOOL | RO | 🟢 T3 | HIGH = powered but not in any active state. |

Priority if multiple bits HIGH: Fault > Running > Starved/Blocked. Dashboard computes state from bit combination.

### 3b. Utilization Percentages (M) — Tier: 🟢 Optional Pre-Compute

**Method A — PLC Pre-Computed (Preferred — dashboard can also compute this)**
| Register | Type | R/W | Tier | Description |
|---|---|---|---|---|
| `MACHINE_n_RUN_PCT_REG` | REAL | RO | 🟢 T3 | % of shift time machine n was Running. |
| `MACHINE_n_STARVED_PCT_REG` | REAL | RO | 🟢 T3 | % of shift time machine n was Starved. |
| `MACHINE_n_BLOCKED_PCT_REG` | REAL | RO | 🟢 T3 | % of shift time machine n was Blocked. |

**Method B — Dashboard Computed (no extra register needed) — ⚪ T4**
Dashboard samples `MACHINE_n_STATE_REG` at a fixed interval (e.g. every 1s) and accumulates percentages. Since `STATE_REG` is already Tier 1, this costs zero extra registers.

---

## 4. Per-Operation Pass/Fail (First Pass Yield)

Used by components: 07, 15

This is NOT the same as the final quality gate. Each machine can detect if its own operation succeeded (the product continues) or failed (the product may need rework at that station). FPY tracks the per-operation pass rate.

### 4a. Per-Machine Operation Pass Count (M) — Tier: 🟡 Important

**Method A — Direct Counters (Preferred)**
| Register | Type | R/W | Tier | Description |
|---|---|---|---|---|
| `MACHINE_n_OP_PASSED_REG` | DINT | RO | 🟡 T2 | Count of units where machine n's operation succeeded on first attempt. |
| `MACHINE_n_OP_TOTAL_REG` | DINT | RO | 🟡 T2 | Total units processed at machine n (pass + fail at this station). |

**Method B — Derive from Bits (Fallback) — 🟢 T3**
| Register | Type | R/W | Tier | Description |
|---|---|---|---|---|
| `MACHINE_n_OP_COMPLETE_BIT` | BOOL | RO | 🟢 T3 | Pulses when machine n completes its operation on one unit. |
| `MACHINE_n_OP_PASS_BIT` | BOOL | RO | 🟢 T3 | HIGH = operation succeeded, LOW = failed. |

Dashboard counts rising edges for total, and pass edges for passed.

---

## 5. Energy Consumption

Used by components: 12

### 5a. Per-Cycle Energy (M) — Tier: 🟢 Nice to have

**Method A — Per-Cycle Energy (Preferred)**
| Register | Type | R/W | Tier | Description |
|---|---|---|---|---|
| `MACHINE_n_ENERGY_CONSMP_REG` | REAL | RO | 🟢 T3 | kWh consumed by machine n during the last completed cycle. |

**Method B — Power Draw + Cycle Time (Fallback) — 🟢 T3**
| Register | Type | R/W | Tier | Description |
|---|---|---|---|---|
| `MACHINE_n_POWER_DRAW_REG` | REAL | RO | 🟢 T3 | kW instantaneous power draw of machine n. |

Dashboard: `energy = MACHINE_n_POWER_DRAW_REG × MACHINE_n_ACTUAL_CT_REG / 3600`.

### 5b. Cumulative Energy (M) — Tier: 🟢 Nice to have
| Register | Type | R/W | Tier | Description |
|---|---|---|---|---|
| `MACHINE_n_ENERGY_TOTAL_REG` | REAL | RO | 🟢 T3 | kWh cumulative shift-to-date for machine n. |

---

## 6. Alarms / Events

Used by components: 08, 13, 14, 16, 17

### 6a. Alarm Ring Buffer (L, but entries tagged with machine ID) — Tier: 🟡 Important

Provides event details for Active Alarms, Hourly Error, Shift Timeline, and MTBF/MTTR. Without it, downtime events lack descriptions, categories, and durations.

**Method A — Ring Buffer (Preferred)**
| Register | Type | R/W | Tier | Description |
|---|---|---|---|---|
| `ALARM_LOG_INDEX_REG` | INT | RO | 🟡 T2 | Current write position in the ring buffer (0..N−1). |
| `ALARM_LOG_SIZE_REG` | INT | RO | 🟡 T2 | Total buffer capacity (fixed, e.g. 100). |
| For each entry n (0..N−1): | | | | |
| `ALARM_ENTRY_n_TIMESTAMP` | STRING/TIME | RO | 🟡 T2 | HH:MM when alarm triggered. |
| `ALARM_ENTRY_n_MACHINE_ID` | INT | RO | 🟡 T2 | Machine index (1–5), or 0 for line-level. |
| `ALARM_ENTRY_n_CODE` | INT | RO | 🟡 T2 | Numeric alarm type code. |
| `ALARM_ENTRY_n_DESCRIPTION` | STRING(20) | RO | 🟢 T3 | Short English description. |
| `ALARM_ENTRY_n_DESCRIPTION_JP` | STRING(20) | RO | 🟢 T3 | Short Japanese description. |
| `ALARM_ENTRY_n_CATEGORY` | INT | RO | 🟡 T2 | 0=machine, 1=human, 2=other. |
| `ALARM_ENTRY_n_DURATION_MIN` | REAL | RO | 🟡 T2 | Duration in minutes (filled when event clears). |
| `ALARM_ENTRY_n_STATUS` | BOOL | RO | 🟡 T2 | TRUE = active, FALSE = cleared. |
| `ALARM_ENTRY_n_CAUSES_DOWNTIME` | BOOL | RO | 🟡 T2 | TRUE = this event stops production. |

**Method B — Bitmask Alarms (Fallback) — 🟢 T3**
| Register | Type | R/W | Tier | Description |
|---|---|---|---|---|
| `MACHINE_n_ALARM_BITMASK_REG` | DINT | RO | 🟢 T3 | Bit 0..31, each bit = one alarm type active. |

### 6b. Active Alarm Count (L) — Tier: 🟡 Important
| Register | Type | R/W | Tier | Description |
|---|---|---|---|---|
| `ALARM_COUNT_REG` | INT | RO | 🟡 T2 | Number of currently active (unresolved) alarms across all machines. |

---

## 7. Shift Schedule, Targets & Configuration (Dashboard Input — No PLC Registers)

All schedule and target values are entered by the user in dashboard input boxes. **No PLC registers are needed.**

| Configuration | Type | Location | Description |
|---|---|---|---|
| Shift start time | HH:MM | Dashboard input box | e.g. "08:20" |
| Shift end time | HH:MM | Dashboard input box | e.g. "19:20" |
| Buffer/break 1 start | HH:MM | Dashboard input box | |
| Buffer/break 1 end | HH:MM | Dashboard input box | |
| Buffer/break 2 start | HH:MM | Dashboard input box | |
| Buffer/break 2 end | HH:MM | Dashboard input box | |
| Daily target | units | Dashboard input box | Total production target |
| Per-interval targets (×6) | units | Dashboard input box | Target per interval |
| Interval boundaries | HH:MM list | Dashboard input box | 7 boundaries defining 6 intervals |
| Ideal cycle time per machine | seconds | Dashboard input box per machine | Used for bottleneck calculation |

---

## 8. Line Runtime & Availability

Used by components: 04, 05, 15

### 8a. Runtime / Lost Time (L) — Tier: 🟡 Important (dashboard can compute)

**Method A — PLC Accumulated (Preferred)**
| Register | Type | R/W | Tier | Description |
|---|---|---|---|---|
| `PLANNED_PRODUCTION_TIME_REG` | REAL | RO | 🟢 T3 | Minutes of planned production time (shift length − buffers). Dashboard can compute this. |
| `LOST_TIME_REG` | REAL | RO | 🟢 T3 | Minutes of unplanned downtime this shift. |
| `RUN_TIME_REG` | REAL | RO | 🟢 T3 | Minutes line was running = `PLANNED_PRODUCTION_TIME_REG − LOST_TIME_REG`. |

**Method B — Dashboard Computed — 🔴 T1 (zero extra registers)**
Dashboard samples `MACHINE_n_STATE_REG` (already Tier 1 Core) at fixed interval:
- Line is "running" only when ALL 5 machines are Running simultaneously.
- Line is "down" when ANY machine is Fault.
- Total cost: **zero extra registers**. The `STATE_REG` registers are already needed for Utilization.

---

## 9. MTBF / MTTR / Reliability

Used by components: 15, 17

### 9a. Per-Machine Reliability (M) — Tier: 🟢 Nice to have (dashboard can compute)

**Method A — PLC Pre-Computed (Preferred) — 🟢 T3**
| Register | Type | R/W | Tier | Description |
|---|---|---|---|---|
| `MACHINE_n_FAILURE_COUNT_REG` | INT | RO | 🟢 T3 | Number of unplanned down events this shift for machine n. |
| `MACHINE_n_TOTAL_DOWN_MIN_REG` | REAL | RO | 🟢 T3 | Cumulative down minutes this shift for machine n. |
| `MACHINE_n_MTBF_REG` | REAL | RO | 🟢 T3 | Mean time between failures in minutes. |
| `MACHINE_n_MTTR_REG` | REAL | RO | 🟢 T3 | Mean time to repair in minutes. |

**Method B — Dashboard Computed — 🟡 T2 (uses alarm ring buffer)**
Dashboard reads the alarm ring buffer (section 6a), filters by `MACHINE_ID = n` and `CAUSES_DOWNTIME = TRUE`:
```
mtbf = (shiftLength − totalBufferMin − totalDownMin) / failureCount
mttr = totalDownMin / failureCount
```
**Cost: zero extra registers** — uses the alarm ring buffer already in Tier 2.

---

## 10. State Cascade Rules (MASTER TABLE)

This table documents which states are valid for each machine position in a pure sequential line.

| State | Machine 1 | Machine 2 | Machine 3 | Machine 4 | Machine 5 |
|---|---|---|---|---|---|
| Running | Yes | Yes | Yes | Yes | Yes |
| Starved | **No** | Yes | Yes | Yes | Yes |
| Blocked | Yes | Yes | Yes | Yes | **No** |
| Fault | Yes | Yes | Yes | Yes | Yes |
| Off/Idle | Yes | Yes | Yes | Yes | Yes |

### Cascade Propagation (example: Machine 3 faults)

```
Time 0:  M3 faults
Time 0+: M3 stops → M2 cannot discharge → M2 Blocked
                  → M4 has no input → M4 Starved
Time 1+: M2 Blocked → M1 cannot discharge → M1 Blocked
          M4 Starved → M5 has no input → M5 Starved
```

Result: 1 machine faulted → entire line stopped within 2 cycle times.

---

## Minimum Viable Register Set (Tier Priority)

This section tells the PLC team: **"Implement these first, stop when you reach your capacity."**

### Per-Machine Registers (×5 machines)

| Priority | Count | Registers | What This Enables |
|---|---|---|---|
| 🔴 **Tier 1 — Core (1 reg/machine)** | ×5 = **5** | `MACHINE_n_STATE_REG` + `MACHINE_n_ACTUAL_CT_REG` | Utilization, Timeline, Runtime, OEE Availability, Bottleneck, Cycle Time chart, Radar |
| 🟡 **Tier 2 — Important (+2 regs/machine)** | ×5 = **+10** | `MACHINE_n_OP_PASSED_REG` + `MACHINE_n_OP_TOTAL_REG` | FPY by Machine |
| 🟢 **Tier 3 — Nice to have (+2 regs/machine)** | ×5 = **+10** | `MACHINE_n_ENERGY_CONSMP_REG` + `MACHINE_n_POWER_DRAW_REG` | Energy chart |
| ⚪ **Tier 4 — Optional (dashboard derives)** | **0** | Reliability, Utilization %, OEE Performance, Runtime — all computed from Tier 1 registers | MTBF/MTTR, Utilization %, OEE |

### Line-Level Registers

| Priority | Count | Registers | What This Enables |
|---|---|---|---|
| 🔴 **Tier 1 — Core** | **2** | `PASSED_COUNT_REG`, `DEFECT_COUNT_REG` | Approved Units, Defects, Defect %, OEE Quality |
| 🟡 **Tier 2 — Important** | **2 + N×7** | `LINE_TOTAL_PRODUCED_REG`, `ALARM_COUNT_REG`, `ALARM_LOG_INDEX_REG` + ring buffer entries | Production vs Target, Active Alarms, Hourly Error, Alarm Log, Shift Timeline, MTBF/MTTR |
| 🟢 **Tier 3 — Nice to have** | **7** | `INTERVAL_n_PRODUCED_REG` (×6), `ALARM_ENTRY_n_DESCRIPTION` | Pre-bucketed interval counts, alarm descriptions |
| ⚪ **Tier 4 — Optional** | **0** | `BOTTLENECK_ID_REG` (dashboard computes from per-machine CTs) | Bottleneck (zero-value add) |

### Implementation Priority Summary

| Scenario | Total Register Count | What Works Without These |
|---|---|---|
| **Tier 1 only** | **7** (5 per-machine + 2 line-level) | ✅ Approved Units, Defects, Defect %, OEE (part), Bottleneck, Cycle Time, Utilization, Timeline, Plan Achieve (part), Radar |
| **+ Tier 2** | **~25 + N×7** | ✅ + FPY, Production vs Target, Active Alarms, Hourly Error, Alarm Log, MTBF/MTTR |
| **+ Tier 3** | **~32 + N×7** | ✅ + Energy chart, pre-bucketed intervals, alarm descriptions |
| **+ Tier 4 (optional)** | **~33 + N×7** | ✅ + Bottleneck ID register (dashboard already computes this) |

### Registers You Do NOT Need

These are **fully optional** — the dashboard computes them from other registers at zero extra cost:

| Register | Why Not Needed |
|---|---|
| `BOTTLENECK_ID_REG` | Dashboard computes from per-machine ACTUAL_CT + user-entered ideal CT |
| `MACHINE_n_IDEAL_CT_REG` | Ideal cycle time is entered in dashboard input box per machine |
| `PLANNED_PRODUCTION_TIME_REG` | Dashboard computes from user-entered shift times minus buffers |
| `LOST_TIME_REG` | Dashboard samples MACHINE_n_STATE_REG (Tier 1) and accumulates downtime |
| `RUN_TIME_REG` | Same as above |
| `MACHINE_n_RUN_PCT_REG` | Dashboard samples MACHINE_n_STATE_REG (Tier 1) and calculates % |
| `MACHINE_n_MTBF_REG` | Dashboard computes from alarm ring buffer (Tier 2) |
| `MACHINE_n_MTTR_REG` | Same as above |
| `SHIFT_START_TIME` | Entered in dashboard input box |
| `SHIFT_END_TIME` | Entered in dashboard input box |
| `BUFFER_n_*` | Entered in dashboard input box |
| `DAILY_TARGET_REG` | Entered in dashboard input box |
| `INTERVAL_n_TARGET_REG` | Entered in dashboard input box |
