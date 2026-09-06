import type { Language, UtilizationEntry } from '../../types';

interface Props {
  entries: UtilizationEntry[];
  language: Language;
}

const T = {
  title: { en: 'Machine Utilization · Run / Starved / Blocked', jp: '設備稼働率 · 稼働 / 待機 / 停止' },
};

export function MachineUtilization({ entries, language }: Props) {
  return (
    <div className="card col-4">
      <div className="k-label">{T.title[language]}</div>
      <div className="util">
        {entries.map((e) => (
          <div className="util-row" key={e.machine}>
            <span className="name">{e.machine.replace('Machine ', 'M')}</span>
            <div className="util-bar">
              <i className="seg-run" style={{ width: `${e.runPct}%` }} />
              <i className="seg-starv" style={{ width: `${e.starvedPct}%` }} />
              <i className="seg-block" style={{ width: `${e.blockedPct}%` }} />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
