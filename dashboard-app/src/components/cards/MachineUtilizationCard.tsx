import { Card } from '../shared/Card';
import type { UtilizationEntry, InfoId, Language } from '../../types';
import { t } from '../../i18n/strings';
import './MachineUtilizationCard.css';

interface Props {
  entries: UtilizationEntry[];
  language: Language;
  onExplainClick?: (id: InfoId) => void;
}

export function MachineUtilizationCard({ entries, language, onExplainClick }: Props) {
  return (
    <Card infoId="machine-utilization" flex={2.3} onExplainClick={onExplainClick}>
      <div className="mini-title">{t('machineUtilization', language)}</div>
      <div className="util-row">
        {entries.map((entry) => (
          <div className="util-stage" key={entry.machine}>
            <div className="util-label">{entry.machine}</div>
            <div className="util-bar">
              <div className="seg-run" style={{ width: `${entry.runPct}%` }} />
              <div className="seg-starved" style={{ width: `${entry.starvedPct}%` }} />
              <div className="seg-blocked" style={{ width: `${entry.blockedPct}%` }} />
            </div>
          </div>
        ))}
      </div>
      <div className="legend">
        <span>
          <i style={{ background: 'var(--teal)' }} />
          {t('running', language)}
        </span>
        <span>
          <i style={{ background: '#cbd5e1' }} />
          {t('starved', language)}
        </span>
        <span>
          <i style={{ background: 'var(--yellow)' }} />
          {t('blocked', language)}
        </span>
      </div>
    </Card>
  );
}
