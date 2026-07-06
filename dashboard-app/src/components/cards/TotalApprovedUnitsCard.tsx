import { Card } from '../shared/Card';
import type { InfoId } from '../../types';

interface Props {
  value: number;
  onExplainClick?: (id: InfoId) => void;
}

export function TotalApprovedUnitsCard({ value, onExplainClick }: Props) {
  return (
    <Card infoId="total-approved-units" title="Total Approved Units" flex={1} onExplainClick={onExplainClick}>
      <div className="big-number">{value.toLocaleString()}</div>
    </Card>
  );
}
