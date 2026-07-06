export interface SplinePoint {
  x: number;
  [key: string]: number;
}

/** Catmull-Rom-ish smoothing spline through points, sampled at [x, point[yProp]]. */
export function getSplinePath(points: SplinePoint[], yProp: string): string {
  if (points.length === 0) return '';
  if (points.length === 1) return `M ${points[0].x} ${points[0][yProp]}`;
  if (points.length === 2) {
    return `M ${points[0].x} ${points[0][yProp]} L ${points[1].x} ${points[1][yProp]}`;
  }

  let d = `M ${points[0].x} ${points[0][yProp]}`;
  for (let i = 0; i < points.length - 1; i++) {
    const p0 = points[i - 1] || points[i];
    const p1 = points[i];
    const p2 = points[i + 1];
    const p3 = points[i + 2] || p2;

    const cp1x = p1.x + (p2.x - p0.x) / 6;
    const cp1y = p1[yProp] + (p2[yProp] - p0[yProp]) / 6;
    const cp2x = p2.x - (p3.x - p1.x) / 6;
    const cp2y = p2[yProp] - (p3[yProp] - p1[yProp]) / 6;

    d += ` C ${cp1x} ${cp1y}, ${cp2x} ${cp2y}, ${p2.x} ${p2[yProp]}`;
  }
  return d;
}
