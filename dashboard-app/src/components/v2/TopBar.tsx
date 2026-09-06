import { useEffect, useState } from 'react';
import type { Language } from '../../types';
import type { LiveStatus } from '../../hooks/useLiveData';
import type { Theme } from '../../hooks/useTheme';

interface Props {
  language: Language;
  onLanguageChange: (l: Language) => void;
  theme: Theme;
  onToggleTheme: () => void;
  onOpenSettings: () => void;
  status: LiveStatus;
}

const T = {
  title: { en: 'Line A — Live KPIs', jp: 'ラインA — ライブKPI' },
  sub: { en: '· Assembly / Product Line A', jp: '· 組立 / 製造ライン A' },
  live: { en: 'LIVE · 5s', jp: 'ライブ · 5秒' },
  connecting: { en: 'CONNECTING…', jp: '接続中…' },
  offline: { en: 'OFFLINE', jp: 'オフライン' },
};

export function TopBar({ language, onLanguageChange, theme, onToggleTheme, onOpenSettings, status }: Props) {
  const [clock, setClock] = useState('');
  useEffect(() => {
    const tick = () => setClock(new Date().toLocaleTimeString());
    tick();
    const id = window.setInterval(tick, 1000);
    return () => window.clearInterval(id);
  }, []);

  const pillText = status === 'live' ? T.live[language] : status === 'connecting' ? T.connecting[language] : T.offline[language];

  return (
    <div className="wb-top">
      <h1>
        {T.title[language]} <span>{T.sub[language]}</span>
      </h1>
      <div className="spacer" />
      <span className={`wb-pill ${status}`}>
        <span className="dot" />
        {pillText}
      </span>
      <span className="wb-clock num">{clock}</span>
      <span className="wb-seg">
        <button type="button" className={language === 'en' ? 'on' : ''} onClick={() => onLanguageChange('en')}>
          EN
        </button>
        <button type="button" className={language === 'jp' ? 'on' : ''} onClick={() => onLanguageChange('jp')}>
          JP
        </button>
      </span>
      <button type="button" className="wb-iconbtn" onClick={onToggleTheme} title="Light / dark" aria-label="Toggle theme">
        {theme === 'dark' ? <SunIcon /> : <MoonIcon />}
      </button>
      <button type="button" className="wb-iconbtn" onClick={onOpenSettings} title="Settings" aria-label="Settings">
        <GearIcon />
      </button>
    </div>
  );
}

function SunIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <circle cx="12" cy="12" r="4.4" fill="currentColor" />
      <g stroke="currentColor" strokeWidth="2" strokeLinecap="round">
        <line x1="12" y1="1.6" x2="12" y2="4" />
        <line x1="12" y1="20" x2="12" y2="22.4" />
        <line x1="1.6" y1="12" x2="4" y2="12" />
        <line x1="20" y1="12" x2="22.4" y2="12" />
        <line x1="4.4" y1="4.4" x2="6.1" y2="6.1" />
        <line x1="17.9" y1="17.9" x2="19.6" y2="19.6" />
        <line x1="4.4" y1="19.6" x2="6.1" y2="17.9" />
        <line x1="17.9" y1="6.1" x2="19.6" y2="4.4" />
      </g>
    </svg>
  );
}

function MoonIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="M21 12.9A9 9 0 1 1 11.1 3 7 7 0 0 0 21 12.9z" fill="currentColor" />
    </svg>
  );
}

function GearIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
      <circle cx="12" cy="12" r="3.2" />
      <path d="M19.4 13.5a1.6 1.6 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.6 1.6 0 0 0-1.8-.3 1.6 1.6 0 0 0-1 1.5V21a2 2 0 0 1-4 0v-.2a1.6 1.6 0 0 0-1-1.5 1.6 1.6 0 0 0-1.8.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.6 1.6 0 0 0 .3-1.8 1.6 1.6 0 0 0-1.5-1H3a2 2 0 0 1 0-4h.2a1.6 1.6 0 0 0 1.5-1 1.6 1.6 0 0 0-.3-1.8l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.6 1.6 0 0 0 1.8.3H9a1.6 1.6 0 0 0 1-1.5V3a2 2 0 0 1 4 0v.2a1.6 1.6 0 0 0 1 1.5 1.6 1.6 0 0 0 1.8-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.6 1.6 0 0 0-.3 1.8V9a1.6 1.6 0 0 0 1.5 1H21a2 2 0 0 1 0 4h-.2a1.6 1.6 0 0 0-1.5 1z" />
    </svg>
  );
}
