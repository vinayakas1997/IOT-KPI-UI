import { Card } from '../shared/Card';
import type { StageBreakdowns, BufferWindow, InfoId } from '../../types';
import { toMin, totalBufferMinutes, computeStageReliability } from '../../utils/time';
import './MtbfMttrCard.css';

interface Props {
  machines: string[];
  stageBreakdowns: StageBreakdowns;
  buffers: BufferWindow[];
  shiftDate: string;
  shiftStart: string;
  shiftEnd: string;
  onExplainClick?: (id: InfoId) => void;
}

export function MtbfMttrCard({ machines, stageBreakdowns, buffers, shiftDate, shiftStart, shiftEnd, onExplainClick }: Props) {
  const shiftTotalMin = toMin(shiftEnd) - toMin(shiftStart);
  const totalBufferMin = totalBufferMinutes(buffers);

  const rows = machines.map((machine) => {
    const breakdowns = stageBreakdowns[machine] ?? [];
    return { machine, ...computeStageReliability(breakdowns, shiftTotalMin, totalBufferMin) };
  });

  const maxMtbf = Math.max(...rows.map((r) => r.mtbfMin));
  const minMtbf = Math.min(...rows.map((r) => r.mtbfMin));
  const minMttr = Math.min(...rows.map((r) => r.mttrMin));
  const maxMttr = Math.max(...rows.map((r) => r.mttrMin));

  return (
    <Card infoId="mtbf-mttr-reliability-metrics" flex={0.8} onExplainClick={onExplainClick}>
      <div
        className="mtbf-since-label"
        onClick={onExplainClick ? (e) => { e.stopPropagation(); onExplainClick('mtbf-mttr-tracking-window'); } : undefined}
      >
        Since {shiftDate}, {shiftStart}
      </div>
      <div className="mini-title">MTBF / MTTR by Machine</div>
      <div className="mtbf-list">
        {rows.map(({ machine, mtbfMin, mttrMin }) => {
          const mtbfClass = mtbfMin === maxMtbf ? 'good' : mtbfMin === minMtbf ? 'bad' : '';
          const mttrClass = mttrMin === minMttr ? 'good' : mttrMin === maxMttr ? 'bad' : '';

          return (
            <div className="mtbf-row" key={machine}>
              <span className="mtbf-machine">{machine}</span>
              <span className="mtbf-metric">
                MTBF: <b className={mtbfClass}>{(mtbfMin / 60).toFixed(1)}h</b>
              </span>
              <span className="mtbf-metric">
                MTTR: <b className={mttrClass}>{mttrMin.toFixed(0)}m</b>
              </span>
            </div>
          );
        })}
      </div>
    </Card>
  );
}
