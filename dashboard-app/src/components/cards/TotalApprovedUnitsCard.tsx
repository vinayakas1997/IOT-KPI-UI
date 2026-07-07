import { Card } from '../shared/Card';
import type { InfoId, Language } from '../../types';
import { t } from '../../i18n/strings';

interface Props {
  value: number;
  language: Language;
  onExplainClick?: (id: InfoId) => void;
}

export function TotalApprovedUnitsCard({ value, language, onExplainClick }: Props) {
  return (
    <Card infoId="total-approved-units" title={t('totalApprovedUnits', language)} flex={1} onExplainClick={onExplainClick}>
      <div className="big-number">{value.toLocaleString()}</div>
    </Card>
  );
}
