import type { Language } from '../../types';
import { LanguageToggle } from '../shared/LanguageToggle';

interface Props {
  language: Language;
  onLanguageChange: (language: Language) => void;
}

export function DashboardHeader({ language, onLanguageChange }: Props) {
  return (
    <div className="header">
      <span>Manufacturing KPI Dashboard — Product Line A</span>
      <LanguageToggle language={language} onChange={onLanguageChange} />
    </div>
  );
}
