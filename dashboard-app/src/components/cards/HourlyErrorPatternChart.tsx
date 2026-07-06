import { Fragment } from 'react';
import { Card } from '../shared/Card';
import type { ErrorHourBucket, InfoId } from '../../types';
import { MACHINES } from '../../data/mockData';
import './HourlyErrorPatternChart.css';

interface Props {
  errHours: ErrorHourBucket[];
  onExplainClick?: (id: InfoId) => void;
}

function countColorClass(count: number): 'good' | 'warn' | 'bad' {
  if (count <= 1) return 'good';
  if (count <= 3) return 'warn';
  return 'bad';
}

export function HourlyErrorPatternChart({ errHours, onExplainClick }: Props) {
  return (
    <Card infoId="hourly-error-pattern" flex={6} onExplainClick={onExplainClick}>
      <div className="mini-title" style={{ marginBottom: 14, flexShrink: 0 }}>
        Interval Error Pattern (count + within-interval timing)
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
                        title={`${machine} — :${String(ev.min).padStart(2, '0')} — ${ev.cat}`}
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
          Machine error
        </span>
        <span>
          <i style={{ background: '#2563eb' }} />
          Human error
        </span>
        <span>
          <i style={{ background: '#a855f7' }} />
          Other / unusual
        </span>
      </div>
    </Card>
  );
}
