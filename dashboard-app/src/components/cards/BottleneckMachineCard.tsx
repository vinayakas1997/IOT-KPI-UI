import { Card } from '../shared/Card';
import type { Bottleneck, InfoId } from '../../types';
import './BottleneckMachineCard.css';

interface Props {
  bottleneck: Bottleneck;
  onExplainClick?: (id: InfoId) => void;
}

export function BottleneckMachineCard({ bottleneck, onExplainClick }: Props) {
  return (
    <Card infoId="bottleneck-machine" flex={1.3} onExplainClick={onExplainClick}>
      <div className="mini-title">Bottleneck Machine</div>
      <div className="bottleneck-stage">{bottleneck.machine}</div>
      <div className="bottleneck-sub">
        Cycle Time: {bottleneck.cycleTimeActual}s (highest) &middot; Ideal: {bottleneck.cycleTimeIdeal}s
      </div>

      <div className="cycle-compare-header">Actual / Ideal (s)</div>
      <div className="cycle-compare-grid">
        {bottleneck.compare.map((entry) => (
          <div
            key={entry.machine}
            className={entry.machine === bottleneck.machine ? 'cycle-compare-item bad' : 'cycle-compare-item'}
          >
            <span className="name">{entry.machine}</span>
            <span className="vals">
              {entry.actual} / {entry.ideal}
            </span>
          </div>
        ))}
      </div>
    </Card>
  );
}
