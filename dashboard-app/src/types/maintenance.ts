import type { MachineId } from './machine';

/** "HH:MM" formatted timestamps. */
export interface BreakdownRange {
  start: string;
  end: string;
}

export type StageBreakdowns = Record<MachineId, BreakdownRange[]>;

export interface BufferWindow {
  start: string;
  end: string;
}
