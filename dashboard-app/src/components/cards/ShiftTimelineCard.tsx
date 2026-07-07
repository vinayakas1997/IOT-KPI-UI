import { Fragment } from 'react';
import { Card } from '../shared/Card';
import type { StageBreakdowns, BufferWindow, InfoId, Language } from '../../types';
import { toMin } from '../../utils/time';
import { t, minutesLabel } from '../../i18n/strings';
import './ShiftTimelineCard.css';

interface Props {
  machines: string[];
  stageBreakdowns: StageBreakdowns;
  buffers: BufferWindow[];
  shiftStart: string;
  shiftEnd: string;
  language: Language;
  onExplainClick?: (id: InfoId) => void;
}

const AXIS_LABELS = ['8:20', '10:20', '12:20', '14:20', '16:20', '18:20', '19:20'];

export function ShiftTimelineCard({
  machines,
  stageBreakdowns,
  buffers,
  shiftStart,
  shiftEnd,
  language,
  onExplainClick,
}: Props) {
  const shiftStartMin = toMin(shiftStart);
  const shiftEndMin = toMin(shiftEnd);
  const shiftTotalMin = shiftEndMin - shiftStartMin;

  return (
    <Card infoId="mtbf-mttr-shift-timeline" flex={1} onExplainClick={onExplainClick}>
      <div className="mini-title">
        {t('shiftTimeline', language)} ({shiftStart} – {shiftEnd})
      </div>
      <div className="mttr-frame">
        <div className="mttr-grid">
          <div />
          <div className="mttr-axis-cell">
            {AXIS_LABELS.map((label) => (
              <span key={label}>{label}</span>
            ))}
          </div>

          {machines.map((machine) => {
            const breakdowns = stageBreakdowns[machine] ?? [];

            return (
              <Fragment key={machine}>
                <div className="mttr-label">{machine}</div>
                <div className="mttr-track">
                  {buffers.map((b, i) => {
                    const startMin = toMin(b.start) - shiftStartMin;
                    const dur = toMin(b.end) - toMin(b.start);
                    return (
                      <div
                        key={i}
                        className="mttr-buffer-block"
                        style={{ left: `${(startMin / shiftTotalMin) * 100}%`, width: `${(dur / shiftTotalMin) * 100}%` }}
                        title={`${t('bufferTooltipPrefix', language)} ${b.start}–${b.end} (${minutesLabel(dur, language)})`}
                      />
                    );
                  })}
                  {breakdowns.map((bd, i) => {
                    const startMin = toMin(bd.start) - shiftStartMin;
                    const dur = toMin(bd.end) - toMin(bd.start);
                    return (
                      <div
                        key={i}
                        className="mttr-down-block"
                        style={{ left: `${(startMin / shiftTotalMin) * 100}%`, width: `${(dur / shiftTotalMin) * 100}%` }}
                        title={`${bd.start}–${bd.end} (${minutesLabel(dur, language)})`}
                      />
                    );
                  })}
                </div>
              </Fragment>
            );
          })}

          <div />
          <div className="mttr-legend-cell">
            <span>
              <i style={{ background: 'var(--green)' }} />
              {t('running', language)}
            </span>
            <span>
              <i style={{ background: 'var(--red)' }} />
              {t('downUnplanned', language)}
            </span>
            <span>
              <i style={{ background: '#cbd5e1' }} />
              {t('buffer', language)}
            </span>
          </div>
        </div>
      </div>
    </Card>
  );
}
