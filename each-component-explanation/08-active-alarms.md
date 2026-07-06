# Active Alarms

## What is it?
A real-time count of currently open/unresolved alarms across the line (e.g., `2`), not a historical total.

## What is the KPI value of having it?
It's a leading indicator — unresolved alarms often precede stoppages or defects — that prompts a response before escalation.

## What things do we need to calculate it?
`Active Alarms = count(events where status = "active")` from the shared downtime/alarm event feed.
