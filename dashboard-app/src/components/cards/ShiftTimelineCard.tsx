import { Fragment } from 'react';
import { Card } from '../shared/Card';
import type { StageBreakdowns, BufferWindow, InfoId } from '../../types';
import { toMin } from '../../utils/time';
import './ShiftTimelineCard.css';

interface Props {
  machines: string[];
  stageBreakdowns: StageBreakdowns;
  buffers: BufferWindow[];
  shiftStart: string;
  shiftEnd: string;
  onExplainClick?: (id: InfoId) => void;
}

const AXIS_LABELS = ['8:20', '10:20', '12:20', '14:20', '16:20', '18:20', '19:20'];

export function ShiftTimelineCard({ machines, stageBreakdowns, buffers, shiftStart, shiftEnd, onExplainClick }: Props) {
  const shiftStartMin = toMin(shiftStart);
  const shiftEndMin = toMin(shiftEnd);
  const shiftTotalMin = shiftEndMin - shiftStartMin;

  return (
    <Card infoId="mtbf-mttr-shift-timeline" flex={1} onExplainClick={onExplainClick}>
      <div className="mini-title">Shift Timeline ({shiftStart} – {shiftEnd})</div>
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
                        title={`Buffer: ${b.start}–${b.end} (${dur} min)`}
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
                        title={`${bd.start}–${bd.end} (${dur} min)`}
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
              Running
            </span>
            <span>
              <i style={{ background: 'var(--red)' }} />
              Down (unplanned)
            </span>
            <span>
              <i style={{ background: '#cbd5e1' }} />
              Buffer
            </span>
          </div>
        </div>
      </div>
    </Card>
  );
}
