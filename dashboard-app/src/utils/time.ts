import type { BreakdownRange, BufferWindow } from '../types';

/** "HH:MM" -> minutes since midnight. */
export function toMin(hhmm: string): number {
  const [h, m] = hhmm.split(':').map(Number);
  return h * 60 + m;
}

export function totalBufferMinutes(buffers: BufferWindow[]): number {
  return buffers.reduce((sum, b) => sum + (toMin(b.end) - toMin(b.start)), 0);
}

export interface StageReliability {
  totalDown: number;
  failures: number;
  mtbfMin: number;
  mttrMin: number;
}

export function computeStageReliability(
  breakdowns: BreakdownRange[],
  shiftTotalMin: number,
  totalBufferMin: number,
): StageReliability {
  const failures = breakdowns.length;
  const totalDown = breakdowns.reduce((sum, b) => sum + (toMin(b.end) - toMin(b.start)), 0);
  const totalUp = shiftTotalMin - totalBufferMin - totalDown;
  const mtbfMin = failures > 0 ? totalUp / failures : totalUp;
  const mttrMin = failures > 0 ? totalDown / failures : 0;
  return { totalDown, failures, mtbfMin, mttrMin };
}
