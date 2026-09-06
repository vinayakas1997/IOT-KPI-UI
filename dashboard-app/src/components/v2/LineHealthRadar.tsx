import type { Language, LineHealthMetric } from '../../types';

interface Props {
  metrics: LineHealthMetric[];
  language: Language;
}

const T = {
  title: { en: 'Overall Line Health', jp: 'ライン総合健全性' },
};

const LABEL: Record<string, { en: string; jp: string }> = {
  availability: { en: 'Availability', jp: '稼働率' },
  performance: { en: 'Performance', jp: '性能' },
  quality: { en: 'Quality', jp: '品質' },
  reliability: { en: 'Reliability', jp: '信頼性' },
  planAchieve: { en: 'Plan', jp: '計画' },
  firstPassYield: { en: 'FPY', jp: '良品率' },
};

const TARGET = 85;
const CX = 170,
  CY = 122,
  R = 74;

function ang(i: number) {
  return -Math.PI / 2 + (i * Math.PI) / 3;
}
function health(v: number) {
  return v >= 85 ? '#34d399' : v >= 70 ? '#fbbf24' : '#f87171';
}
function poly(pts: number[][]) {
  return pts.map((p) => p.join(',')).join(' ');
}

export function LineHealthRadar({ metrics, language }: Props) {
  const m = metrics.slice(0, 6);
  const dp = m.map((x, i) => [CX + R * (x.value / 100) * Math.cos(ang(i)), CY + R * (x.value / 100) * Math.sin(ang(i))]);
  const targetPts = m.map((_, i) => [CX + ((R * TARGET) / 100) * Math.cos(ang(i)), CY + ((R * TARGET) / 100) * Math.sin(ang(i))]);

  return (
    <div className="card hero col-3">
      <div className="k-label">{T.title[language]}</div>
      <div className="fill">
        <svg className="fit" viewBox="0 0 340 250" preserveAspectRatio="xMidYMid meet">
          <defs>
            <radialGradient id="radGrad" cx="50%" cy="45%" r="65%">
              <stop offset="0%" stopColor="rgba(45,212,191,.30)" />
              <stop offset="100%" stopColor="rgba(45,212,191,.05)" />
            </radialGradient>
            <filter id="radGlow" x="-30%" y="-30%" width="160%" height="160%">
              <feGaussianBlur stdDeviation="2.4" result="b" />
              <feMerge>
                <feMergeNode in="b" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
          </defs>

          {[0.25, 0.5, 0.75, 1].map((l) => (
            <polygon
              key={l}
              className={`radar-grid ${l === 1 ? 'radar-out' : ''}`}
              points={poly(m.map((_, i) => [CX + R * l * Math.cos(ang(i)), CY + R * l * Math.sin(ang(i))]))}
            />
          ))}
          {m.map((_, i) => (
            <line key={i} className="radar-axis" x1={CX} y1={CY} x2={CX + R * Math.cos(ang(i))} y2={CY + R * Math.sin(ang(i))} />
          ))}

          <g className="radar-data">
            <polygon className="radar-target" points={poly(targetPts)} />
            <polygon className="radar-poly" points={poly(dp)} />
            {dp.map((p, i) => (
              <circle key={i} className="radar-vtx" cx={p[0]} cy={p[1]} r={4.2} style={{ fill: health(m[i].value) }} />
            ))}
          </g>

          {m.map((x, i) => {
            const a = ang(i);
            const ux = CX + (R + 26) * Math.cos(a);
            const uy = CY + (R + 26) * Math.sin(a);
            let anchor: 'middle' | 'start' | 'end' = 'middle';
            let nameY: number, valY: number;
            if (Math.abs(Math.cos(a)) < 0.3) {
              if (Math.sin(a) < 0) {
                nameY = uy - 5;
                valY = uy + 11;
              } else {
                nameY = uy + 3;
                valY = uy + 19;
              }
            } else {
              anchor = Math.cos(a) > 0 ? 'start' : 'end';
              nameY = uy - 3;
              valY = uy + 13;
            }
            return (
              <g key={x.key}>
                <text className="radar-lbl" x={ux} y={nameY} textAnchor={anchor}>
                  {LABEL[x.key]?.[language] ?? x.key}
                </text>
                <text className="radar-val" x={ux} y={valY} textAnchor={anchor} fill={health(x.value)}>
                  {x.value}
                </text>
              </g>
            );
          })}
        </svg>
      </div>
    </div>
  );
}
