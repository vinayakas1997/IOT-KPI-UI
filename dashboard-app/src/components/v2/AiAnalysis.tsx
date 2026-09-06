import { useEffect, useMemo, useRef, useState } from 'react';
import type { Language } from '../../types';
import type { LiveSnapshot } from '../../api/types';

interface Props {
  snapshot: LiveSnapshot;
  language: Language;
}

/** Regen cadence (minutes). Wired to Settings later. */
const AI_EVERY_MIN = 30;

const T = {
  title: { en: 'AI · Line Analysis', jp: 'AI · ライン分析' },
  justNow: { en: 'updated just now', jp: '更新: たった今' },
  agoFmt: { en: (m: number) => `updated ${m}m ago`, jp: (m: number) => `更新: ${m}分前` },
  every: { en: `· every ${AI_EVERY_MIN}m`, jp: `· ${AI_EVERY_MIN}分ごと` },
};

function buildSummary(s: LiveSnapshot, lang: Language) {
  const b = s.bottleneck;
  const overPct = b.cycleTimeIdeal ? Math.round(((b.cycleTimeActual - b.cycleTimeIdeal) / b.cycleTimeIdeal) * 100) : 0;

  // projection
  let cumP = 0,
    cumTSoFar = 0;
  s.hours.forEach((h) => {
    if (h.status !== 'future') {
      cumP += h.produced;
      cumTSoFar += h.target;
    }
  });
  const rate = cumTSoFar > 0 ? cumP / cumTSoFar : 1;
  const proj = Math.round(rate * (s.dailyTarget || 0));
  const short = (s.dailyTarget || 0) - proj;

  // dominant downtime cause
  const counts = new Map<string, number>();
  s.downtimeEvents
    .filter((e) => e.causesDowntime)
    .forEach((e) => {
      const k = lang === 'jp' ? e.descriptionJp : e.description;
      counts.set(k, (counts.get(k) ?? 0) + 1);
    });
  const topCause = [...counts.entries()].sort((a, c) => c[1] - a[1])[0];

  if (lang === 'jp') {
    return {
      lines: [
        { c: 'var(--bad)', html: `<b>${b.machine} がボトルネック</b> — サイクル ${b.cycleTimeActual}秒 / 理想 ${b.cycleTimeIdeal}秒 (+${overPct}%)。OEE は ${s.oeeBreakdown.oeePct}% に低下。` },
        {
          c: short > 0 ? 'var(--warn)' : 'var(--good)',
          html:
            short > 0
              ? `このペースだと着地は <b>${proj}</b> 台前後 — 目標 ${s.dailyTarget} に <b>約${short}台不足</b>。`
              : `このペースなら着地は <b>${proj}</b> 台、目標達成の見込み。`,
        },
        topCause ? { c: 'var(--warn)', html: `本日の停止要因の中心は <b>${topCause[0]}</b>（${topCause[1]}件）。` } : null,
      ].filter(Boolean) as { c: string; html: string }[],
      rec: `▶ 優先対応: ${b.machine} の停止を解消し、供給側を確認 — ${b.machine} を理想値に戻せば目標復帰の見込み。`,
    };
  }

  return {
    lines: [
      { c: 'var(--bad)', html: `<b>${b.machine} is the constraint</b> — cycle ${b.cycleTimeActual}s vs ${b.cycleTimeIdeal}s ideal (+${overPct}%). Holds OEE at ${s.oeeBreakdown.oeePct}%.` },
      {
        c: short > 0 ? 'var(--warn)' : 'var(--good)',
        html:
          short > 0
            ? `At this pace the shift lands near <b>${proj}</b> — about <b>${short} short</b> of ${s.dailyTarget}.`
            : `At this pace the shift lands near <b>${proj}</b> — on track for target.`,
      },
      topCause ? { c: 'var(--warn)', html: `Main downtime driver today: <b>${topCause[0]}</b> (${topCause[1]} stops).` } : null,
    ].filter(Boolean) as { c: string; html: string }[],
    rec: `▶ Priority: clear the ${b.machine} blockage and check its infeed — restoring ${b.machine} toward ideal puts projected output back above target.`,
  };
}

function Bot({ working }: { working: boolean }) {
  return (
    <span className={`ai-bot ${working ? 'working' : ''}`} aria-hidden="true">
      <svg viewBox="0 0 24 24">
        <line className="bot-ant" x1="12" y1="5" x2="12" y2="2.6" />
        <circle className="bot-dot" cx="12" cy="2" r="1.5" />
        <rect className="bot-head" x="3.5" y="5" width="17" height="13.5" rx="4" />
        <clipPath id="botClip">
          <rect x="3.5" y="5" width="17" height="13.5" rx="4" />
        </clipPath>
        <rect className="bot-scan" x="3.5" y="10.5" width="17" height="2" clipPath="url(#botClip)" />
        <circle className="bot-eye" cx="9" cy="11.6" r="1.8" />
        <circle className="bot-eye" cx="15" cy="11.6" r="1.8" />
        <line className="bot-mouth" x1="9.2" y1="15.4" x2="14.8" y2="15.4" />
      </svg>
    </span>
  );
}

export function AiAnalysis({ snapshot, language }: Props) {
  const summary = useMemo(() => buildSummary(snapshot, language), [snapshot, language]);
  const [elapsed, setElapsed] = useState(0);
  const [working, setWorking] = useState(true);
  const workTimer = useRef<number | null>(null);

  const startWorking = () => {
    setWorking(true);
    if (workTimer.current) window.clearTimeout(workTimer.current);
    workTimer.current = window.setTimeout(() => setWorking(false), 2600);
  };

  useEffect(() => {
    startWorking();
    const id = window.setInterval(() => {
      setElapsed((e) => {
        const next = (e + 1) % AI_EVERY_MIN;
        if (next === 0) startWorking();
        return next;
      });
    }, 60000);
    return () => {
      window.clearInterval(id);
      if (workTimer.current) window.clearTimeout(workTimer.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const stamp = elapsed === 0 ? T.justNow[language] : T.agoFmt[language](elapsed);

  return (
    <div className="ai-panel">
      <div className="ai-head">
        <Bot working={working} />
        <span className="ai-hgroup">
          <span className="ttl">{T.title[language]}</span>
          <span className="ai-when">
            <span className="dot" />
            <span>{stamp}</span>
            <span className="every">{T.every[language]}</span>
          </span>
        </span>
      </div>
      <div className="ai-body">
        {summary.lines.map((ln, i) => (
          <div className="ln" key={i}>
            <i style={{ background: ln.c }} />
            <span dangerouslySetInnerHTML={{ __html: ln.html }} />
          </div>
        ))}
        <div className="ai-rec">{summary.rec}</div>
      </div>
    </div>
  );
}
