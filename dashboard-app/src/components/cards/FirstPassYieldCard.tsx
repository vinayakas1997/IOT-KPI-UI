import { Card } from '../shared/Card';
import type { FpyEntry, InfoId } from '../../types';
import { goodBadClass } from '../../utils/colorScale';
import './FirstPassYieldCard.css';

interface Props {
  entries: FpyEntry[];
  onExplainClick?: (id: InfoId) => void;
}

export function FirstPassYieldCard({ entries, onExplainClick }: Props) {
  return (
    <Card infoId="first-pass-yield-by-machine" flex={1.3} onExplainClick={onExplainClick}>
      <div className="mini-title">First Pass Yield by Machine</div>
      <div className="fpy-strip">
        {entries.map((entry) => (
          <div className="fpy-item" key={entry.machine}>
            <div className="label">{entry.machine}</div>
            <div className={`val ${goodBadClass(entry.pct)}`}>{entry.pct}%</div>
          </div>
        ))}
      </div>
    </Card>
  );
}
