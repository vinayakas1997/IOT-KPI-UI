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
