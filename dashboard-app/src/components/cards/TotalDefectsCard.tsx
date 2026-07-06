import { Card } from '../shared/Card';
import type { InfoId } from '../../types';

interface Props {
  value: number;
  onExplainClick?: (id: InfoId) => void;
}

export function TotalDefectsCard({ value, onExplainClick }: Props) {
  return (
    <Card infoId="total-defects" title="Total Defects" flex={1} onExplainClick={onExplainClick}>
      <div className="big-number">{value.toLocaleString()}</div>
    </Card>
  );
}
