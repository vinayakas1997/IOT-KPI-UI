import { Card } from '../shared/Card';
import type { InfoId } from '../../types';

interface Props {
  pct: number;
  onExplainClick?: (id: InfoId) => void;
}

export function DefectPercentageCard({ pct, onExplainClick }: Props) {
  return (
    <Card infoId="defect-percentage" title="Defect %" flex={1} onExplainClick={onExplainClick}>
      <div className="big-number" style={{ color: 'var(--yellow)' }}>
        {pct}%
      </div>
    </Card>
  );
}
