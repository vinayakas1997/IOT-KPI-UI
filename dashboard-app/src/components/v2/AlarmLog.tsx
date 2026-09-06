import type { ErrLogEntry, Language } from '../../types';
import type { LiveSnapshot } from '../../api/types';
import { AiAnalysis } from './AiAnalysis';

interface Props {
  entries: ErrLogEntry[];
  snapshot: LiveSnapshot;
  language: Language;
}

const T = {
  title: { en: 'Live Error / Alarm Log', jp: 'エラー / アラーム ログ' },
  active: { en: 'ACTIVE', jp: '発生中' },
  cleared: { en: 'CLEARED', jp: '解消' },
};

export function AlarmLog({ entries, snapshot, language }: Props) {
  return (
    <div className="card log-card">
      <div className="k-label">{T.title[language]}</div>
      <div className="log">
        {entries.map((e, i) => (
          <div className={`log-row ${e.status === 'active' ? 'active' : ''}`} key={i} style={{ animationDelay: `${i * 40}ms` }}>
            <span className="rail2" />
            <span className="t">{e.time}</span>
            <span className="m">{e.stage.replace('Machine ', 'M')}</span>
            <span className="e">{e.error}</span>
            <span className={`tagp ${e.status}`}>{e.status === 'active' ? T.active[language] : T.cleared[language]}</span>
          </div>
        ))}
      </div>
      <AiAnalysis snapshot={snapshot} language={language} />
    </div>
  );
}
