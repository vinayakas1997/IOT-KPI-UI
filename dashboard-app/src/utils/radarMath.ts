/** Hexagon spoke angles: top, upper-right, lower-right, bottom, lower-left, upper-left. */
export const RADAR_ANGLES = [
  -Math.PI / 2,
  -Math.PI / 6,
  Math.PI / 6,
  Math.PI / 2,
  (5 * Math.PI) / 6,
  (7 * Math.PI) / 6,
];

export interface RadarPoint {
  x: number;
  y: number;
}

export function radarPoint(centerX: number, centerY: number, radius: number, angle: number): RadarPoint {
  return { x: centerX + radius * Math.cos(angle), y: centerY + radius * Math.sin(angle) };
}
