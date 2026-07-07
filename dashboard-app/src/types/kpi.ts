import type { MachineId } from './machine';

export interface ScorecardTotals {
  totalApprovedUnits: number;
  totalDefects: number;
  defectPct: number;
}

export interface PlanAchieve {
  runTimeHours: number;
  lostTimeHours: number;
  avgUph: number;
  planAchievePct: number;
}

export interface OeeBreakdown {
  availabilityPct: number;
  performancePct: number;
  qualityPct: number;
  oeePct: number;
}

export interface CycleCompareEntry {
  machine: MachineId;
  actual: number;
  ideal: number;
}

export interface Bottleneck {
  machine: MachineId;
  cycleTimeActual: number;
  cycleTimeIdeal: number;
  compare: CycleCompareEntry[];
}

export interface FpyEntry {
  machine: MachineId;
  pct: number;
}

export interface UtilizationEntry {
  machine: MachineId;
  runPct: number;
  starvedPct: number;
  blockedPct: number;
}

export type LineHealthMetricKey =
  | 'availability'
  | 'performance'
  | 'quality'
  | 'reliability'
  | 'planAchieve'
  | 'firstPassYield';

export interface LineHealthMetric {
  key: LineHealthMetricKey;
  value: number;
}
