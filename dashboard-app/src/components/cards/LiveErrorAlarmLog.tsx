import { Card } from '../shared/Card';
import type { ErrLogEntry, InfoId, Language } from '../../types';
import { t } from '../../i18n/strings';
import './LiveErrorAlarmLog.css';

interface Props {
  entries: ErrLogEntry[];
  language: Language;
  onExplainClick?: (id: InfoId) => void;
}

export function LiveErrorAlarmLog({ entries, language, onExplainClick }: Props) {
  return (
    <Card
      infoId="live-error-alarm-log"
      title={t('liveErrorAlarmLog', language)}
      style={{ height: '100%', display: 'flex', flexDirection: 'column' }}
      onExplainClick={onExplainClick}
    >
      <div className="err-log-container">
        <table className="err-log-table">
          <thead>
            <tr>
              <th>{t('colTime', language)}</th>
              <th>{t('colMachine', language)}</th>
              <th>{t('colError', language)}</th>
              <th>{t('colStatus', language)}</th>
            </tr>
          </thead>
          <tbody>
            {entries.map((entry, i) => (
              <tr key={i}>
                <td>{entry.time}</td>
                <td>{entry.stage}</td>
                <td>{entry.error}</td>
                <td>
                  <span className={`status-pill ${entry.status}`}>
                    {entry.status === 'active' ? t('statusActive', language) : t('statusCleared', language)}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Card>
  );
}
