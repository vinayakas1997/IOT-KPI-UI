import type { Language } from '../../types';
import './LanguageToggle.css';

interface Props {
  language: Language;
  onChange: (language: Language) => void;
}

export function LanguageToggle({ language, onChange }: Props) {
  return (
    <div className="language-toggle">
      <button
        type="button"
        className={language === 'en' ? 'active' : ''}
        onClick={() => onChange('en')}
      >
        EN
      </button>
      <span className="language-toggle-divider">|</span>
      <button
        type="button"
        className={language === 'jp' ? 'active' : ''}
        onClick={() => onChange('jp')}
      >
        JP
      </button>
    </div>
  );
}
