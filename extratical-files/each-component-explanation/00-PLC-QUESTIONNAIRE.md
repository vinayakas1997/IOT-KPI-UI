# PLC Capability Questionnaire — Conditional

**Purpose**: PLC team fills this out and returns it. Questions are conditional — if you have a direct register (Method A), you skip the bit-level questions (Method B).

---

## Line Architecture

```
Material → [Machine 1] → [Machine 2] → [Machine 3] → [Machine 4] → [Machine 5] → [Quality Gate] → Output
```

**Quick reference**:
- **Method A** = Direct register → Dashboard just reads it. Always preferred.
- **Method B** = Raw bits/signals → Dashboard derives the value. Fallback if Method A is unavailable.

---

## Section A: Per-Machine Questions (answer for each machine 1–5)

### A1. Cycle Time

**Q1a**: Does the PLC have a **register holding the actual cycle time** in seconds for the last completed operation? (Method A)

| Machine 1 | Machine 2 | Machine 3 | Machine 4 | Machine 5 |
|---|---|---|---|---|
| Y / N | Y / N | Y / N | Y / N | Y / N |

If YES to **any machine**: List the register name(s):
- M1: \_\_\_\_\_\_\_\_\_\_  M2: \_\_\_\_\_\_\_\_\_\_  M3: \_\_\_\_\_\_\_\_\_\_  M4: \_\_\_\_\_\_\_\_\_\_  M5: \_\_\_\_\_\_\_\_\_\_

→ **If ALL machines have Q1a=Y, skip Q1b entirely and go to Q1c.**

**Q1b** (only if Q1a=N for some machines): For machines **without** a direct cycle time register, does the PLC have a **cycle complete pulse bit** (HIGH for ≥1 scan when one operation finishes)? (Method B)

| Machine 1 | Machine 2 | Machine 3 | Machine 4 | Machine 5 |
|---|---|---|---|---|
| Y / N / — | Y / N / — | Y / N / — | Y / N / — | Y / N / — |

If YES: Bit name(s):
- M1: \_\_\_\_\_\_\_\_\_\_  M2: \_\_\_\_\_\_\_\_\_\_  M3: \_\_\_\_\_\_\_\_\_\_  M4: \_\_\_\_\_\_\_\_\_\_  M5: \_\_\_\_\_\_\_\_\_\_

**Q1c** (dashboard input — no PLC register needed): The ideal/rated cycle time per machine is entered in the dashboard input box. **No PLC register required. Skip this question.**

---

### A2. Machine State / Utilization

**Q2a**: Does the PLC have a **single state register** with encoding: 0=Running, 1=Starved, 2=Blocked, 3=Fault/Down, 4=Off/Idle? (Method A) *(Running = actively cycling, Starved = waiting for input material, Blocked = cannot discharge output, Fault/Down = error or stopped state, Off/Idle = powered but not running)*

| Machine 1 | Machine 2 | Machine 3 | Machine 4 | Machine 5 |
|---|---|---|---|---|
| Y / N | Y / N | Y / N | Y / N | Y / N |

If YES to **any machine**: Register name(s):
- M1: \_\_\_\_\_\_\_\_\_\_  M2: \_\_\_\_\_\_\_\_\_\_  M3: \_\_\_\_\_\_\_\_\_\_  M4: \_\_\_\_\_\_\_\_\_\_  M5: \_\_\_\_\_\_\_\_\_\_

→ **If ALL machines have Q2a=Y, skip Q2b entirely. Go to A3.**

**Q2b** (only if Q2a=N for some machines): For machines **without** a state register, does the PLC have individual state bits? (Method B)

| Bit | Machine 1 | Machine 2 | Machine 3 | Machine 4 | Machine 5 |
|---|---|---|---|---|---|
| Running (HIGH=cycling) | Y / N / — | Y / N / — | Y / N / — | Y / N / — | Y / N / — |
| Starved (waiting for input) | Y / N / — | Y / N / — | Y / N / — | Y / N / — | Y / N / — |
| Blocked (cannot discharge) | Y / N / — | Y / N / — | Y / N / — | Y / N / — | Y / N / — |
| Fault (error/down state) | Y / N / — | Y / N / — | Y / N / — | Y / N / — | Y / N / — |

If YES: Bit name(s):
- M1: \_\_\_\_\_\_\_\_\_\_\_\_  M2: \_\_\_\_\_\_\_\_\_\_\_\_  M3: \_\_\_\_\_\_\_\_\_\_\_\_  M4: \_\_\_\_\_\_\_\_\_\_\_\_  M5: \_\_\_\_\_\_\_\_\_\_\_\_

---

### A3. First Pass Yield (Operation Pass/Fail)

**Q3a**: Does the PLC have **direct counters** for operations that passed on first attempt and total operations processed at this machine? (Method A)

| | Machine 1 | Machine 2 | Machine 3 | Machine 4 | Machine 5 |
|---|---|---|---|---|---|
| Passed counter | Y / N | Y / N | Y / N | Y / N | Y / N |
| Total counter | Y / N | Y / N | Y / N | Y / N | Y / N |

If YES to **any machine**: Register name(s):
- M1: \_\_\_\_\_\_\_\_\_\_  M2: \_\_\_\_\_\_\_\_\_\_  M3: \_\_\_\_\_\_\_\_\_\_  M4: \_\_\_\_\_\_\_\_\_\_  M5: \_\_\_\_\_\_\_\_\_\_

→ **If ALL machines have Q3a=Y, skip Q3b. Go to A4.**

**Q3b** (only if Q3a=N for some machines): For machines **without** direct counters, does the PLC have an **operation complete pulse bit** and an **operation pass/fail bit**? (Method B)

| Bit | Machine 1 | Machine 2 | Machine 3 | Machine 4 | Machine 5 |
|---|---|---|---|---|---|
| Operation complete pulse | Y / N / — | Y / N / — | Y / N / — | Y / N / — | Y / N / — |
| Operation pass bit (HIGH=succeeded) | Y / N / — | Y / N / — | Y / N / — | Y / N / — | Y / N / — |

If YES: Bit name(s):
- M1: \_\_\_\_\_\_\_\_\_\_  M2: \_\_\_\_\_\_\_\_\_\_  M3: \_\_\_\_\_\_\_\_\_\_  M4: \_\_\_\_\_\_\_\_\_\_  M5: \_\_\_\_\_\_\_\_\_\_

→ If both Q3a and Q3b are N for a machine, mark FPY as "Not Available" for that machine.

---

### A4. Energy Consumption

**Q4a**: Does the PLC/power meter provide **per-cycle energy consumption** (kWh) for this machine? (Method A)

| Machine 1 | Machine 2 | Machine 3 | Machine 4 | Machine 5 |
|---|---|---|---|---|
| Y / N | Y / N | Y / N | Y / N | Y / N |

If YES: Register name(s):
- M1: \_\_\_\_\_\_\_\_\_\_  M2: \_\_\_\_\_\_\_\_\_\_  M3: \_\_\_\_\_\_\_\_\_\_  M4: \_\_\_\_\_\_\_\_\_\_  M5: \_\_\_\_\_\_\_\_\_\_

→ **If Q4a=Y for a machine, skip Q4b for that machine.**

**Q4b** (only if Q4a=N): Does the PLC/power meter provide **instantaneous power draw** (kW)? (Method B)

| Machine 1 | Machine 2 | Machine 3 | Machine 4 | Machine 5 |
|---|---|---|---|---|
| Y / N / — | Y / N / — | Y / N / — | Y / N / — | Y / N / — |

If YES: Register name(s):
- M1: \_\_\_\_\_\_\_\_\_\_  M2: \_\_\_\_\_\_\_\_\_\_  M3: \_\_\_\_\_\_\_\_\_\_  M4: \_\_\_\_\_\_\_\_\_\_  M5: \_\_\_\_\_\_\_\_\_\_

---

## Section B: Line-Level Questions (one answer for whole line)

### B1. Production Counters (Quality Gate after Machine 5)

**Q5a**: Does the PLC have a **direct register for total good units** passed at final quality inspection this shift? (Method A)

Y / N

If YES: Register name: \_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_ → **Skip Q5b.**

**Q5b** (only if Q5a=N): Does the PLC have a **unit evaluation complete pulse bit** and a **pass/fail bit**? (Method B)

| Bit | Answer |
|---|---|
| Unit evaluation complete pulse (HIGH when quality gate evaluates one unit) | Y / N |
| Pass/fail bit (HIGH=pass, LOW=fail, sampled with pulse above) | Y / N |

If YES: Bit name(s): \_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_

**Q5c**: Does the PLC have a **total defect counter** (units that failed final inspection this shift)? (always needed)

Y / N    Register name: \_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_

**Q5d**: Does the PLC have **per-interval production counters** (units produced in each interval, frozen at interval boundaries)? (Method A)

Y / N

If YES: Register names: \_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_

If NO: Does the PLC have a **total produced counter** that the dashboard can read at interval boundaries? (Method B)

Y / N    Register name: \_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_

---

### B2. Shift Schedule & Production Targets

All of the following are **dashboard input boxes — no PLC registers needed**. Skip these questions:

- Shift start/end times
- Buffer/break windows (up to 2)
- Daily production target
- Per-interval targets (6 intervals)

---

### B4. Alarms / Events

**Q12a**: Does the PLC have an **alarm ring buffer** storing events with timestamps? (Method A)

Y / N    Buffer size: \_\_\_\_ entries

If YES, which fields does each entry have?

| Field | Available? | Register/Address |
|---|---|---|
| Timestamp (HH:MM) | Y / N | \_\_\_\_\_\_\_\_\_\_\_\_\_\_ |
| Machine ID (1–5) | Y / N | \_\_\_\_\_\_\_\_\_\_\_\_\_\_ |
| Numeric alarm code | Y / N | \_\_\_\_\_\_\_\_\_\_\_\_\_\_ |
| Description text | Y / N | \_\_\_\_\_\_\_\_\_\_\_\_\_\_ |
| Category (machine/human/other) | Y / N | \_\_\_\_\_\_\_\_\_\_\_\_\_\_ |
| Duration in minutes | Y / N | \_\_\_\_\_\_\_\_\_\_\_\_\_\_ |
| Active/cleared status | Y / N | \_\_\_\_\_\_\_\_\_\_\_\_\_\_ |
| Causes downtime flag | Y / N | \_\_\_\_\_\_\_\_\_\_\_\_\_\_ |

→ **If YES to ring buffer, skip Q12b.**

**Q12b** (only if Q12a=N): Does the PLC have **per-machine alarm bitmask registers** (DINT, each bit = one alarm type)? (Method B)

| Machine 1 | Machine 2 | Machine 3 | Machine 4 | Machine 5 |
|---|---|---|---|---|
| Y / N | Y / N | Y / N | Y / N | Y / N |

If YES: Register name(s):
- M1: \_\_\_\_\_\_\_\_\_\_  M2: \_\_\_\_\_\_\_\_\_\_  M3: \_\_\_\_\_\_\_\_\_\_  M4: \_\_\_\_\_\_\_\_\_\_  M5: \_\_\_\_\_\_\_\_\_\_

**Q12c**: Do you have a register for **current count of active (unresolved) alarms**?

Y / N    Register name: \_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_

---

### B5. Runtime / Availability (dashboard computes from machine states — optional PLC pre-compute)

| # | Question | Answer | Register Name (if Y) |
|---|---|---|---|
| Q13 | Does the PLC pre-compute planned production time (minutes)? | Y / N | \_\_\_\_\_\_\_\_\_\_\_\_\_\_ |
| Q14 | Does the PLC pre-compute lost time (minutes downtime)? | Y / N | \_\_\_\_\_\_\_\_\_\_\_\_\_\_ |

→ **If both N, dashboard computes from MACHINE_n_STATE_REG (Q2a) — zero extra cost.**

---

### B6. Bottleneck (fully optional — dashboard computes it)

| # | Question | Answer |
|---|---|---|
| Q15 | Does the PLC pre-compute a bottleneck machine ID (1–5)? | Y / N |

If YES: Register name: \_\_\_\_\_\_\_\_\_\_\_\_\_\_\_   Logic used: \_\_\_\_\_\_\_\_\_\_\_\_\_\_

→ **Always optional. Dashboard computes bottleneck from per-machine cycle times (Q1a) + user-entered ideal CT.**

---

## Section C: Communication Protocol

| # | Question | Answer |
|---|---|---|
| Q16 | How often do registers change? | Every \_\_\_\_ ms |
| Q17 | Are registers retentive on power cycle? | Y / N |


---

## Instructions for PLC Team

1. Answer each question with **Y** (already available) or **N** (not available)
2. For each **Y**, write the register name or bit name the dashboard should read
3. If a section has a Method A question answered **Y**, skip the Method B questions for that section
4. Return this form to the IOT team
5. We will map your available registers to dashboard capabilities and report back
