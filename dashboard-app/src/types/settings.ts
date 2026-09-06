export interface BreakWindow {
  start: string;
  end: string;
}

export interface IntervalSetting {
  start: string;
  end: string;
  label: string;
  target: number;
}

/** Shape of the UI-editable settings (GET/PUT /api/config). */
export interface AppSettings {
  shiftStart: string;
  shiftEnd: string;
  buffers: BreakWindow[];
  intervals: IntervalSetting[];
  dailyTarget: number;
  idealCycleTime: Record<string, number>;
}

export interface ConfigResponse {
  config: AppSettings;
  defaults: AppSettings;
  machines: string[];
}
