import type { DowntimeEvent, ErrLogEntry, ErrorHourBucket, Language, MachineId, StageBreakdowns } from '../types';
import { toMin } from './time';

function minToHHMM(min: number): string {
  const h = Math.floor(min / 60);
  const m = min % 60;
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
}

export function deriveStageBreakdowns(events: DowntimeEvent[], machines: MachineId[]): StageBreakdowns {
  const result: StageBreakdowns = {};
  machines.forEach((m) => (result[m] = []));
  events
    .filter((e) => e.causesDowntime)
    .forEach((e) => {
      const startMin = toMin(e.start);
      result[e.machine].push({ start: e.start, end: minToHHMM(startMin + e.durationMin) });
    });
  return result;
}

export function deriveErrLog(events: DowntimeEvent[], language: Language): ErrLogEntry[] {
  return [...events]
    .sort((a, b) => toMin(b.start) - toMin(a.start))
    .map((e) => ({
      time: e.start,
      stage: e.machine,
      error: language === 'jp' ? e.descriptionJp : e.description,
      status: e.status,
    }));
}

export function deriveErrHours(
  events: DowntimeEvent[],
  intervalBoundaries: string[],
  labels: string[],
): ErrorHourBucket[] {
  return labels.map((label, i) => {
    const startBoundary = toMin(intervalBoundaries[i]);
    const endBoundary = toMin(intervalBoundaries[i + 1]);
    const bucketEvents = events
      .filter((e) => {
        const t = toMin(e.start);
        return t >= startBoundary && t < endBoundary;
      })
      .map((e) => ({ min: toMin(e.start) - startBoundary, cat: e.category, machine: e.machine }));
    return { label, events: bucketEvents, durationMin: endBoundary - startBoundary };
  });
}

export function totalDowntimeMinutesUnion(events: DowntimeEvent[]): number {
  const intervals = events
    .filter((e) => e.causesDowntime)
    .map((e) => {
      const start = toMin(e.start);
      return [start, start + e.durationMin] as [number, number];
    })
    .sort((a, b) => a[0] - b[0]);

  if (intervals.length === 0) return 0;

  let total = 0;
  let [curStart, curEnd] = intervals[0];
  for (let i = 1; i < intervals.length; i++) {
    const [s, e] = intervals[i];
    if (s <= curEnd) {
      curEnd = Math.max(curEnd, e);
    } else {
      total += curEnd - curStart;
      curStart = s;
      curEnd = e;
    }
  }
  total += curEnd - curStart;
  return total;
}
