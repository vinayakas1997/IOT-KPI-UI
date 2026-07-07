import { Card } from '../shared/Card';
import type { InfoId, Language } from '../../types';
import { t } from '../../i18n/strings';

interface Props {
  pct: number;
  language: Language;
  onExplainClick?: (id: InfoId) => void;
}

export function DefectPercentageCard({ pct, language, onExplainClick }: Props) {
  return (
    <Card infoId="defect-percentage" title={t('defectPercentage', language)} flex={1} onExplainClick={onExplainClick}>
      <div className="big-number" style={{ color: 'var(--yellow)' }}>
        {pct}%
      </div>
    </Card>
  );
}
