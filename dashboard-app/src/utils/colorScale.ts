/** Sub-row value color for split-cards (OEE, Plan Achieve) — teal when healthy, yellow below threshold. */
export function subRowValClass(pct: number, warnBelow = 90): string {
  return pct < warnBelow ? 'val yellow' : 'val';
}

/** good/bad threshold used by First Pass Yield and the cycle-compare bottleneck row. */
export function goodBadClass(pct: number, badBelow = 90): 'good' | 'bad' {
  return pct < badBelow ? 'bad' : 'good';
}

/** 3-tier good/warn/bad threshold used by the Overall Line Health radar's KPI grid. */
export function threeTierClass(value: number): 'good' | 'warn' | 'bad' {
  if (value < 75) return 'bad';
  if (value < 90) return 'warn';
  return 'good';
}
