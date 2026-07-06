# Production vs Target — Interval Tracking (incl. Overtime)

## What is it?
An interval-by-interval bar chart of units produced vs. target across the shift (including overtime blocks), plus a running "Produced Today" total against the daily target (e.g., `374/1000`).

## What is the KPI value of having it?
It catches shortfalls within the current interval rather than at shift end, and its cumulative total is the headline signal for whether overtime will be needed.

## What things do we need to calculate it?
A per-interval target (from the daily target split) and actual units produced per interval: `% = Produced / Target × 100`.

## Human Input (set once)
Daily Target and its per-interval split are entered once per shift by production planning, then held fixed while actuals track automatically against it.
