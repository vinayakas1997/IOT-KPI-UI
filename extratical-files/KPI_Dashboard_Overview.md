# Manufacturing KPI Dashboard — Overview & Component Guide

## Purpose

This dashboard is built for a **single production line, single product, 5 sequential machine stages** setup. Unlike a multi-product/multi-line dashboard (which compares products or lines against each other), this dashboard's core job is to answer three questions continuously, in near real time:

1. **Are we going to hit today's production target?**
2. **If not, which machine/stage is responsible, and why?**
3. **Is the line getting healthier or degrading over time (reliability, quality, speed)?**

Every component below exists to answer one or more of those three questions. None of them are decorative — each one maps to a specific operational decision someone on the floor or in management needs to make.

---

## 1. Top KPI Scorecards

**Total Approved Units / Total Defects / Defect %**
- **What it shows:** Raw output count, how many of those units failed quality, and the resulting failure rate.
- **Understanding gained:** A single, unambiguous answer to "how are we doing today, quality-wise?" — no interpretation needed.
- **Business value:** This is the number a plant manager reports upward. It's also the anchor metric — every other component on this dashboard exists to explain *why* this number is what it is.

**Plan Achieve %** (Run time, Lost Time, Average UPH → combined %)
- **What it shows:** Actual output vs. planned output, plus the two levers behind it — how long the line actually ran, and how fast it ran while running.
- **Understanding gained:** Whether a shortfall is a **time problem** (line was down) or a **speed problem** (line ran but slowly).
- **Business value:** Prevents wasted investigation — if Plan Achieve% is low because of Lost Time, the fix is downtime reduction; if it's low despite full run time, the fix is a process/speed issue. Different root causes, different corrective actions.

**OEE % Analysis** (Availability × Performance × Quality)
- **What it shows:** The single most standard manufacturing efficiency metric — what fraction of theoretically possible output is actually realized, broken into its three loss categories.
- **Understanding gained:** Which of the three loss types (downtime, speed, quality) is dragging overall efficiency down the most.
- **Business value:** OEE is the industry-standard benchmark used to compare performance over time and against industry standards (typically 60% = average, 85%+ = world-class). It's the number used to justify capital investment, maintenance budgets, or process improvement projects.

---

## 2. The 5 High-Priority Additions

These were added specifically because a single-line, multi-stage layout has failure modes that a generic multi-product dashboard doesn't surface.

**Bottleneck Machine**
- **What it shows:** Which single machine currently has the longest cycle time — the one limiting the whole line's throughput.
- **Understanding gained:** In a sequential line, the line is only ever as fast as its slowest stage. This tells you *exactly* where to focus improvement effort — everywhere else is a lower priority by definition.
- **Business value:** Prevents wasted improvement spend on machines that aren't actually limiting output. Classic Theory of Constraints thinking, made visible.

**First Pass Yield (FPY) by Machine**
- **What it shows:** Of everything that entered *each* machine, what % came out good without rework or scrapping — not just the end-of-line defect rate.
- **Understanding gained:** *Where* in the process defects are actually introduced, not just how many exist in total. A defect caught at the last stage may have originated three stages earlier.
- **Business value:** Turns a vague "14% defect rate" into an actionable "Machine 3 is the source of most defects" — the difference between guessing and knowing where to intervene.

**Active Alarms**
- **What it shows:** A live count of currently unresolved issues.
- **Understanding gained:** Converts passive sensor data into something someone can act on right now, without digging through logs.
- **Business value:** Reduces response time to active problems — the single most direct lever on unplanned downtime cost.

**Machine Utilization (Running / Starved / Blocked)**
- **What it shows:** When a machine isn't running, *why not* — is it broken, waiting on the previous stage (starved), or unable to push output forward because the next stage is backed up (blocked)?
- **Understanding gained:** Distinguishes a machine's own problem from an upstream/downstream problem. A machine sitting idle isn't automatically the machine at fault.
- **Business value:** Prevents misdirected maintenance effort — sending a technician to "fix" a machine that's actually fine but starved by a slower upstream stage wastes time and doesn't solve the real issue.

**Production vs Target (Interval Tracking, incl. Overtime)**
- **What it shows:** Cumulative output vs. a checkpoint-based target across fixed time windows through the shift (plus overtime windows), color-coded: gray (not started), green (produced), yellow (current window, still time to catch up), red (closed window, genuine shortfall).
- **Understanding gained:** Whether the line is on pace *right now*, not just at the end of the day when it's too late to react.
- **Business value:** This is the difference between reactive and proactive management — a supervisor can intervene mid-shift instead of discovering a miss in tomorrow's report.

---

## 3. Hourly Error Pattern (count + within-hour timing)

- **What it shows:** How many defects/errors occurred in each time interval, plus the *exact timing* of each one within that interval (via minute-level tick marks), color-coded by cause category (machine / human / other).
- **Understanding gained:** Two layers of insight — (1) *when* during the day problems cluster (e.g., right after shift changeovers, or late in a run as tooling wears), and (2) whether a cluster of errors in one window came from one underlying event (tight clustering = something broke and kept failing) or unrelated random occurrences (spread out = coincidence, not a pattern).
- **Business value:** Pattern recognition at this level is what separates "we had a bad day" from "we have a recurring 1pm problem" — the latter is fixable with a specific intervention (e.g., a scheduled mid-shift check), the former isn't actionable at all.

---

## 4. MTBF / MTTR — Shift Timeline

- **What it shows:** For each machine, a visual timeline of the actual shift showing exactly when it was running (green) vs. down (red, sized by actual repair duration) — with **Mean Time Between Failures** and **Mean Time To Repair** calculated directly from those real events.
- **Understanding gained:** MTBF tells you *how often* a machine fails (reliability); MTTR tells you *how long* it takes to recover when it does (maintainability) — two different problems requiring two different fixes. A machine with low MTBF but low MTTR fails often but is quick to fix (root-cause the failure trigger); a machine with high MTBF but high MTTR rarely fails but is painful when it does (fix spare-parts/response readiness).
- **Business value:** This is the foundation of **Total Productive Maintenance (TPM)** — using real, live data (not lab/vendor estimates) to catch reliability degradation early and schedule preventive maintenance before a failure happens, rather than reacting after the fact.

---

## 5. Live Error / Alarm Log

- **What it shows:** A timestamped, plain-language record of every error — when, which machine, what specifically happened, and whether it's still active or already cleared.
- **Understanding gained:** The full context behind any aggregate number elsewhere on the dashboard — the "receipt" that lets someone verify or investigate a spike shown anywhere else.
- **Business value:** This is what someone actually opens when something looks wrong elsewhere on the dashboard — it's the drill-down layer that makes every summary number trustworthy and actionable rather than just a mystery statistic.

---

## How the Components Work Together

No single component tells the whole story — they're designed to be read as a chain:

1. **Top scorecards** tell you *that* something is off (e.g., OEE is 58%, lower than usual)
2. **The 5 priority cards** tell you *roughly where* (e.g., Machine 3 is the bottleneck, FPY confirms it's also the worst quality performer)
3. **Production vs Target** tells you *if it's already too late to fix today* or if there's still time
4. **Hourly Error Pattern** tells you *when* it's happening and whether it's a pattern or a one-off
5. **MTBF/MTTR** tells you *whether it's a reliability or a maintenance-speed problem*
6. **The Live Log** gives you the *exact facts* needed to actually go fix it

This layered structure — summary → localization → timing → root cause → actionable detail — is what turns a dashboard from a passive reporting tool into an active decision-support system for the floor.
