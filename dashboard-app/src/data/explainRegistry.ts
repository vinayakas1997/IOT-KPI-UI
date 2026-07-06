import type { InfoId } from '../types';

export interface ExplainEntry {
  title: string;
  /** Filename in each-component-explanation/, relative to repo root. */
  mdFile: string;
}

/**
 * infoId -> explanation lookup. No content is loaded yet (no modal exists
 * yet) — this is the mapping the future click-to-explain feature reads from.
 */
export const explainRegistry: Record<InfoId, ExplainEntry> = {
  'total-approved-units': { title: 'Total Approved Units', mdFile: '01-total-approved-units.md' },
  'total-defects': { title: 'Total Defects', mdFile: '02-total-defects.md' },
  'defect-percentage': { title: 'Defect %', mdFile: '03-defect-percentage.md' },
  'plan-achieve-percentage': { title: 'Plan Achieve %', mdFile: '04-plan-achieve-percentage.md' },
  'oee-percentage-analysis': { title: 'OEE % Analysis', mdFile: '05-oee-percentage-analysis.md' },
  'bottleneck-machine': { title: 'Bottleneck Machine', mdFile: '06-bottleneck-machine.md' },
  'first-pass-yield-by-machine': {
    title: 'First Pass Yield by Machine',
    mdFile: '07-first-pass-yield-by-machine.md',
  },
  'active-alarms': { title: 'Active Alarms', mdFile: '08-active-alarms.md' },
  'machine-utilization': { title: 'Machine Utilization', mdFile: '09-machine-utilization.md' },
  'cycle-time-analysis': { title: 'Cycle-Time Analysis', mdFile: '10-cycle-time-analysis.md' },
  'production-vs-target-interval-tracking': {
    title: 'Production vs Target — Interval Tracking',
    mdFile: '11-production-vs-target-interval-tracking.md',
  },
  'cycle-time-energy-consumption': {
    title: 'Cycle Time Energy Consumption',
    mdFile: '12-cycle-time-energy-consumption.md',
  },
  'hourly-error-pattern': { title: 'Hourly Error Pattern', mdFile: '13-hourly-error-pattern.md' },
  'mtbf-mttr-shift-timeline': {
    title: 'Shift Timeline (Running / Down / Buffer)',
    mdFile: '14-shift-timeline.md',
  },
  'mtbf-mttr-tracking-window': {
    title: 'MTBF / MTTR — Reliability Metrics',
    mdFile: '17-mtbf-mttr-reliability-metrics.md',
  },
  'mtbf-mttr-reliability-metrics': {
    title: 'MTBF / MTTR — Reliability Metrics',
    mdFile: '17-mtbf-mttr-reliability-metrics.md',
  },
  'overall-line-health-radar': { title: 'Overall Line Health', mdFile: '15-overall-line-health-radar.md' },
  'live-error-alarm-log': { title: 'Live Error / Alarm Log', mdFile: '16-live-error-alarm-log.md' },
};
