# Cycle-Time Analysis (Chart)

## What is it?
A scatter/trend chart of individual unit cycle times per machine across the shift, with a smoothed per-interval average trend line.

## What is the KPI value of having it?
It reveals cycle-time drift and outlier spikes a single average would hide, and supports validating the Bottleneck Machine finding.

## What things do we need to calculate it?
Per-unit, timestamped cycle times per machine, grouped into the shift's interval buckets for the trend average.
