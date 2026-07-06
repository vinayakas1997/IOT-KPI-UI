# Hourly Error Pattern (count + within-hour timing)

## What is it?
A per-interval chart showing error counts plus a per-machine timing track of exactly when within the interval each error happened, categorized machine/human/other.

## What is the KPI value of having it?
Within-interval timing reveals clustering patterns a simple count would miss, and the category split separates equipment issues from training/process issues.

## What things do we need to calculate it?
Derived from the shared downtime/alarm event list: each event's start time is bucketed into a shift interval and positioned by its offset into that interval's actual duration.
