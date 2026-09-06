import type {
  ScorecardTotals,
  PlanAchieve,
  OeeBreakdown,
  Bottleneck,
  FpyEntry,
  UtilizationEntry,
  HourInterval,
  MachineColorMap,
  MachineProfileMap,
  BufferWindow,
  DowntimeEvent,
  ErrorHourBucket,
  StageBreakdowns,
} from '../types';

/**
 * Exact shape of `GET /api/snapshot` from the Python backend (see
 * server/app/compute.py::build_payload). Field names match the old
 * `data/mockData.ts` exports 1:1 so components didn't change.
 */
export interface LiveSnapshot {
  ready: boolean;
  generatedAt: string;
  businessDate: string;

  MACHINES: string[];
  scorecardTotals: ScorecardTotals;
  planAchieve: PlanAchieve;
  oeeBreakdown: OeeBreakdown;
  bottleneck: Bottleneck;
  fpyByMachine: FpyEntry[];
  activeAlarmsCount: number;
  utilization: UtilizationEntry[];
  reliabilityPct: number;

  hours: HourInterval[];
  dailyTarget: number;
  errHours: ErrorHourBucket[];
  downtimeEvents: DowntimeEvent[];
  stageBreakdowns: StageBreakdowns;

  energyByMachine: Record<string, number>;
  stateByMachine: Record<string, string>;

  buffers: BufferWindow[];
  shiftDate: string;
  shiftStart: string;
  shiftEnd: string;
  machineProfiles: MachineProfileMap;
  machineColors: MachineColorMap;
}
