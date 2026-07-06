import { Card } from '../shared/Card';
import type { ErrLogEntry, InfoId } from '../../types';
import './LiveErrorAlarmLog.css';

interface Props {
  entries: ErrLogEntry[];
  onExplainClick?: (id: InfoId) => void;
}

export function LiveErrorAlarmLog({ entries, onExplainClick }: Props) {
  return (
    <Card
      infoId="live-error-alarm-log"
      title="Live Error / Alarm Log"
      style={{ height: '100%', display: 'flex', flexDirection: 'column' }}
      onExplainClick={onExplainClick}
    >
      <div className="err-log-container">
        <table className="err-log-table">
          <thead>
            <tr>
              <th>Time</th>
              <th>Machine</th>
              <th>Error</th>
              <th>Status</th>
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
                    {entry.status === 'active' ? 'Active' : 'Cleared'}
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
