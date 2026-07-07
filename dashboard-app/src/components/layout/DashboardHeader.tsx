import type { Language } from '../../types';
import { LanguageToggle } from '../shared/LanguageToggle';
import { t } from '../../i18n/strings';

interface Props {
  language: Language;
  onLanguageChange: (language: Language) => void;
}

export function DashboardHeader({ language, onLanguageChange }: Props) {
  return (
    <div className="header">
      <span>{t('headerTitle', language)}</span>
      <LanguageToggle language={language} onChange={onLanguageChange} />
    </div>
  );
}
