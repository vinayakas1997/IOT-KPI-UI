import { Card } from '../shared/Card';
import type { InfoId } from '../../types';
import './ActiveAlarmsCard.css';

interface Props {
  count: number;
  onExplainClick?: (id: InfoId) => void;
}

export function ActiveAlarmsCard({ count, onExplainClick }: Props) {
  return (
    <Card infoId="active-alarms" flex={0.5} onExplainClick={onExplainClick}>
      <div className="mini-title">Active Alarms</div>
      <div className={count === 0 ? 'alarm-number ok' : 'alarm-number'}>{count}</div>
    </Card>
  );
}
