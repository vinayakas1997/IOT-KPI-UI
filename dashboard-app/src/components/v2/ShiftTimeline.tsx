import type { BufferWindow, Language, StageBreakdowns } from '../../types';

interface Props {
  machines: string[];
  stageBreakdowns: StageBreakdowns;
  buffers: BufferWindow[];
  shiftStart: string;
  shiftEnd: string;
  language: Language;
}

const T = {
  title: { en: 'Shift Timeline — Run / Down / Buffer', jp: 'シフトタイムライン — 稼働 / 停止 / 休憩' },
  run: { en: 'Run', jp: '稼働' },
  down: { en: 'Down', jp: '停止' },
  buffer: { en: 'Buffer', jp: '休憩' },
};

function toMin(hhmm: string): number {
  const [h, m] = hhmm.split(':').map(Number);
  return h * 60 + m;
}

export function ShiftTimeline({ machines, stageBreakdowns, buffers, shiftStart, shiftEnd, language }: Props) {
  const s0 = toMin(shiftStart || '08:20');
  const s1 = toMin(shiftEnd || '19:20');
  const total = Math.max(1, s1 - s0);

  const axisTicks = [0, 0.25, 0.5, 0.75, 1].map((f) => {
    const min = s0 + f * total;
    return `${String(Math.floor(min / 60)).padStart(2, '0')}:${String(Math.round(min % 60)).padStart(2, '0')}`;
  });

  return (
    <div className="card col-4">
      <div className="k-label">{T.title[language]} ({shiftStart}–{shiftEnd})</div>
      <div className="tl">
        <div className="tl-axis">
          {axisTicks.map((t, i) => (
            <span key={i}>{t}</span>
          ))}
        </div>
        {machines.map((name) => {
          const downs = stageBreakdowns[name] ?? [];
          return (
            <div className="tl-row" key={name}>
              <span className="name">{name.replace('Machine ', 'M')}</span>
              <div className="tl-track">
                {buffers.map((b, i) => (
                  <div
                    key={`b${i}`}
                    className="buf"
                    style={{ left: `${((toMin(b.start) - s0) / total) * 100}%`, width: `${((toMin(b.end) - toMin(b.start)) / total) * 100}%` }}
                  />
                ))}
                {downs.map((d, i) => (
                  <div
                    key={`d${i}`}
                    className="down"
                    style={{ left: `${((toMin(d.start) - s0) / total) * 100}%`, width: `${((toMin(d.end) - toMin(d.start)) / total) * 100}%` }}
                  />
                ))}
              </div>
            </div>
          );
        })}
      </div>
      <div className="legend">
        <span>
          <i style={{ background: 'var(--accent)' }} />
          {T.run[language]}
        </span>
        <span>
          <i style={{ background: 'var(--bad)' }} />
          {T.down[language]}
        </span>
        <span>
          <i style={{ background: 'var(--chart-idle)' }} />
          {T.buffer[language]}
        </span>
      </div>
    </div>
  );
}
