import { Fragment } from 'react';
import { Card } from '../shared/Card';
import type { ErrorHourBucket, InfoId, Language } from '../../types';
import { MACHINES } from '../../data/mockData';
import { t, errorCategoryLabel } from '../../i18n/strings';
import './HourlyErrorPatternChart.css';

interface Props {
  errHours: ErrorHourBucket[];
  language: Language;
  onExplainClick?: (id: InfoId) => void;
}

function countColorClass(count: number): 'good' | 'warn' | 'bad' {
  if (count <= 1) return 'good';
  if (count <= 3) return 'warn';
  return 'bad';
}

export function HourlyErrorPatternChart({ errHours, language, onExplainClick }: Props) {
  return (
    <Card infoId="hourly-error-pattern" flex={6} onExplainClick={onExplainClick}>
      <div className="mini-title" style={{ marginBottom: 14, flexShrink: 0 }}>
        {t('hourlyErrorPattern', language)}
      </div>
      <div className="err-chart-frame">
        <div
          className="err-chart-grid"
          style={{ gridTemplateColumns: `minmax(56px, 14%) repeat(${errHours.length}, minmax(56px, 1fr))` }}
        >
          <div />
          {errHours.map((h) => (
            <div key={h.label} className={`err-count-top ${countColorClass(h.events.length)}`}>
              {h.events.length}
            </div>
          ))}

          {MACHINES.map((machine) => (
            <Fragment key={machine}>
              <div className="err-row-label">{machine}</div>
              {errHours.map((h) => (
                <div className="err-minute-track" key={`${machine}-${h.label}`}>
                  {h.events
                    .filter((ev) => ev.machine === machine)
                    .map((ev, i) => (
                      <div
                        key={i}
                        className={`err-tick ${ev.cat}`}
                        style={{ left: `calc(${(ev.min / h.durationMin) * 100}% - 1.5px)` }}
                        title={`${machine} — :${String(ev.min).padStart(2, '0')} — ${errorCategoryLabel(ev.cat, language)}`}
                      />
                    ))}
                </div>
              ))}
            </Fragment>
          ))}

          <div />
          {errHours.map((h) => (
            <div key={h.label} className="err-hour-label">
              {h.label}
            </div>
          ))}
        </div>
      </div>
      <div className="err-legend">
        <span>
          <i style={{ background: '#ef4444' }} />
          {t('machineError', language)}
        </span>
        <span>
          <i style={{ background: '#2563eb' }} />
          {t('humanError', language)}
        </span>
        <span>
          <i style={{ background: '#a855f7' }} />
          {t('otherUnusual', language)}
        </span>
      </div>
    </Card>
  );
}
