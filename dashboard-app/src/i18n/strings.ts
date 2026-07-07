import type { ErrorCategory, Language, LineHealthMetricKey } from '../types';

export const strings = {
  // Header / chrome
  headerTitle: { en: 'Manufacturing KPI Dashboard — Product Line A', jp: '製造業KPIダッシュボード — 製造ラインA' },
  displayTab1: { en: 'Display 1', jp: 'ディスプレイ 1' },
  displayTab2: { en: 'Display 2', jp: 'ディスプレイ 2' },
  closeModal: { en: 'Close', jp: '閉じる' },

  // Card titles (also reused by explainRegistry where wording matches)
  totalApprovedUnits: { en: 'Total Approved Units', jp: '承認済み総生産数' },
  totalDefects: { en: 'Total Defects', jp: '総不良数' },
  defectPercentage: { en: 'Defect %', jp: '不良率' },
  planAchievePercentage: { en: 'Plan Achieve %', jp: '計画達成率' },
  oeePercentageAnalysis: { en: 'OEE % Analysis', jp: 'OEE分析' },
  bottleneckMachine: { en: 'Bottleneck Machine', jp: 'ボトルネック機械' },
  firstPassYieldByMachine: { en: 'First Pass Yield by Machine', jp: '機械別初回良品率' },
  activeAlarms: { en: 'Active Alarms', jp: 'アクティブアラーム' },
  machineUtilization: { en: 'Machine Utilization (Run / Starved / Blocked)', jp: '設備稼働率（稼働 / 待機 / ブロック）' },
  cycleTimeAnalysis: { en: 'Cycle-Time Analysis', jp: 'サイクルタイム分析' },
  productionVsTarget: {
    en: 'Production vs Target — Interval Tracking (incl. Overtime)',
    jp: '生産実績 対 目標 — 区間トラッキング（残業含む）',
  },
  cycleTimeEnergyConsumption: { en: 'Cycle Time Energy Consumption', jp: 'サイクルタイム別エネルギー消費量' },
  hourlyErrorPattern: {
    en: 'Interval Error Pattern (count + within-interval timing)',
    jp: '区間別エラー発生パターン（件数と発生タイミング）',
  },
  shiftTimeline: { en: 'Shift Timeline', jp: 'シフトタイムライン' },
  mtbfMttrByMachine: { en: 'MTBF / MTTR by Machine', jp: '機械別MTBF・MTTR' },
  overallLineHealth: { en: 'Overall Line Health', jp: 'ライン総合健全性' },
  liveErrorAlarmLog: { en: 'Live Error / Alarm Log', jp: 'リアルタイムエラー・アラームログ' },

  // Explanation-modal-only titles (differ slightly in wording from the card titles above)
  machineUtilizationModal: { en: 'Machine Utilization', jp: '設備稼働率' },
  productionVsTargetModal: { en: 'Production vs Target — Interval Tracking', jp: '生産実績 対 目標 — 区間トラッキング' },
  hourlyErrorPatternModal: { en: 'Hourly Error Pattern', jp: '時間別エラー発生パターン' },
  shiftTimelineModal: { en: 'Shift Timeline (Running / Down / Buffer)', jp: 'シフトタイムライン（稼働 / 停止 / バッファ）' },
  mtbfMttrReliabilityMetrics: { en: 'MTBF / MTTR — Reliability Metrics', jp: 'MTBF・MTTR — 信頼性指標' },

  // Sub-labels / legends
  runTimeHours: { en: 'Run time (Hrs)', jp: '稼働時間（時間）' },
  lostTimeHours: { en: 'Lost Time (Hrs)', jp: 'ロスタイム（時間）' },
  averageUph: { en: 'Average UPH', jp: '平均UPH' },
  availability: { en: 'Availability', jp: '稼働率' },
  performance: { en: 'Performance', jp: 'パフォーマンス' },
  quality: { en: 'Quality', jp: '品質' },
  reliability: { en: 'Reliability', jp: '信頼性' },
  firstPassYieldLabel: { en: 'First Pass Yield', jp: '初回良品率' },

  cycleTimeLabel: { en: 'Cycle Time:', jp: 'サイクルタイム:' },
  highest: { en: '(highest)', jp: '（最大）' },
  idealLabel: { en: 'Ideal:', jp: '目標:' },
  actualIdealSeconds: { en: 'Actual / Ideal (s)', jp: '実績 / 目標（秒）' },

  running: { en: 'Running', jp: '稼働中' },
  starved: { en: 'Starved', jp: '待機（供給待ち）' },
  blocked: { en: 'Blocked', jp: 'ブロック（排出待ち）' },

  producedToday: { en: 'Produced Today', jp: '本日生産数' },
  produced: { en: 'Produced', jp: '生産済み' },
  remainingCurrentHour: { en: 'Remaining (current hour)', jp: '残り（当該区間）' },
  shortfallClosedHour: { en: 'Shortfall (closed hour)', jp: '未達（終了区間）' },
  notStarted: { en: 'Not started', jp: '未開始' },

  machineError: { en: 'Machine error', jp: '機械エラー' },
  humanError: { en: 'Human error', jp: '人為エラー' },
  otherUnusual: { en: 'Other / unusual', jp: 'その他 / 異常' },

  downUnplanned: { en: 'Down (unplanned)', jp: '停止（計画外）' },
  buffer: { en: 'Buffer', jp: 'バッファ' },
  bufferTooltipPrefix: { en: 'Buffer:', jp: 'バッファ:' },

  since: { en: 'Since', jp: '開始:' },
  mtbfLabel: { en: 'MTBF:', jp: 'MTBF:' },
  mttrLabel: { en: 'MTTR:', jp: 'MTTR:' },
  minuteUnit: { en: 'm', jp: '分' },

  colTime: { en: 'Time', jp: '時刻' },
  colMachine: { en: 'Machine', jp: '機械' },
  colError: { en: 'Error', jp: 'エラー' },
  colStatus: { en: 'Status', jp: 'ステータス' },
  statusActive: { en: 'Active', jp: '発生中' },
  statusCleared: { en: 'Cleared', jp: '解消済み' },

  cycleWord: { en: 'Cycle', jp: 'サイクル' },
  averageWord: { en: 'Average', jp: '平均' },
  intervalWord: { en: 'Interval', jp: '区間' },

  cycleTimeAxis: { en: 'Cycle Time (s)', jp: 'サイクルタイム（秒）' },
  energyAxis: { en: 'Energy (kW)', jp: 'エネルギー（kW）' },
} as const;

export type StringKey = keyof typeof strings;

export function t(key: StringKey, language: Language): string {
  return strings[key][language];
}

const lineHealthLabelKeys: Record<LineHealthMetricKey, StringKey> = {
  availability: 'availability',
  performance: 'performance',
  quality: 'quality',
  reliability: 'reliability',
  planAchieve: 'planAchievePercentage',
  firstPassYield: 'firstPassYieldLabel',
};

export function lineHealthLabel(key: LineHealthMetricKey, language: Language): string {
  return t(lineHealthLabelKeys[key], language);
}

const errorCategoryLabels: Record<ErrorCategory, { en: string; jp: string }> = {
  machine: { en: 'machine', jp: '機械' },
  human: { en: 'human', jp: '人為' },
  other: { en: 'other', jp: 'その他' },
};

export function errorCategoryLabel(category: ErrorCategory, language: Language): string {
  return errorCategoryLabels[category][language];
}

export function minutesLabel(value: number, language: Language): string {
  return language === 'jp' ? `${value}分` : `${value} min`;
}
