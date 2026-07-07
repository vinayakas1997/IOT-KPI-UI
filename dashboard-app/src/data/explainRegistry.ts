import type { InfoId } from '../types';
import type { StringKey } from '../i18n/strings';

export interface ExplainEntry {
  titleKey: StringKey;
  /** Filename in each-component-explanation/, relative to repo root. */
  mdFile: string;
}

/**
 * infoId -> explanation lookup. titleKey resolves into strings.ts so the modal
 * title stays in sync with the same EN/JP dictionary used everywhere else.
 */
export const explainRegistry: Record<InfoId, ExplainEntry> = {
  'total-approved-units': { titleKey: 'totalApprovedUnits', mdFile: '01-total-approved-units.md' },
  'total-defects': { titleKey: 'totalDefects', mdFile: '02-total-defects.md' },
  'defect-percentage': { titleKey: 'defectPercentage', mdFile: '03-defect-percentage.md' },
  'plan-achieve-percentage': { titleKey: 'planAchievePercentage', mdFile: '04-plan-achieve-percentage.md' },
  'oee-percentage-analysis': { titleKey: 'oeePercentageAnalysis', mdFile: '05-oee-percentage-analysis.md' },
  'bottleneck-machine': { titleKey: 'bottleneckMachine', mdFile: '06-bottleneck-machine.md' },
  'first-pass-yield-by-machine': {
    titleKey: 'firstPassYieldByMachine',
    mdFile: '07-first-pass-yield-by-machine.md',
  },
  'active-alarms': { titleKey: 'activeAlarms', mdFile: '08-active-alarms.md' },
  'machine-utilization': { titleKey: 'machineUtilizationModal', mdFile: '09-machine-utilization.md' },
  'cycle-time-analysis': { titleKey: 'cycleTimeAnalysis', mdFile: '10-cycle-time-analysis.md' },
  'production-vs-target-interval-tracking': {
    titleKey: 'productionVsTargetModal',
    mdFile: '11-production-vs-target-interval-tracking.md',
  },
  'cycle-time-energy-consumption': {
    titleKey: 'cycleTimeEnergyConsumption',
    mdFile: '12-cycle-time-energy-consumption.md',
  },
  'hourly-error-pattern': { titleKey: 'hourlyErrorPatternModal', mdFile: '13-hourly-error-pattern.md' },
  'mtbf-mttr-shift-timeline': {
    titleKey: 'shiftTimelineModal',
    mdFile: '14-shift-timeline.md',
  },
  'mtbf-mttr-tracking-window': {
    titleKey: 'mtbfMttrReliabilityMetrics',
    mdFile: '17-mtbf-mttr-reliability-metrics.md',
  },
  'mtbf-mttr-reliability-metrics': {
    titleKey: 'mtbfMttrReliabilityMetrics',
    mdFile: '17-mtbf-mttr-reliability-metrics.md',
  },
  'overall-line-health-radar': { titleKey: 'overallLineHealth', mdFile: '15-overall-line-health-radar.md' },
  'live-error-alarm-log': { titleKey: 'liveErrorAlarmLog', mdFile: '16-live-error-alarm-log.md' },
};
