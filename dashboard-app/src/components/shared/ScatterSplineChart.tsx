import { useEffect, useRef } from 'react';
import { Card } from './Card';
import './ScatterSplineChart.css';
import type { InfoId } from '../../types';
import type { HourInterval } from '../../types';
import type { MachineColorMap, MachineProfileMap } from '../../types';
import { createSeededRandom } from '../../utils/pseudoRandom';
import { getSplinePath } from '../../utils/spline';
import { SHIFT_INTERVAL_BOUNDARIES } from '../../data/mockData';

const CHART_LEFT = 40;
const CHART_RIGHT = 580;
const CHART_TOP = 15;
const CHART_BOTTOM = 145;
const INTERVAL_WIDTH = 90;

/** Shared x-axis boundaries for the fixed 6-interval shift, same source as every other time-bucketed chart. */
const X_AXIS_TICKS = SHIFT_INTERVAL_BOUNDARIES.map((boundary, i) => ({
  x: CHART_LEFT + i * INTERVAL_WIDTH,
  label: boundary.replace(/^0/, ''),
}));

export interface AxisConfig {
  title: string;
  maxValue: number;
  tickStep: number;
}

interface Props {
  infoId: InfoId;
  title: string;
  flex: number;
  axis: AxisConfig;
  hours: HourInterval[];
  machineProfiles: MachineProfileMap;
  machineColors: MachineColorMap;
  valueField: 'cycle' | 'energy';
  hoveredMachine: string | null;
  onHoverMachine: (machine: string | null) => void;
  cycleLabel: string;
  averageLabel: string;
  intervalLabel: string;
  onExplainClick?: (id: InfoId) => void;
}

function valueToY(value: number, maxValue: number): number {
  return CHART_BOTTOM - (value / maxValue) * (CHART_BOTTOM - CHART_TOP);
}

export function ScatterSplineChart({
  infoId,
  title,
  flex,
  axis,
  hours,
  machineProfiles,
  machineColors,
  valueField,
  hoveredMachine,
  onHoverMachine,
  cycleLabel,
  averageLabel,
  intervalLabel,
  onExplainClick,
}: Props) {
  const svgRef = useRef<SVGSVGElement>(null);
  const dynamicGroupRef = useRef<SVGGElement>(null);

  const yTicks: { value: number; y: number }[] = [];
  for (let v = axis.maxValue; v >= 0; v -= axis.tickStep) {
    yTicks.push({ value: v, y: valueToY(v, axis.maxValue) });
  }

  // Build scatter points + average trend lines once per data change (kept close to the
  // original hand-written generation logic — seeded jitter, per-interval averaging, splines).
  useEffect(() => {
    const group = dynamicGroupRef.current;
    if (!group) return;
    group.innerHTML = '';

    const machines = Object.keys(machineProfiles);
    const machineAverages: Record<string, { x: number; y: number; val: number; intervalLabel: string }[]> = {};
    machines.forEach((m) => (machineAverages[m] = []));

    hours.forEach((h, intervalIdx) => {
      if (h.status === 'future') return;

      const startX = CHART_LEFT + intervalIdx * INTERVAL_WIDTH;
      const centerX = startX + INTERVAL_WIDTH / 2;
      const numCycles = h.produced;
      const random = createSeededRandom(intervalIdx * 100);

      const intervalSums: Record<string, { sum: number; count: number }> = {};
      machines.forEach((m) => (intervalSums[m] = { sum: 0, count: 0 }));

      for (let i = 0; i < numCycles; i++) {
        const cx = startX + 5 + (i / numCycles) * 80 + random() * 4;

        machines.forEach((machine) => {
          const profile = machineProfiles[machine];
          const [min, max] = valueField === 'cycle' ? [profile.cycleMin, profile.cycleMax] : [profile.energyMin, profile.energyMax];
          let value = min + random() * (max - min);
          if (random() < 0.03) {
            value += valueField === 'cycle' ? 15 + random() * 20 : 8 + random() * 12;
          }

          const cy = valueToY(value, axis.maxValue);
          const color = machineColors[machine];
          const circle = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
          circle.setAttribute('cx', String(cx));
          circle.setAttribute('cy', String(cy));
          circle.setAttribute('r', '2');
          circle.setAttribute('fill', color);
          circle.setAttribute('opacity', '0.18');
          circle.style.transition = 'r 0.15s ease, opacity 0.15s ease, stroke-width 0.15s ease';
          circle.style.cursor = 'pointer';

          const tooltip = document.createElementNS('http://www.w3.org/2000/svg', 'title');
          tooltip.textContent = `${machine}\n${cycleLabel}: ${i + 1}\n${axis.title}: ${value.toFixed(1)}\n${intervalLabel}: ${h.label}`;
          circle.appendChild(tooltip);

          circle.addEventListener('mouseenter', () => {
            circle.setAttribute('r', '4.5');
            circle.setAttribute('opacity', '1');
            circle.setAttribute('stroke', '#ffffff');
            circle.setAttribute('stroke-width', '1');
          });
          circle.addEventListener('mouseleave', () => {
            circle.setAttribute('r', '2');
            circle.setAttribute('opacity', '0.18');
            circle.removeAttribute('stroke');
          });

          group.appendChild(circle);

          intervalSums[machine].sum += value;
          intervalSums[machine].count += 1;
        });
      }

      machines.forEach((machine) => {
        const stats = intervalSums[machine];
        if (stats.count > 0) {
          const avgVal = stats.sum / stats.count;
          machineAverages[machine].push({ x: centerX, y: valueToY(avgVal, axis.maxValue), val: avgVal, intervalLabel: h.label });
        }
      });
    });

    machines.forEach((machine) => {
      const color = machineColors[machine];
      const points = machineAverages[machine];

      const pathD = getSplinePath(
        points.map((p) => ({ x: p.x, y: p.y })),
        'y',
      );
      if (pathD) {
        const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
        path.setAttribute('d', pathD);
        path.setAttribute('stroke', color);
        path.setAttribute('stroke-width', '2');
        path.setAttribute('fill', 'none');
        path.setAttribute('opacity', '0.85');
        path.setAttribute('data-machine', machine);
        path.classList.add('trend-line');
        path.style.transition = 'stroke-width 0.15s ease, opacity 0.15s ease';
        group.appendChild(path);
      }

      points.forEach((pt) => {
        const dot = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
        dot.setAttribute('cx', String(pt.x));
        dot.setAttribute('cy', String(pt.y));
        dot.setAttribute('r', '3.5');
        dot.setAttribute('fill', color);
        dot.setAttribute('stroke', '#ffffff');
        dot.setAttribute('stroke-width', '1.5');
        dot.setAttribute('opacity', '0.95');
        dot.setAttribute('data-machine', machine);
        dot.classList.add('trend-dot');
        dot.style.transition = 'r 0.15s ease, stroke-width 0.15s ease, opacity 0.15s ease';
        dot.style.cursor = 'pointer';

        const tooltip = document.createElementNS('http://www.w3.org/2000/svg', 'title');
        tooltip.textContent = `${machine} ${averageLabel}\n${axis.title}: ${pt.val.toFixed(1)}\n${intervalLabel}: ${pt.intervalLabel}`;
        dot.appendChild(tooltip);

        dot.addEventListener('mouseenter', () => onHoverMachine(machine));
        dot.addEventListener('mouseleave', () => onHoverMachine(null));
        group.appendChild(dot);
      });
    });

    // Cross-chart highlight hookup for lines (dots already get listeners above)
    group.querySelectorAll<SVGPathElement>('.trend-line').forEach((line) => {
      const machine = line.getAttribute('data-machine');
      line.addEventListener('mouseenter', () => onHoverMachine(machine));
      line.addEventListener('mouseleave', () => onHoverMachine(null));
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hours, machineProfiles, machineColors, valueField, axis.maxValue, axis.title, cycleLabel, averageLabel, intervalLabel]);

  // Re-apply hover styling on this chart's own trend lines/dots whenever the shared
  // hovered machine changes — avoids rebuilding the whole chart on every hover event.
  useEffect(() => {
    const group = dynamicGroupRef.current;
    if (!group) return;
    group.querySelectorAll<SVGPathElement>('.trend-line').forEach((line) => {
      const isHovered = line.getAttribute('data-machine') === hoveredMachine;
      line.style.strokeWidth = hoveredMachine ? (isHovered ? '3.5' : '2') : '2';
      line.style.opacity = hoveredMachine ? (isHovered ? '1' : '0.15') : '0.85';
    });
    group.querySelectorAll<SVGCircleElement>('.trend-dot').forEach((dot) => {
      const isHovered = dot.getAttribute('data-machine') === hoveredMachine;
      dot.setAttribute('r', hoveredMachine ? (isHovered ? '5.5' : '3.5') : '3.5');
      dot.style.strokeWidth = hoveredMachine ? (isHovered ? '2' : '1.5') : '1.5';
      dot.style.opacity = hoveredMachine ? (isHovered ? '1' : '0.15') : '0.95';
    });
  }, [hoveredMachine]);

  const machines = Object.keys(machineColors);

  return (
    <Card
      infoId={infoId}
      flex={flex}
      className="chart-card"
      style={{ border: '2px dashed var(--border)' }}
      onExplainClick={onExplainClick}
    >
      <div className="mini-title" style={{ fontSize: 'clamp(11px, 0.85vw, 12.5px)', marginBottom: 0 }}>
        {title}
      </div>
      <div className="chart-svg-frame">
        <svg ref={svgRef} viewBox="0 0 600 180" width="100%" height="100%" style={{ display: 'block' }}>
          <text x={40} y={9} fontSize={8} fontWeight={600} fill="#6b7280" textAnchor="start">
            {axis.title}
          </text>

          {yTicks.map((tick) => {
            const isEdge = tick.value === axis.maxValue || tick.value === 0;
            const isMid = tick.value === axis.maxValue / 2;
            return (
              <g key={tick.value}>
                <line
                  x1={CHART_LEFT}
                  y1={tick.y}
                  x2={CHART_RIGHT}
                  y2={tick.y}
                  stroke={isEdge ? '#9ca3af' : isMid ? '#e5e7eb' : '#f3f4f6'}
                  strokeWidth={1}
                  strokeDasharray={isMid ? '2,2' : undefined}
                />
                <text x={32} y={tick.y + 3} fontSize={8} fill="#9ca3af" textAnchor="end">
                  {tick.value}
                </text>
              </g>
            );
          })}

          {X_AXIS_TICKS.map((tick, i) => {
            const isEdge = i === 0 || i === X_AXIS_TICKS.length - 1;
            const isMid = i === 3;
            return (
              <line
                key={tick.x}
                x1={tick.x}
                y1={CHART_TOP}
                x2={tick.x}
                y2={CHART_BOTTOM}
                stroke={isEdge ? '#9ca3af' : isMid ? '#e5e7eb' : '#f3f4f6'}
                strokeWidth={1}
                strokeDasharray={isMid ? '2,2' : undefined}
              />
            );
          })}
          <line x1={CHART_LEFT} y1={CHART_BOTTOM} x2={CHART_LEFT} y2={CHART_BOTTOM + 4} stroke="#9ca3af" />
          {X_AXIS_TICKS.map((tick) => (
            <text key={tick.x} x={tick.x} y={CHART_BOTTOM + 13} fontSize={8} fill="#9ca3af" textAnchor="middle">
              {tick.label}
            </text>
          ))}

          <g transform="translate(240, 172)">
            {machines.map((machine, i) => (
              <g key={machine} transform={`translate(${i * 30}, 0)`}>
                <circle cx={0} cy={0} r={3} fill={machineColors[machine]} />
                <text x={7} y={3} fontSize={8} fontWeight={600} fill="#6b7280">
                  M{i + 1}
                </text>
              </g>
            ))}
          </g>

          <g ref={dynamicGroupRef} />
        </svg>
      </div>
    </Card>
  );
}
