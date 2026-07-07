import { Card } from '../shared/Card';
import type { InfoId, Language } from '../../types';
import { t } from '../../i18n/strings';
import './ActiveAlarmsCard.css';

interface Props {
  count: number;
  language: Language;
  onExplainClick?: (id: InfoId) => void;
}

export function ActiveAlarmsCard({ count, language, onExplainClick }: Props) {
  return (
    <Card infoId="active-alarms" flex={0.5} onExplainClick={onExplainClick}>
      <div className="mini-title">{t('activeAlarms', language)}</div>
      <div className={count === 0 ? 'alarm-number ok' : 'alarm-number'}>{count}</div>
    </Card>
  );
}
