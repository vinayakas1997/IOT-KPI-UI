import type { Language } from '../../types';
import type { OeeBreakdown } from '../../types';

interface Props {
  oee: OeeBreakdown;
  language: Language;
}

const T = {
  title: { en: 'Overall Equipment Effectiveness', jp: '総合設備効率 (OEE)' },
  availability: { en: 'Availability', jp: '稼働率' },
  performance: { en: 'Performance', jp: '性能' },
  quality: { en: 'Quality', jp: '品質' },
};

const CX = 100,
  CY = 112,
  START = -200,
  SWEEP = 220;

function rad(d: number) {
  return (d * Math.PI) / 180;
}
function arcPath(r: number, a0: number, sweep: number): string {
  const a1 = a0 + sweep;
  const x0 = CX + r * Math.cos(rad(a0));
  const y0 = CY + r * Math.sin(rad(a0));
  const x1 = CX + r * Math.cos(rad(a1));
  const y1 = CY + r * Math.sin(rad(a1));
  const large = sweep > 180 ? 1 : 0;
  return `M ${x0} ${y0} A ${r} ${r} 0 ${large} 1 ${x1} ${y1}`;
}
function color(v: number) {
  return v >= 85 ? '#34d399' : v >= 70 ? '#fbbf24' : '#f87171';
}

export function OeeGauge({ oee, language }: Props) {
  const arcs = [
    { v: oee.availabilityPct, r: 82 },
    { v: oee.performancePct, r: 64 },
    { v: oee.qualityPct, r: 46 },
  ];

  return (
    <div className="card hero col-3">
      <div className="k-label">{T.title[language]}</div>
      <div className="fill">
        <svg className="fit" viewBox="0 0 200 150" preserveAspectRatio="xMidYMid meet">
          {arcs.map((a, i) => (
            <g key={i}>
              <path d={arcPath(a.r, START, SWEEP)} fill="none" stroke="var(--surface-2)" strokeWidth={11} strokeLinecap="round" />
              <path
                className="oee-arc"
                d={arcPath(a.r, START, SWEEP)}
                fill="none"
                stroke={color(a.v)}
                strokeWidth={11}
                strokeLinecap="round"
                pathLength={100}
                strokeDasharray={100}
                strokeDashoffset={100 - Math.max(0, Math.min(100, a.v))}
              />
            </g>
          ))}
          <text x={CX} y={CY - 2} textAnchor="middle" fill={color(oee.oeePct)} style={{ font: "800 44px 'JetBrains Mono', monospace" }}>
            {oee.oeePct}%
          </text>
          <text x={CX} y={CY + 20} textAnchor="middle" fill="var(--tx-3)" style={{ font: "700 12px 'Inter'" }} letterSpacing="3">
            OEE
          </text>
        </svg>
      </div>
      <div className="gauge-rows">
        {[
          [T.availability[language], oee.availabilityPct],
          [T.performance[language], oee.performancePct],
          [T.quality[language], oee.qualityPct],
        ].map(([label, v]) => (
          <div className="gauge-row" key={label as string}>
            <span>{label}</span>
            <div className="bar">
              <i style={{ width: `${v}%`, background: color(v as number) }} />
            </div>
            <b className="num">{v}</b>
          </div>
        ))}
      </div>
    </div>
  );
}
