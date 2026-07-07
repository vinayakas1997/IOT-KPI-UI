import type { MachineId } from './machine';

export type ErrorCategory = 'machine' | 'human' | 'other';

export interface ErrorEvent {
  min: number;
  cat: ErrorCategory;
  machine: MachineId;
}

export interface ErrorHourBucket {
  label: string;
  events: ErrorEvent[];
  /** Real length of this interval in minutes — ticks are positioned as a fraction of this, not a hardcoded 60. */
  durationMin: number;
}

export type LogStatus = 'active' | 'cleared';

export interface ErrLogEntry {
  time: string;
  stage: MachineId;
  error: string;
  status: LogStatus;
}

/**
 * Single source of truth for a downtime/alarm occurrence. `causesDowntime: true` events are real
 * stoppages (feed MTBF/MTTR + Lost Time); `false` events are brief alarms that don't stop the line.
 */
export interface DowntimeEvent {
  machine: MachineId;
  start: string; // "HH:MM"
  durationMin: number;
  category: ErrorCategory;
  description: string;
  descriptionJp: string;
  status: LogStatus;
  causesDowntime: boolean;
}
