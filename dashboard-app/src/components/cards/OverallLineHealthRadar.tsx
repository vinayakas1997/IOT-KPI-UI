import { useEffect, useRef } from 'react';
import { Card } from '../shared/Card';
import type { LineHealthMetric, InfoId, Language } from '../../types';
import { RADAR_ANGLES, radarPoint } from '../../utils/radarMath';
import { threeTierClass } from '../../utils/colorScale';
import { t, lineHealthLabel } from '../../i18n/strings';
import './OverallLineHealthRadar.css';

interface Props {
  metrics: LineHealthMetric[];
  language: Language;
  onExplainClick?: (id: InfoId) => void;
}

const SIZE = 320;
const CENTER = SIZE / 2;
const MAX_RADIUS = 90;
const LEVELS = [20, 40, 60, 80, 100];
const LABEL_OFFSET = 18;

export function OverallLineHealthRadar({ metrics, language, onExplainClick }: Props) {
  const svgRef = useRef<SVGSVGElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const tooltipRef = useRef<HTMLDivElement>(null);

  const resolvedMetrics = metrics.map((m) => ({ ...m, label: lineHealthLabel(m.key, language) }));

  useEffect(() => {
    const svg = svgRef.current;
    const tooltip = tooltipRef.current;
    const container = containerRef.current;
    if (!svg || !tooltip || !container) return;
    svg.innerHTML = '';

    const ns = 'http://www.w3.org/2000/svg';

    LEVELS.forEach((level) => {
      const r = MAX_RADIUS * (level / 100);
      const points = RADAR_ANGLES.map((angle) => {
        const p = radarPoint(CENTER, CENTER, r, angle);
        return `${p.x},${p.y}`;
      });
      const poly = document.createElementNS(ns, 'polygon');
      poly.setAttribute('points', points.join(' '));
      poly.setAttribute('class', `radar-grid-polygon${level === 100 ? ' outer' : ''}`);
      svg.appendChild(poly);
    });

    RADAR_ANGLES.forEach((angle) => {
      const p = radarPoint(CENTER, CENTER, MAX_RADIUS, angle);
      const line = document.createElementNS(ns, 'line');
      line.setAttribute('x1', String(CENTER));
      line.setAttribute('y1', String(CENTER));
      line.setAttribute('x2', String(p.x));
      line.setAttribute('y2', String(p.y));
      line.setAttribute('class', 'radar-axis-line');
      svg.appendChild(line);
    });

    const coordPoints = RADAR_ANGLES.map((angle, i) => {
      const val = resolvedMetrics[i].value;
      const r = MAX_RADIUS * (val / 100);
      const p = radarPoint(CENTER, CENTER, r, angle);
      return { ...p, val, name: resolvedMetrics[i].label, angle };
    });

    const dataPoly = document.createElementNS(ns, 'polygon');
    dataPoly.setAttribute('points', coordPoints.map((p) => `${p.x},${p.y}`).join(' '));
    dataPoly.setAttribute('class', 'radar-data-polygon');
    svg.appendChild(dataPoly);

    RADAR_ANGLES.forEach((angle, i) => {
      const outer = radarPoint(CENTER, CENTER, MAX_RADIUS + LABEL_OFFSET, angle);
      let textAnchor = 'middle';
      let dy = '0.35em';

      if (Math.abs(angle - Math.PI / 2) < 0.01) {
        textAnchor = 'middle';
        dy = '1.2em';
      } else if (Math.abs(angle + Math.PI / 2) < 0.01) {
        textAnchor = 'middle';
        dy = '-0.7em';
      } else if (Math.cos(angle) > 0.1) {
        textAnchor = 'start';
      } else if (Math.cos(angle) < -0.1) {
        textAnchor = 'end';
      }

      const text = document.createElementNS(ns, 'text');
      text.setAttribute('x', String(outer.x));
      text.setAttribute('y', String(outer.y));
      text.setAttribute('text-anchor', textAnchor);
      text.setAttribute('dy', dy);
      text.textContent = resolvedMetrics[i].label;
      svg.appendChild(text);
    });

    coordPoints.forEach((pt) => {
      const circle = document.createElementNS(ns, 'circle');
      circle.setAttribute('cx', String(pt.x));
      circle.setAttribute('cy', String(pt.y));
      circle.setAttribute('r', '5');
      circle.setAttribute('class', 'radar-vertex');

      circle.addEventListener('mouseenter', () => {
        tooltip.innerHTML = `<strong>${pt.name}</strong>: ${pt.val}%`;
        tooltip.style.display = 'block';
        const rect = circle.getBoundingClientRect();
        const containerRect = container.getBoundingClientRect();
        tooltip.style.left = `${rect.left - containerRect.left + rect.width / 2}px`;
        tooltip.style.top = `${rect.top - containerRect.top}px`;
        tooltip.style.opacity = '1';
      });
      circle.addEventListener('mouseleave', () => {
        tooltip.style.display = 'none';
        tooltip.style.opacity = '0';
      });

      svg.appendChild(circle);

      const offsetDist = 13;
      const numX = pt.x + offsetDist * Math.cos(pt.angle);
      const numY = pt.y + offsetDist * Math.sin(pt.angle) - 1;

      const valueText = document.createElementNS(ns, 'text');
      valueText.setAttribute('x', String(numX));
      valueText.setAttribute('y', String(numY));
      valueText.setAttribute('text-anchor', 'middle');
      valueText.setAttribute('dy', '0.35em');
      valueText.setAttribute('class', 'radar-value-label');
      valueText.textContent = String(pt.val);
      svg.appendChild(valueText);
    });
  }, [resolvedMetrics]);

  return (
    <Card infoId="overall-line-health-radar" flex={1.4} onExplainClick={onExplainClick}>
      <div className="mini-title" style={{ marginBottom: 4 }}>
        {t('overallLineHealth', language)}
      </div>
      <div className="radar-body">
        <div className="radar-svg-col" ref={containerRef}>
          <svg
            id="radarChartSvg"
            ref={svgRef}
            viewBox={`0 0 ${SIZE} ${SIZE}`}
            style={{ width: '100%', height: '100%', maxHeight: 320, display: 'block', overflow: 'visible' }}
          />
          <div className="radar-tooltip" ref={tooltipRef} />
        </div>
        <div className="radar-kpis-grid">
          {resolvedMetrics.map((m) => {
            const tier = threeTierClass(m.value);
            return (
              <div className="radar-kpi-item" key={m.key}>
                <span className="kpi-label">{m.label}</span>
                <span className={`kpi-value ${tier}`}>{m.value}%</span>
              </div>
            );
          })}
        </div>
      </div>
    </Card>
  );
}
