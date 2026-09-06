import { useMemo } from 'react';
import type { Language } from '../../types';
import type { HourInterval } from '../../types';

interface Props {
  hours: HourInterval[];
  dailyTarget: number;
  language: Language;
}

const T = {
  title: { en: 'Production vs Target — Interval Tracking', jp: '生産 対 目標 — 区間トラッキング' },
  produced: { en: 'Produced', jp: '生産' },
  targetPace: { en: 'Target pace', jp: '目標ペース' },
  vsPlan: { en: 'vs plan', jp: '対計画' },
};

const W = 640,
  H = 180;

export function ProductionVsTarget({ hours, dailyTarget, language }: Props) {
  const model = useMemo(() => {
    const DAILY = dailyTarget || 1;
    const n = hours.length;
    const x0 = 30,
      x1 = W - 6;
    const xAt = (i: number) => x0 + (i / (n - 1)) * (x1 - x0);
    const yAt = (v: number) => H - 8 - (v / DAILY) * (H - 16);

    let cumP = 0,
      cumT = 0,
      cumTSoFar = 0;
    const P: number[][] = [];
    const Tpts: number[][] = [];
    let nowX = x0,
      nowY = yAt(0),
      nowVal = 0,
      doneCount = 0;

    hours.forEach((h, i) => {
      cumT += h.target;
      Tpts.push([xAt(i), yAt(cumT)]);
      if (h.status !== 'future') {
        cumP += h.produced;
        cumTSoFar += h.target;
        P.push([xAt(i), yAt(cumP)]);
        nowX = xAt(i);
        nowY = yAt(cumP);
        nowVal = cumP;
        doneCount = i + 1;
      }
    });

    const rate = cumTSoFar > 0 ? cumP / cumTSoFar : 1;
    const proj = Math.round(rate * DAILY);
    const endX = xAt(n - 1);
    const Tfwd = Tpts.slice(Math.max(0, doneCount - 1));

    return { xAt, yAt, P, Tpts, Tfwd, nowX, nowY, nowVal, endX, proj, DAILY, cumP };
  }, [hours, dailyTarget]);

  const { yAt, P, Tpts, Tfwd, nowX, nowY, nowVal, endX, proj, DAILY, cumP } = model;
  const pctL = (px: number) => (px / W) * 100;
  const pctT = (py: number) => (py / H) * 100;
  const short = DAILY - proj;

  return (
    <div className="card hero col-8">
      <div className="pvt-head">
        <span className="title-sm">{T.title[language]}</span>
        <span className="pvt-total">
          <span className="num">{cumP}</span>
          <small className="num"> / {DAILY}</small> <span className="delta down">▼ {proj}</span>
        </span>
      </div>
      <div className="fill pvt-area">
        <svg className="fit" viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="none">
          {[0, 0.5, 1].map((f) => (
            <line key={f} x1={30} y1={yAt(f * DAILY)} x2={W - 6} y2={yAt(f * DAILY)} stroke="var(--chart-grid)" />
          ))}
          <polygon points={`${nowX},${nowY} ${Tfwd.map((p) => p.join(',')).join(' ')} ${endX},${yAt(proj)}`} fill="#fbbf24" opacity={0.12} />
          <polyline points={Tpts.map((p) => p.join(',')).join(' ')} fill="none" stroke="#64748b" strokeWidth={2} strokeDasharray="6 5" />
          <polygon points={`30,${yAt(0)} ${P.map((p) => p.join(',')).join(' ')} ${nowX},${yAt(0)}`} fill="#2dd4bf" opacity={0.14} />
          <polyline points={P.map((p) => p.join(',')).join(' ')} fill="none" stroke="#2dd4bf" strokeWidth={3} />
          <polyline points={`${nowX},${nowY} ${endX},${yAt(proj)}`} fill="none" stroke="#2dd4bf" strokeWidth={2} strokeDasharray="2 4" opacity={0.65} />
          <line x1={nowX} y1={yAt(0)} x2={nowX} y2={yAt(DAILY)} stroke="#334155" strokeDasharray="3 3" />
          {P.map((p, i) => (
            <circle key={i} cx={p[0]} cy={p[1]} r={3.4} fill="#2dd4bf" />
          ))}
        </svg>
        <div className="pvt-ovl">
          <div className="lg">
            <span>
              <i style={{ borderColor: 'var(--accent)' }} />
              {T.produced[language]}
            </span>
            <span>
              <i style={{ borderTopStyle: 'dashed', borderColor: '#64748b' }} />
              {T.targetPace[language]}
            </span>
          </div>
          {[0, 0.5, 1].map((f) => (
            <div key={f} className="yl" style={{ top: `${pctT(yAt(f * DAILY))}%` }}>
              {Math.round(f * DAILY)}
            </div>
          ))}
          <div className="now" style={{ left: `${pctL(nowX)}%`, top: `${pctT(nowY)}%` }}>
            <s>NOW</s>
            <b>{nowVal}</b>
          </div>
          {short > 0 && (
            <div className="gap" style={{ left: `${pctL(endX) - 1}%`, top: `${pctT((yAt(proj) + yAt(DAILY)) / 2)}%` }}>
              −{short} {T.vsPlan[language]}
            </div>
          )}
        </div>
      </div>
      <div className="ivbars">
        {hours.map((h, i) => {
          const pct = h.target ? Math.min(100, Math.round((h.produced / h.target) * 100)) : 0;
          let c = 'var(--chart-idle)';
          if (h.status === 'done') c = pct >= 100 ? '#34d399' : '#f87171';
          else if (h.status === 'current') c = '#fbbf24';
          return (
            <div className="iv" key={i}>
              <div className="track">
                <div className="f" style={{ height: `${h.status === 'future' ? 4 : pct}%`, background: c }} />
              </div>
              <div className="cap">
                <b>{h.status === 'future' ? '—' : h.produced}</b>/{h.target}
              </div>
              <div className="lab">{h.label}</div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
