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
} from '../types';
import { toMin, totalBufferMinutes } from '../utils/time';
import { deriveStageBreakdowns, deriveErrHours, totalDowntimeMinutesUnion } from '../utils/deriveFromEvents';

/**
 * Single seam for demo data. Every number below is currently hardcoded in the
 * original static dashboard (markup or inline script) — this module is what
 * gets swapped for a live IoT data source later, without touching components.
 */

export const MACHINES = ['Machine 1', 'Machine 2', 'Machine 3', 'Machine 4', 'Machine 5'];

export const bottleneck: Bottleneck = {
  machine: 'Machine 3',
  cycleTimeActual: 58,
  cycleTimeIdeal: 45,
  compare: [
    { machine: 'Machine 1', actual: 38, ideal: 36 },
    { machine: 'Machine 2', actual: 44, ideal: 40 },
    { machine: 'Machine 3', actual: 58, ideal: 45 },
    { machine: 'Machine 4', actual: 41, ideal: 38 },
    { machine: 'Machine 5', actual: 34, ideal: 32 },
  ],
};

export const fpyByMachine: FpyEntry[] = [
  { machine: 'Machine 1', pct: 98 },
  { machine: 'Machine 2', pct: 95 },
  { machine: 'Machine 3', pct: 89 },
  { machine: 'Machine 4', pct: 97 },
  { machine: 'Machine 5', pct: 99 },
];

export const activeAlarmsCount = 2;

export const utilization: UtilizationEntry[] = [
  { machine: 'Machine 1', runPct: 82, starvedPct: 10, blockedPct: 8 },
  { machine: 'Machine 2', runPct: 70, starvedPct: 20, blockedPct: 10 },
  { machine: 'Machine 3', runPct: 60, starvedPct: 15, blockedPct: 25 },
  { machine: 'Machine 4', runPct: 75, starvedPct: 5, blockedPct: 20 },
  { machine: 'Machine 5', runPct: 88, starvedPct: 8, blockedPct: 4 },
];

export const machineColors: MachineColorMap = {
  'Machine 1': '#0d9488',
  'Machine 2': '#3b82f6',
  'Machine 3': '#ec4899',
  'Machine 4': '#f59e0b',
  'Machine 5': '#8b5cf6',
};

export const machineProfiles: MachineProfileMap = {
  'Machine 1': { cycleMin: 35, cycleMax: 42, energyMin: 15, energyMax: 20 },
  'Machine 2': { cycleMin: 40, cycleMax: 48, energyMin: 25, energyMax: 30 },
  'Machine 3': { cycleMin: 50, cycleMax: 58, energyMin: 35, energyMax: 42 },
  'Machine 4': { cycleMin: 38, cycleMax: 45, energyMin: 18, energyMax: 24 },
  'Machine 5': { cycleMin: 30, cycleMax: 38, energyMin: 12, energyMax: 18 },
};

export const shiftDate = '2026-07-06';
export const shiftStart = '08:20';
export const shiftEnd = '19:20';

export const buffers: BufferWindow[] = [
  { start: '08:20', end: '08:30' },
  { start: '13:00', end: '13:10' },
];

/** Single source of truth for the shift's 6-interval x-axis, reused by every chart that buckets by time. */
export const SHIFT_INTERVAL_BOUNDARIES = ['08:20', '10:20', '13:00', '15:10', '17:20', '19:20', '21:20'];
const SHIFT_INTERVAL_LABELS = [
  '8:20–10:20',
  '10:20–13:00',
  '13:00–15:10',
  '15:10–17:20',
  '17:20–19:20 (OT)',
  '19:20–21:20 (OT)',
];

/**
 * Shared event feed: 6 real stoppages (causesDowntime: true) that drive Lost Time / MTBF / MTTR,
 * plus 9 brief alarms that never stop the line. Everything downstream (error log, hourly pattern,
 * stage breakdowns, lost time) is derived from this one list so they can't drift out of sync.
 */
export const downtimeEvents: DowntimeEvent[] = [
  // Stoppages
  { machine: 'Machine 1', start: '10:05', durationMin: 15, category: 'machine', description: 'Conveyor jam forces stoppage', descriptionJp: 'コンベアジャムによる停止', status: 'cleared', causesDowntime: true },
  { machine: 'Machine 3', start: '11:40', durationMin: 30, category: 'machine', description: 'Mold temperature runaway shutdown', descriptionJp: '金型温度異常上昇による停止', status: 'cleared', causesDowntime: true },
  { machine: 'Machine 2', start: '12:00', durationMin: 35, category: 'machine', description: 'Feed hopper blockage', descriptionJp: '原料ホッパーの詰まり', status: 'cleared', causesDowntime: true },
  { machine: 'Machine 4', start: '14:00', durationMin: 15, category: 'human', description: 'Operator emergency stop', descriptionJp: 'オペレーターによる非常停止', status: 'cleared', causesDowntime: true },
  { machine: 'Machine 3', start: '15:15', durationMin: 90, category: 'machine', description: 'Hydraulic system failure', descriptionJp: '油圧システム故障', status: 'cleared', causesDowntime: true },
  { machine: 'Machine 2', start: '16:10', durationMin: 15, category: 'machine', description: 'Servo motor fault halts line', descriptionJp: 'サーボモーター異常によるライン停止', status: 'cleared', causesDowntime: true },
  // Brief alarms (no stoppage)
  { machine: 'Machine 4', start: '10:15', durationMin: 4, category: 'machine', description: 'Pressure spike detected', descriptionJp: '圧力の急上昇を検知', status: 'active', causesDowntime: false },
  { machine: 'Machine 3', start: '11:45', durationMin: 6, category: 'machine', description: 'Thermal calibration shift', descriptionJp: '温度校正のずれ', status: 'cleared', causesDowntime: false },
  { machine: 'Machine 3', start: '12:05', durationMin: 5, category: 'machine', description: 'Cycle time exceeded threshold', descriptionJp: 'サイクルタイムが閾値を超過', status: 'cleared', causesDowntime: false },
  { machine: 'Machine 3', start: '13:42', durationMin: 8, category: 'machine', description: 'Mold temperature out of range', descriptionJp: '金型温度が許容範囲外', status: 'active', causesDowntime: false },
  { machine: 'Machine 4', start: '14:05', durationMin: 3, category: 'human', description: 'E-stop triggered manually', descriptionJp: '手動による非常停止作動', status: 'cleared', causesDowntime: false },
  { machine: 'Machine 4', start: '15:12', durationMin: 7, category: 'machine', description: 'Nozzle alignment deviation', descriptionJp: 'ノズル位置のずれ', status: 'cleared', causesDowntime: false },
  { machine: 'Machine 5', start: '16:18', durationMin: 5, category: 'machine', description: 'Pneumatic pressure drop', descriptionJp: '空圧の低下', status: 'cleared', causesDowntime: false },
  { machine: 'Machine 2', start: '16:47', durationMin: 6, category: 'machine', description: 'Feed speed slow warning', descriptionJp: '供給速度低下の警告', status: 'cleared', causesDowntime: false },
  { machine: 'Machine 2', start: '17:15', durationMin: 4, category: 'human', description: 'Human override mismatch', descriptionJp: '手動操作の不整合', status: 'cleared', causesDowntime: false },
];

export const stageBreakdowns = deriveStageBreakdowns(downtimeEvents, MACHINES);
export const errHours = deriveErrHours(downtimeEvents, SHIFT_INTERVAL_BOUNDARIES, SHIFT_INTERVAL_LABELS);

// --- Calculation chain: everything below is derived, not hand-typed. ---

const plannedProductionMin = toMin(shiftEnd) - toMin(shiftStart) - totalBufferMinutes(buffers); // 640
const lostTimeMin = totalDowntimeMinutesUnion(downtimeEvents); // 175 (overlapping windows merged)
const runTimeHours = Math.round(((plannedProductionMin - lostTimeMin) / 60) * 100) / 100; // 7.75
const lostTimeHours = Math.round((lostTimeMin / 60) * 10) / 10; // 2.9

const availabilityPct = Math.round((((plannedProductionMin - lostTimeMin) / plannedProductionMin) * 100)); // 73
const performancePct = Math.round((bottleneck.cycleTimeIdeal / bottleneck.cycleTimeActual) * 100); // 78
const actualUph = Math.round(3600 / bottleneck.cycleTimeActual); // 62

const unitsProduced = Math.round(runTimeHours * actualUph); // 481
const defectPct = 14; // same story as before, now an input rather than a standalone number
const totalDefects = Math.round(unitsProduced * (defectPct / 100)); // 67
const totalApprovedUnits = unitsProduced - totalDefects; // 414
const qualityPct = Math.round((totalApprovedUnits / unitsProduced) * 100); // 86

const oeePct = Math.round(((availabilityPct / 100) * (performancePct / 100) * (qualityPct / 100)) * 100); // 49
const planAchievePct = Math.round((availabilityPct / 100) * (performancePct / 100) * 100); // 57

export const scorecardTotals: ScorecardTotals = {
  totalApprovedUnits,
  totalDefects,
  defectPct,
};

export const planAchieve: PlanAchieve = {
  runTimeHours,
  lostTimeHours,
  avgUph: actualUph,
  planAchievePct,
};

export const oeeBreakdown: OeeBreakdown = {
  availabilityPct,
  performancePct,
  qualityPct,
  oeePct,
};

export const dailyTarget = 1000;

export const hours: HourInterval[] = [
  { label: SHIFT_INTERVAL_LABELS[0], target: 150, produced: 150, status: 'done' },
  { label: SHIFT_INTERVAL_LABELS[1], target: 200, produced: 144, status: 'done', annotation: '*' },
  { label: SHIFT_INTERVAL_LABELS[2], target: 200, produced: 200, status: 'done' },
  { label: SHIFT_INTERVAL_LABELS[3], target: 150, produced: 135, status: 'current' },
  { label: SHIFT_INTERVAL_LABELS[4], target: 150, produced: 0, status: 'future' },
  { label: SHIFT_INTERVAL_LABELS[5], target: 150, produced: 0, status: 'future' },
];

/**
 * No dedicated "Reliability" card exists yet — placeholder until a real
 * MTBF/MTTR-derived reliability score feeds the radar directly.
 */
export const reliabilityPct = 76;
