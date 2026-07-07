import { Card } from '../shared/Card';
import type { Bottleneck, InfoId, Language } from '../../types';
import { t } from '../../i18n/strings';
import './BottleneckMachineCard.css';

interface Props {
  bottleneck: Bottleneck;
  language: Language;
  onExplainClick?: (id: InfoId) => void;
}

export function BottleneckMachineCard({ bottleneck, language, onExplainClick }: Props) {
  return (
    <Card infoId="bottleneck-machine" flex={1.3} onExplainClick={onExplainClick}>
      <div className="mini-title">{t('bottleneckMachine', language)}</div>
      <div className="bottleneck-stage">{bottleneck.machine}</div>
      <div className="bottleneck-sub">
        {t('cycleTimeLabel', language)} {bottleneck.cycleTimeActual}s {t('highest', language)} &middot;{' '}
        {t('idealLabel', language)} {bottleneck.cycleTimeIdeal}s
      </div>

      <div className="cycle-compare-header">{t('actualIdealSeconds', language)}</div>
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
