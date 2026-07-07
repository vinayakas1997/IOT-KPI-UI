import { Card } from '../shared/Card';
import type { HourInterval, InfoId, Language } from '../../types';
import { t } from '../../i18n/strings';
import './ProductionVsTargetChart.css';

interface Props {
  hours: HourInterval[];
  dailyTarget: number;
  language: Language;
  onExplainClick?: (id: InfoId) => void;
}

function pctColorClass(pct: number, isCurrent: boolean): 'good' | 'warn' | 'bad' {
  if (pct >= 90) return 'good';
  if (pct >= 60 || isCurrent) return 'warn';
  return 'bad';
}

export function ProductionVsTargetChart({ hours, dailyTarget, language, onExplainClick }: Props) {
  const cumulativeProduced = hours.reduce((sum, h) => (h.status !== 'future' ? sum + h.produced : sum), 0);

  return (
    <Card infoId="production-vs-target-interval-tracking" flex={6} onExplainClick={onExplainClick}>
      <div className="production-header">
        <div className="mini-title" style={{ marginBottom: 0 }}>
          {t('productionVsTarget', language)}
        </div>
        <div>
          <div className="produced-today-label">{t('producedToday', language)}</div>
          <div className="produced-today-value">
            {cumulativeProduced}
            <span className="target">/{dailyTarget}</span>
          </div>
        </div>
      </div>
      <div className="hourly-chart-frame">
        <div className="hourly-chart">
          {hours.map((h) => {
            const pct = Math.min(100, (h.produced / h.target) * 100);
            const remaining = 100 - pct;
            const isFuture = h.status === 'future';
            const isCurrent = h.status === 'current';
            const colorClass = isFuture ? 'muted' : pctColorClass(pct, isCurrent);

            return (
              <div className="hour-col" key={h.label}>
                <div className="hour-mid-container">
                  <div className="bar-stack">
                    <div className={`hour-pct ${colorClass}`}>{isFuture ? '—' : `${Math.round(pct)}%`}</div>
                    <div className="hour-bar">
                      {!isFuture && (
                        <>
                          {remaining > 0 && (
                            <div
                              className={`hour-fill-top ${isCurrent ? 'yellow' : 'red'}`}
                              style={{ height: `${remaining}%` }}
                            />
                          )}
                          <div className="hour-fill-green" style={{ height: `${pct}%` }} />
                        </>
                      )}
                    </div>
                  </div>
                  <div className="hour-count">
                    {isFuture ? (
                      <span className="produced muted">&mdash;</span>
                    ) : (
                      <span className={`produced ${colorClass}${h.annotation ? ' with-annotation' : ''}`}>
                        {h.annotation && <span className="annotation">{h.annotation}</span>}
                        {h.produced}
                      </span>
                    )}
                    <span className="divider" />
                    <span className="target">{h.target}</span>
                  </div>
                </div>
                <div className="hour-label">{h.label}</div>
              </div>
            );
          })}
        </div>
      </div>
      <div className="hourly-legend">
        <span>
          <i style={{ background: 'var(--green)' }} />
          {t('produced', language)}
        </span>
        <span>
          <i style={{ background: 'var(--yellow)' }} />
          {t('remainingCurrentHour', language)}
        </span>
        <span>
          <i style={{ background: 'var(--red)' }} />
          {t('shortfallClosedHour', language)}
        </span>
        <span>
          <i style={{ background: '#d1d5db' }} />
          {t('notStarted', language)}
        </span>
      </div>
    </Card>
  );
}
