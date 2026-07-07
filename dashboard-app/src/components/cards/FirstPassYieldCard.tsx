import { Card } from '../shared/Card';
import type { FpyEntry, InfoId, Language } from '../../types';
import { goodBadClass } from '../../utils/colorScale';
import { t } from '../../i18n/strings';
import './FirstPassYieldCard.css';

interface Props {
  entries: FpyEntry[];
  language: Language;
  onExplainClick?: (id: InfoId) => void;
}

export function FirstPassYieldCard({ entries, language, onExplainClick }: Props) {
  return (
    <Card infoId="first-pass-yield-by-machine" flex={1.3} onExplainClick={onExplainClick}>
      <div className="mini-title">{t('firstPassYieldByMachine', language)}</div>
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
