import type { Language } from '../../types';
import { t } from '../../i18n/strings';
import './DisplayTabsBar.css';

interface Props {
  language: Language;
}

export function DisplayTabsBar({ language }: Props) {
  return (
    <div className="display-tabs">
      <div className="display-tab active">{t('displayTab1', language)}</div>
      <div className="display-tab">{t('displayTab2', language)}</div>
      <div className="display-tab-add">+</div>
    </div>
  );
}
