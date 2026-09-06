import { useEffect, useState } from 'react';
import type { Language } from '../../types';
import type { LiveSnapshot } from '../../api/types';
import { useCountUp } from '../../hooks/useCountUp';

interface Props {
  snapshot: LiveSnapshot;
  language: Language;
}

const T = {
  approved: { en: 'Approved Units', jp: '承認済み生産数' },
  defects: { en: 'Defects', jp: '不良数' },
  defectPct: { en: 'Defect %', jp: '不良率' },
  planAchieve: { en: 'Plan Achieve', jp: '計画達成率' },
  shiftClock: { en: 'Shift Clock', jp: 'シフト時計' },
  target: { en: 'target < 10%', jp: '目標 < 10%' },
  left: { en: 'left', jp: '残り' },
};

function toMin(hhmm: string): number {
  const [h, m] = hhmm.split(':').map(Number);
  return h * 60 + m;
}

export function KpiStrip({ snapshot, language }: Props) {
  const { scorecardTotals, planAchieve, shiftStart, shiftEnd } = snapshot;
  const approved = useCountUp(scorecardTotals.totalApprovedUnits);
  const defects = useCountUp(scorecardTotals.totalDefects);
  const defectPct = useCountUp(scorecardTotals.defectPct);
  const plan = useCountUp(planAchieve.planAchievePct);

  const [now, setNow] = useState(() => new Date());
  useEffect(() => {
    const id = window.setInterval(() => setNow(new Date()), 1000);
    return () => window.clearInterval(id);
  }, []);

  const hhmm = now.toTimeString().slice(0, 5);
  let leftMin = toMin(shiftEnd || '19:20') - (now.getHours() * 60 + now.getMinutes());
  if (leftMin < 0) leftMin = 0;
  const leftStr = `${Math.floor(leftMin / 60)}h ${String(leftMin % 60).padStart(2, '0')}m`;

  const planCls = planAchieve.planAchievePct >= 90 ? 'good' : planAchieve.planAchievePct >= 75 ? 'warn' : 'bad';
  const defCls = scorecardTotals.defectPct <= 10 ? 'good' : scorecardTotals.defectPct <= 15 ? 'warn' : 'bad';

  return (
    <div className="kpi-strip">
      <div className="kpi">
        <div className="k-label">{T.approved[language]}</div>
        <div className="k-big num">{approved.toLocaleString()}</div>
      </div>
      <div className="kpi">
        <div className="k-label">{T.defects[language]}</div>
        <div className="k-big num warn">{defects.toLocaleString()}</div>
      </div>
      <div className="kpi">
        <div className="k-label">{T.defectPct[language]}</div>
        <div className={`k-big num ${defCls}`}>{defectPct}%</div>
        <div className="k-sub">{T.target[language]}</div>
      </div>
      <div className="kpi">
        <div className="k-label">{T.planAchieve[language]}</div>
        <div className={`k-big num ${planCls}`}>{plan}%</div>
        <div className="k-sub">
          Run {planAchieve.runTimeHours}h · Lost {planAchieve.lostTimeHours}h · {planAchieve.avgUph} UPH
        </div>
      </div>
      <div className="kpi kpi-time">
        <div className="k-label">{T.shiftClock[language]}</div>
        <div className="k-big num">{hhmm}</div>
        <div className="k-sub">
          {shiftStart}–{shiftEnd} · {leftStr} {T.left[language]}
        </div>
      </div>
    </div>
  );
}
