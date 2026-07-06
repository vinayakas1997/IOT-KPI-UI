export type HourStatus = 'done' | 'current' | 'future';

export interface HourInterval {
  label: string;
  target: number;
  produced: number;
  status: HourStatus;
  /** Footnote shown under the produced count, e.g. a partial-data marker. */
  annotation?: string;
}
