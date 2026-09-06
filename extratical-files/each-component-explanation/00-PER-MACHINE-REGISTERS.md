# Per-Machine Register Tables

## Architecture

```
Material → [Machine 1] → [Machine 2] → [Machine 3] → [Machine 4] → [Machine 5] → [Quality Gate] → Output
```

A single product flows through all 5 machines sequentially. Each machine performs one operation step.

---

## Section 1: Line-Level Registers (Shared — Not Per-Machine)

These registers belong to the **Quality Gate** (after Machine 5), the **Line Controller**, or the **HMI/MES**. They are not tied to any single machine.

### 1a. Quality Gate (after Machine 5)

| # | Register Name | Type | R/W | Method | Feasibility | Used By | Description |
|---|---|---|---|---|---|---|---|
| 1 | `PASSED_COUNT_REG` | DINT | RO | A | ✅ Feasible | 01, 03, 05, 15 | Cumulative good units this shift. Incremented on each pass at final inspection. |
| 2 | `DEFECT_COUNT_REG` | DINT | RO | A | ✅ Feasible | 02, 03, 05, 15 | Cumulative rejected units this shift. Incremented on each fail at final inspection. |
| 3 | `UNIT_COMPLETE_BIT` | BOOL | RO | B | ✅ Feasible | 01, 02 | Pulses when quality gate evaluates one unit. Dashboard counts rising edges. |
| 4 | `PASS_OR_FAIL_BIT` | BOOL | RO | B | ✅ Feasible | 01, 02 | Sampled with UNIT_COMPLETE_BIT: HIGH=pass, LOW=fail. |

### 1b. Line Controller / Runtime

| # | Register Name | Type | R/W | Method | Feasibility | Priority | Used By | Description |
|---|---|---|---|---|---|---|---|---|
| 6 | `PLANNED_PRODUCTION_TIME_REG` | REAL | RO | A | ✅ Feasible | 🟢 T3 — dashboard computes from shift+buffers | 04, 05 | Total scheduled production time (shift length − buffers). |
| 7 | `LOST_TIME_REG` | REAL | RO | A | ✅ Feasible | 🟢 T3 — dashboard samples STATE_REG | 04, 05 | Accumulated unplanned downtime (any machine in Fault stops entire line). |
| 8 | `RUN_TIME_REG` | REAL | RO | A | ✅ Feasible | 🟢 T3 — dashboard samples STATE_REG | 04, 05 | Accumulated time ALL 5 machines running simultaneously. |
| 9 | `BOTTLENECK_ID_REG` | INT | RO | A | ✅ Feasible | ⚪ T4 — **fully optional** (dashboard computes) | 06 | Machine index (1-5) with largest positive gap. 0 = none. **Not needed — dashboard computes from per-machine CTs.** |
| 10 | `BOTTLENECK_ACTUAL_CT_REG` | REAL | RO | A | ✅ Feasible | 🟢 T3 — dashboard reads from bottleneck machine's CT | 04, 05, 06 | Actual cycle time of the bottleneck machine. |

### 1c. Dashboard Configuration (Not PLC Registers)

The following are entered in dashboard input boxes — no PLC registers needed:
- Shift start/end times
- Buffer/break windows (up to 2)
- Daily production target
- Per-interval targets (6 intervals)
- Ideal cycle time per machine (for bottleneck calculation)

### 1d. Interval Production Counts (Line Controller)

| # | Register Name | Type | R/W | Method | Feasibility | Used By | Description |
|---|---|---|---|---|---|---|---|
| 11 | `INTERVAL_1_PRODUCED_REG` | DINT | RO | A | ✅ Feasible | 11 | Units produced in interval 1. Frozen at boundary. |
| 12 | `INTERVAL_2_PRODUCED_REG` | DINT | RO | A | ✅ Feasible | 11 | Same for interval 2. |
| 13 | `INTERVAL_3_PRODUCED_REG` | DINT | RO | A | ✅ Feasible | 11 | Same for interval 3. |
| 14 | `INTERVAL_4_PRODUCED_REG` | DINT | RO | A | ✅ Feasible | 11 | Same for interval 4. |
| 15 | `INTERVAL_5_PRODUCED_REG` | DINT | RO | A | ✅ Feasible | 11 | Same for interval 5. |
| 16 | `INTERVAL_6_PRODUCED_REG` | DINT | RO | A | ✅ Feasible | 11 | Same for interval 6. |
| 17 | `LINE_TOTAL_PRODUCED_REG` | DINT | RO | A | ✅ Feasible | 11 | Total units shift-to-date (sum of all intervals). |

### 1e. Alarm System (Ring Buffer)

| # | Register Name | Type | R/W | Method | Feasibility | Used By | Description |
|---|---|---|---|---|---|---|---|
| 18 | `ALARM_LOG_INDEX_REG` | INT | RO | A | ✅ Feasible | 08, 13, 16 | Current write position in ring buffer (0..N-1). |
| 19 | `ALARM_LOG_SIZE_REG` | INT | RO | A | ✅ Feasible | 13, 16 | Total buffer capacity (fixed, e.g. 100). |
| 20 | `ALARM_COUNT_REG` | INT | RO | A | ✅ Feasible | 08 | Number of currently active (unresolved) alarms. |
| 21 | `ALARM_ENTRY_n_TIMESTAMP` | STRING/TIME | RO | A | ✅ Feasible | 13, 14, 16 | When alarm n triggered. |
| 22 | `ALARM_ENTRY_n_MACHINE_ID` | INT | RO | A | ✅ Feasible | 13, 14, 16 | Machine index (1-5) or 0 for line-level. |
| 23 | `ALARM_ENTRY_n_CODE` | INT | RO | A | ✅ Feasible | 13, 16 | Numeric alarm type code. |
| 24 | `ALARM_ENTRY_n_DESCRIPTION` | STRING(20) | RO | A | ✅ Feasible | 16 | Short English description. |
| 25 | `ALARM_ENTRY_n_DESCRIPTION_JP` | STRING(20) | RO | A | ✅ Feasible | 16 | Short Japanese description. |
| 26 | `ALARM_ENTRY_n_CATEGORY` | INT | RO | A | ✅ Feasible | 13, 16 | 0=machine, 1=human, 2=other. |
| 27 | `ALARM_ENTRY_n_DURATION_MIN` | REAL | RO | A | ✅ Feasible | 13, 14, 17 | Duration in minutes (filled when event clears). |
| 28 | `ALARM_ENTRY_n_STATUS` | BOOL | RO | A | ✅ Feasible | 13, 16 | TRUE=active, FALSE=cleared. |
| 29 | `ALARM_ENTRY_n_CAUSES_DOWNTIME` | BOOL | RO | A | ✅ Feasible | 13, 14, 17 | TRUE=event stops production. |

---

## Section 2: Machine 1 Registers

**Position**: First station. Receives raw material. Output goes to Machine 2.  
**State restriction**: Cannot be **Starved** (no upstream machine).

| # | Category | Register Name | Type | R/W | Method | Feasibility | Priority | Used By | Description |
|---|---|---|---|---|---|---|---|---|---|---|
| 1 | Cycle Time | `MACHINE_1_ACTUAL_CT_REG` | REAL | RO | A | ✅ Feasible | 🔴 T1 | 05, 06, 10, 12 | Actual cycle time of last completed operation. |
| 3 | Cycle Time | `MACHINE_1_CYCLE_COMPLETE_BIT` | BOOL | RO | B | ✅ Feasible | 🟡 T2 | 10, 12 | Pulses when Machine 1 completes one cycle. |
| 4 | State | `MACHINE_1_STATE_REG` | INT | RO | A | ✅ Feasible | 🔴 T1 | 09, 14 | 0=Running, 1=Starved, 2=Blocked, 3=Fault, 4=Idle. |
| 5 | State | `MACHINE_1_RUNNING_BIT` | BOOL | RO | B | ✅ Feasible | 🟡 T2 | 09 | HIGH=machine actively cycling. |
| 6 | State | `MACHINE_1_BLOCKED_BIT` | BOOL | RO | B | ✅ Feasible | 🟡 T2 | 09 | HIGH=cannot discharge to Machine 2. |
| 7 | State | `MACHINE_1_FAULT_BIT` | BOOL | RO | B | ✅ Feasible | 🟡 T2 | 09 | HIGH=machine in error/down state. |
| 8 | State | `MACHINE_1_RUN_PCT_REG` | REAL | RO | A (opt) | ✅ Feasible | 🟢 T3 | 09 | Pre-computed % Running (dashboard can compute). |
| 9 | State | `MACHINE_1_BLOCKED_PCT_REG` | REAL | RO | A (opt) | ✅ Feasible | 🟢 T3 | 09 | Pre-computed % Blocked (dashboard can compute). |
| 10 | FPY | `MACHINE_1_OP_PASSED_REG` | DINT | RO | A | ✅ Feasible | 🟡 T2 | 07, 15 | Operations that succeeded on first attempt at Machine 1. |
| 11 | FPY | `MACHINE_1_OP_TOTAL_REG` | DINT | RO | A | ✅ Feasible | 🟡 T2 | 07, 15 | Total operations processed at Machine 1. |
| 12 | FPY | `MACHINE_1_OP_COMPLETE_BIT` | BOOL | RO | B | ✅ Feasible | 🟢 T3 | 07 | Pulses when Machine 1 completes its operation. |
| 13 | FPY | `MACHINE_1_OP_PASS_BIT` | BOOL | RO | B | ✅ Feasible | 🟢 T3 | 07 | HIGH=succeeded, LOW=failed. |
| 14 | Energy | `MACHINE_1_ENERGY_CONSMP_REG` | REAL | RO | A | ✅ Feasible | 🟢 T3 | 12 | kWh consumed during last completed cycle. |
| 15 | Energy | `MACHINE_1_ENERGY_TOTAL_REG` | REAL | RO | A | ✅ Feasible | 🟢 T3 | 12 | Cumulative kWh shift-to-date. |
| 16 | Energy | `MACHINE_1_POWER_DRAW_REG` | REAL | RO | B | ✅ Feasible | 🟢 T3 | 12 | Instantaneous kW draw. |
| 17 | Reliability | `MACHINE_1_FAILURE_COUNT_REG` | INT | RO | A (opt) | ✅ Feasible | 🟢 T3 | 17 | Number of unplanned down events this shift. |
| 18 | Reliability | `MACHINE_1_TOTAL_DOWN_MIN_REG` | REAL | RO | A (opt) | ✅ Feasible | 🟢 T3 | 17 | Cumulative down minutes this shift. |
| 19 | Reliability | `MACHINE_1_MTBF_REG` | REAL | RO | A (opt) | ✅ Feasible | 🟢 T3 | 17, 15 | Mean time between failures. |
| 20 | Reliability | `MACHINE_1_MTTR_REG` | REAL | RO | A (opt) | ✅ Feasible | 🟢 T3 | 17, 15 | Mean time to repair. |
| 21 | Alarms | `MACHINE_1_ALARM_BITMASK_REG` | DINT | RO | B | ✅ Feasible | 🟢 T3 | 08 | Bit 0..31 = alarm types active on Machine 1. |

### Priority Summary for Machine 1

| Tier | Registers | Count |
|---|---|---|
| 🔴 **T1 Core** | #1, #4 | **2** |
| 🟡 **T2 Important** | #3, #5, #6, #7, #10, #11 | **6** |
| 🟢 **T3 Nice to have** | #8, #9, #12, #13, #14, #15, #16, #17, #18, #19, #20, #21, #22 | **13** |
| ⚪ **T4 Optional** | — | **0** (dashboard can compute all T3 and T4 from T1+T2) |

---

## Section 3: Machine 2 Registers

**Position**: Second station. Receives from Machine 1. Output goes to Machine 3.  
**State restriction**: Can be Starved (Machine 1 slow) or Blocked (Machine 3 slow).

| # | Category | Register Name | Type | R/W | Method | Feasibility | Priority | Used By | Description |
|---|---|---|---|---|---|---|---|---|---|---|
| 1 | Cycle Time | `MACHINE_2_ACTUAL_CT_REG` | REAL | RO | A | ✅ Feasible | 🔴 T1 | 05, 06, 10, 12 | Actual cycle time. |
| 2 | Cycle Time | `MACHINE_2_CYCLE_COMPLETE_BIT` | BOOL | RO | B | ✅ Feasible | 🟡 T2 | 10, 12 | Cycle complete pulse. |
| 4 | State | `MACHINE_2_STATE_REG` | INT | RO | A | ✅ Feasible | 🔴 T1 | 09, 14 | 0=R,1=S,2=B,3=F,4=I. |
| 5 | State | `MACHINE_2_RUNNING_BIT` | BOOL | RO | B | ✅ Feasible | 🟡 T2 | 09 | Running. |
| 6 | State | `MACHINE_2_STARVED_BIT` | BOOL | RO | B | ✅ Feasible | 🟡 T2 | 09 | Starved. |
| 7 | State | `MACHINE_2_BLOCKED_BIT` | BOOL | RO | B | ✅ Feasible | 🟡 T2 | 09 | Blocked. |
| 8 | State | `MACHINE_2_FAULT_BIT` | BOOL | RO | B | ✅ Feasible | 🟡 T2 | 09 | Fault. |
| 9 | State | `MACHINE_2_RUN_PCT_REG` | REAL | RO | A (opt) | ✅ Feasible | 🟢 T3 | 09 | % Running. |
| 10 | State | `MACHINE_2_STARVED_PCT_REG` | REAL | RO | A (opt) | ✅ Feasible | 🟢 T3 | 09 | % Starved. |
| 11 | State | `MACHINE_2_BLOCKED_PCT_REG` | REAL | RO | A (opt) | ✅ Feasible | 🟢 T3 | 09 | % Blocked. |
| 12 | FPY | `MACHINE_2_OP_PASSED_REG` | DINT | RO | A | ✅ Feasible | 🟡 T2 | 07, 15 | First-pass count. |
| 13 | FPY | `MACHINE_2_OP_TOTAL_REG` | DINT | RO | A | ✅ Feasible | 🟡 T2 | 07, 15 | Total count. |
| 14 | FPY | `MACHINE_2_OP_COMPLETE_BIT` | BOOL | RO | B | ✅ Feasible | 🟢 T3 | 07 | Op complete. |
| 15 | FPY | `MACHINE_2_OP_PASS_BIT` | BOOL | RO | B | ✅ Feasible | 🟢 T3 | 07 | Pass/fail. |
| 16 | Energy | `MACHINE_2_ENERGY_CONSMP_REG` | REAL | RO | A | ✅ Feasible | 🟢 T3 | 12 | kWh per cycle. |
| 17 | Energy | `MACHINE_2_ENERGY_TOTAL_REG` | REAL | RO | A | ✅ Feasible | 🟢 T3 | 12 | Cumulative kWh. |
| 18 | Energy | `MACHINE_2_POWER_DRAW_REG` | REAL | RO | B | ✅ Feasible | 🟢 T3 | 12 | Instantaneous kW. |
| 19 | Reliability | `MACHINE_2_FAILURE_COUNT_REG` | INT | RO | A (opt) | ✅ Feasible | 🟢 T3 | 17 | Failure count. |
| 20 | Reliability | `MACHINE_2_TOTAL_DOWN_MIN_REG` | REAL | RO | A (opt) | ✅ Feasible | 🟢 T3 | 17 | Cumulative down. |
| 21 | Reliability | `MACHINE_2_MTBF_REG` | REAL | RO | A (opt) | ✅ Feasible | 🟢 T3 | 17, 15 | MTBF. |
| 22 | Reliability | `MACHINE_2_MTTR_REG` | REAL | RO | A (opt) | ✅ Feasible | 🟢 T3 | 17, 15 | MTTR. |
| 23 | Alarms | `MACHINE_2_ALARM_BITMASK_REG` | DINT | RO | B | ✅ Feasible | 🟢 T3 | 08 | Alarm bitmask. |

---

## Section 4: Machine 3 Registers

**Position**: Middle station (third). Receives from Machine 2. Output goes to Machine 4.  
**State restriction**: Can be Starved (Machine 2 slow) or Blocked (Machine 4 slow).

| # | Category | Register Name | Type | R/W | Method | Feasibility | Priority | Used By | Description |
|---|---|---|---|---|---|---|---|---|---|---|
| 1 | Cycle Time | `MACHINE_3_ACTUAL_CT_REG` | REAL | RO | A | ✅ Feasible | 🔴 T1 | 05, 06, 10, 12 | Actual cycle time. |
| 2 | Cycle Time | `MACHINE_3_CYCLE_COMPLETE_BIT` | BOOL | RO | B | ✅ Feasible | 🟡 T2 | 10, 12 | Cycle complete pulse. |
| 4 | State | `MACHINE_3_STATE_REG` | INT | RO | A | ✅ Feasible | 🔴 T1 | 09, 14 | 0=R,1=S,2=B,3=F,4=I. |
| 5 | State | `MACHINE_3_RUNNING_BIT` | BOOL | RO | B | ✅ Feasible | 🟡 T2 | 09 | Running. |
| 6 | State | `MACHINE_3_STARVED_BIT` | BOOL | RO | B | ✅ Feasible | 🟡 T2 | 09 | Starved. |
| 7 | State | `MACHINE_3_BLOCKED_BIT` | BOOL | RO | B | ✅ Feasible | 🟡 T2 | 09 | Blocked. |
| 8 | State | `MACHINE_3_FAULT_BIT` | BOOL | RO | B | ✅ Feasible | 🟡 T2 | 09 | Fault. |
| 9 | State | `MACHINE_3_RUN_PCT_REG` | REAL | RO | A (opt) | ✅ Feasible | 🟢 T3 | 09 | % Running. |
| 10 | State | `MACHINE_3_STARVED_PCT_REG` | REAL | RO | A (opt) | ✅ Feasible | 🟢 T3 | 09 | % Starved. |
| 11 | State | `MACHINE_3_BLOCKED_PCT_REG` | REAL | RO | A (opt) | ✅ Feasible | 🟢 T3 | 09 | % Blocked. |
| 12 | FPY | `MACHINE_3_OP_PASSED_REG` | DINT | RO | A | ✅ Feasible | 🟡 T2 | 07, 15 | First-pass count. |
| 13 | FPY | `MACHINE_3_OP_TOTAL_REG` | DINT | RO | A | ✅ Feasible | 🟡 T2 | 07, 15 | Total count. |
| 14 | FPY | `MACHINE_3_OP_COMPLETE_BIT` | BOOL | RO | B | ✅ Feasible | 🟢 T3 | 07 | Op complete. |
| 15 | FPY | `MACHINE_3_OP_PASS_BIT` | BOOL | RO | B | ✅ Feasible | 🟢 T3 | 07 | Pass/fail. |
| 16 | Energy | `MACHINE_3_ENERGY_CONSMP_REG` | REAL | RO | A | ✅ Feasible | 🟢 T3 | 12 | kWh per cycle. |
| 17 | Energy | `MACHINE_3_ENERGY_TOTAL_REG` | REAL | RO | A | ✅ Feasible | 🟢 T3 | 12 | Cumulative kWh. |
| 18 | Energy | `MACHINE_3_POWER_DRAW_REG` | REAL | RO | B | ✅ Feasible | 🟢 T3 | 12 | Instantaneous kW. |
| 19 | Reliability | `MACHINE_3_FAILURE_COUNT_REG` | INT | RO | A (opt) | ✅ Feasible | 🟢 T3 | 17 | Failure count. |
| 20 | Reliability | `MACHINE_3_TOTAL_DOWN_MIN_REG` | REAL | RO | A (opt) | ✅ Feasible | 🟢 T3 | 17 | Cumulative down. |
| 21 | Reliability | `MACHINE_3_MTBF_REG` | REAL | RO | A (opt) | ✅ Feasible | 🟢 T3 | 17, 15 | MTBF. |
| 22 | Reliability | `MACHINE_3_MTTR_REG` | REAL | RO | A (opt) | ✅ Feasible | 🟢 T3 | 17, 15 | MTTR. |
| 23 | Alarms | `MACHINE_3_ALARM_BITMASK_REG` | DINT | RO | B | ✅ Feasible | 🟢 T3 | 08 | Alarm bitmask. |

---

## Section 5: Machine 4 Registers

**Position**: Fourth station. Receives from Machine 3. Output goes to Machine 5.  
**State restriction**: Can be Starved (Machine 3 slow) or Blocked (Machine 5 slow).

| # | Category | Register Name | Type | R/W | Method | Feasibility |
|---|---|---|---|---|---|---|
| 1 | Cycle Time | `MACHINE_4_ACTUAL_CT_REG` | REAL | RO | A | ✅ Feasible |
| 2 | Cycle Time | `MACHINE_4_CYCLE_COMPLETE_BIT` | BOOL | RO | B | ✅ Feasible |
| 4 | State | `MACHINE_4_STATE_REG` | INT | RO | A | ✅ Feasible |
| 5–8 | State bits | `MACHINE_4_RUNNING/STARVED/BLOCKED/FAULT_BIT` | BOOL | RO | B | ✅ Feasible |
| 9–11 | State % | `MACHINE_4_RUN/STARVED/BLOCKED_PCT_REG` | REAL | RO | A (opt) | ✅ Feasible |
| 12–13 | FPY | `MACHINE_4_OP_PASSED/TOTAL_REG` | DINT | RO | A | ✅ Feasible |
| 14–15 | FPY bits | `MACHINE_4_OP_COMPLETE_BIT/PASS_BIT` | BOOL | RO | B | ✅ Feasible |
| 16–18 | Energy | `MACHINE_4_ENERGY_CONSMP/TOTAL/POWER_DRAW_REG` | REAL | RO | A/B | ✅ Feasible |
| 19–22 | Reliability | `MACHINE_4_FAILURE_COUNT/TOTAL_DOWN/MTBF/MTTR_REG` | — | — | A (opt) | ✅ Feasible |
| 23 | Alarms | `MACHINE_4_ALARM_BITMASK_REG` | DINT | RO | B | ✅ Feasible |

(Same structure as Machine 2/3 — all states valid.)

---

## Section 6: Machine 5 Registers

**Position**: Final station. Receives from Machine 4. Output goes to Quality Gate (final inspection).  
**State restriction**: Cannot be **Blocked** (no downstream machine — only quality gate after it).  
**Special role**: `MACHINE_5_CYCLE_COMPLETE_BIT` signals that a finished product exits the line. This feeds the interval production counters.

| # | Category | Register Name | Type | R/W | Method | Feasibility | Used By | Description |
|---|---|---|---|---|---|---|---|---|
| 1 | Cycle Time | `MACHINE_5_ACTUAL_CT_REG` | REAL | RO | A | ✅ Feasible | 05, 06, 10, 12 | Actual cycle time of last operation. |
| 2 | Cycle Time | `MACHINE_5_CYCLE_COMPLETE_BIT` | BOOL | RO | A/B | ✅ Feasible — **KEY SIGNAL** | 10, 11, 12 | Pulses when finished product exits Machine 5. This is the **final output signal** for production counting. |
| 4 | State | `MACHINE_5_STATE_REG` | INT | RO | A | ✅ Feasible | 09, 14 | 0=Running, 1=Starved, 2=Blocked, 3=Fault, 4=Idle. |
| 5 | State | `MACHINE_5_RUNNING_BIT` | BOOL | RO | B | ✅ Feasible | 09 | Running. |
| 6 | State | `MACHINE_5_STARVED_BIT` | BOOL | RO | B | ✅ Feasible | 09 | **Can be Starved** (Machine 4 slow). |
| 7 | State | `MACHINE_5_FAULT_BIT` | BOOL | RO | B | ✅ Feasible | 09 | Fault. |
| 8 | State | `MACHINE_5_RUN_PCT_REG` | REAL | RO | A (opt) | ✅ Feasible | 09 | % Running. |
| 9 | State | `MACHINE_5_STARVED_PCT_REG` | REAL | RO | A (opt) | ✅ Feasible | 09 | % Starved. |
| 10 | FPY | `MACHINE_5_OP_PASSED_REG` | DINT | RO | A | ✅ Feasible | 07, 15 | Operations passed first attempt. |
| 11 | FPY | `MACHINE_5_OP_TOTAL_REG` | DINT | RO | A | ✅ Feasible | 07, 15 | Total operations. |
| 12 | FPY | `MACHINE_5_OP_COMPLETE_BIT` | BOOL | RO | B | ✅ Feasible | 07 | Operation complete. |
| 13 | FPY | `MACHINE_5_OP_PASS_BIT` | BOOL | RO | B | ✅ Feasible | 07 | Pass/fail. |
| 14 | Energy | `MACHINE_5_ENERGY_CONSMP_REG` | REAL | RO | A | ✅ Feasible | 12 | kWh per cycle. |
| 15 | Energy | `MACHINE_5_ENERGY_TOTAL_REG` | REAL | RO | A | ✅ Feasible | 12 | Cumulative kWh. |
| 16 | Energy | `MACHINE_5_POWER_DRAW_REG` | REAL | RO | B | ✅ Feasible | 12 | Instantaneous kW. |
| 17 | Reliability | `MACHINE_5_FAILURE_COUNT_REG` | INT | RO | A (opt) | ✅ Feasible | 17 | Failure count. |
| 18 | Reliability | `MACHINE_5_TOTAL_DOWN_MIN_REG` | REAL | RO | A (opt) | ✅ Feasible | 17 | Cumulative down. |
| 19 | Reliability | `MACHINE_5_MTBF_REG` | REAL | RO | A (opt) | ✅ Feasible | 17, 15 | MTBF. |
| 20 | Reliability | `MACHINE_5_MTTR_REG` | REAL | RO | A (opt) | ✅ Feasible | 17, 15 | MTTR. |
| 21 | Alarms | `MACHINE_5_ALARM_BITMASK_REG` | DINT | RO | B | ✅ Feasible | 08 | Alarm bitmask. |

### Note on MACHINE_5 vs Quality Gate

Machine 5 completes the final operation. The Quality Gate (after Machine 5) determines pass/fail of the finished product.

- `MACHINE_5_CYCLE_COMPLETE_BIT` = product exits Machine 5
- `PASSED_COUNT_REG` / `DEFECT_COUNT_REG` = result after Quality Gate inspection

These are separate signals. Production targets (doc 11) should count based on **passed** units, not Machine 5 completions.

---

## Section 7: State Cascade — Which States Are Valid Per Machine

| State | M1 | M2 | M3 | M4 | M5 |
|---|---|---|---|---|---|
| **Running** | ✅ | ✅ | ✅ | ✅ | ✅ |
| **Starved** | ❌ No upstream | ✅ | ✅ | ✅ | ✅ |
| **Blocked** | ✅ | ✅ | ✅ | ✅ | ❌ No downstream |
| **Fault** | ✅ | ✅ | ✅ | ✅ | ✅ |
| **Off/Idle** | ✅ | ✅ | ✅ | ✅ | ✅ |

### Cascade Example (Machine 3 Faults):

```
T+0:     M3 Faults
T+0.1:   M2 cannot discharge → M2 Blocked
         M4 has no input → M4 Starved
T+0.2:   M1 cannot discharge (M2 blocked) → M1 Blocked
         M5 has no input (M4 starved) → M5 Starved
```

**Result**: 1 machine down → all 5 machines stop within ~2 cycle times. Dashboard uses this to diagnose root cause.

---

## Section 8: Minimum Viable Register Count

### Per-Machine Registers (×5)

| Tier | Registers | Count | What This Enables |
|---|---|---|---|
| 🔴 **T1 Core** | `MACHINE_n_STATE_REG` + `MACHINE_n_ACTUAL_CT_REG` | **2** | Utilization, Timeline, Runtime, OEE Availability, Cycle Time, Radar |
| 🟡 **T2 Important** | + `MACHINE_n_OP_PASSED_REG` + `MACHINE_n_OP_TOTAL_REG` | **+2** | FPY by Machine |
| 🟢 **T3 Nice to have** | + `MACHINE_n_ENERGY_CONSMP_REG`, Reliability, Utilization % | **+5** | Energy chart, pre-computed reliability |
| ⚪ **Dashboard computes** | OEE Performance (uses user-entered ideal CT), Bottleneck, Utilization %, MTBF/MTTR | **0 extra** | |

### Line-Level Registers (Shared)

| Tier | Registers | Count |
|---|---|---|
| 🔴 **T1 Core** | `PASSED_COUNT_REG`, `DEFECT_COUNT_REG` | **2** |
| 🟡 **T2 Important** | `LINE_TOTAL_PRODUCED_REG`, `ALARM_COUNT_REG`, `ALARM_LOG_INDEX_REG` + ring buffer entries | **3 + N×8** |
| 🟢 **T3 Nice to have** | `INTERVAL_n_PRODUCED_REG` (×6), `ALARM_ENTRY_n_DESCRIPTION` | **7** |
| ⚪ **T4 Optional** | `BOTTLENECK_ID_REG` (dashboard computes this) | **0** |

**Note**: Shift schedule, targets, ideal cycle times are entered in dashboard input boxes — no PLC registers required.

### Total Register Count by Scenario

| Scenario | Count | What Works |
|---|---|---|
| **T1 only** | **12** (2×5 + 2) | ✅ Approved Units, Defects, OEE (partial), Cycle Time, Utilization, Timeline, Radar |
| **+ T2** | **~27 + N×8** | ✅ + FPY, Production vs Target, Active Alarms, Hourly Error, MTBF/MTTR, Alarm Log |
| **+ T3** | **~34 + N×8** | ✅ + Energy chart, pre-bucketed intervals, alarm descriptions |
| **Full** | **~50 + N×8** | Everything |

### Registers You Do NOT Need (dashboard computes them)

| Register | Why Not Needed |
|---|---|
| `MACHINE_n_IDEAL_CT_REG` | Ideal CT is entered in dashboard input box |
| `BOTTLENECK_ID_REG` | Dashboard computes from per-machine ACTUAL_CT + user-entered ideal CT |
| `PLANNED_PRODUCTION_TIME_REG` | Dashboard computes from user-entered shift times minus buffers |
| `LOST_TIME_REG` / `RUN_TIME_REG` | Dashboard samples `MACHINE_n_STATE_REG` (T1) |
| `MACHINE_n_RUN/STARVED/BLOCKED_PCT_REG` | Dashboard samples `MACHINE_n_STATE_REG` and calculates % |
| `MACHINE_n_MTBF/MTTR_REG` | Dashboard computes from alarm ring buffer (T2) |
| `SHIFT_START_TIME`, `SHIFT_END_TIME` | Entered in dashboard input box |
| `BUFFER_n_*` | Entered in dashboard input box |
| `DAILY_TARGET_REG`, `INTERVAL_n_TARGET_REG` | Entered in dashboard input box |
