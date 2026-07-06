/**
 * One value per file in each-component-explanation/NN-*.md (prefix/extension stripped).
 * Stable hook for the future click-to-explain feature — see data/explainRegistry.ts.
 */
export type InfoId =
  | 'total-approved-units'
  | 'total-defects'
  | 'defect-percentage'
  | 'plan-achieve-percentage'
  | 'oee-percentage-analysis'
  | 'bottleneck-machine'
  | 'first-pass-yield-by-machine'
  | 'active-alarms'
  | 'machine-utilization'
  | 'cycle-time-analysis'
  | 'production-vs-target-interval-tracking'
  | 'cycle-time-energy-consumption'
  | 'hourly-error-pattern'
  | 'mtbf-mttr-shift-timeline'
  | 'mtbf-mttr-tracking-window'
  | 'mtbf-mttr-reliability-metrics'
  | 'overall-line-health-radar'
  | 'live-error-alarm-log';
