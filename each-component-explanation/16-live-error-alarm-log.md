# Live Error / Alarm Log

## What is it?
A scrolling, reverse-chronological table of individual error/alarm events with Time, Machine, Error description, and Status (Active/Cleared).

## What is the KPI value of having it?
It's the auditable detail behind the summary metrics (Active Alarms, Hourly Error Pattern, MTBF/MTTR) — the place to check exactly what happened and when.

## What things do we need to calculate it?
No aggregation needed — it's the shared downtime/alarm event list itself, sorted by most recent first.
