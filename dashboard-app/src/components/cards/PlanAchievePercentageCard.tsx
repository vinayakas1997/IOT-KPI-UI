import { Card } from '../shared/Card';
import type { PlanAchieve, InfoId, Language } from '../../types';
import { t } from '../../i18n/strings';

interface Props extends PlanAchieve {
  language: Language;
  onExplainClick?: (id: InfoId) => void;
}

export function PlanAchievePercentageCard({
  runTimeHours,
  lostTimeHours,
  avgUph,
  planAchievePct,
  language,
  onExplainClick,
}: Props) {
  return (
    <Card infoId="plan-achieve-percentage" title={t('planAchievePercentage', language)} flex={1.6} onExplainClick={onExplainClick}>
      <div className="split-card">
        <div className="sub-list">
          <div className="sub-row">
            <span>{t('runTimeHours', language)}</span>
            <span className="val">{runTimeHours}</span>
          </div>
          <div className="sub-row">
            <span>{t('lostTimeHours', language)}</span>
            <span className="val">{lostTimeHours}</span>
          </div>
          <div className="sub-row">
            <span>{t('averageUph', language)}</span>
            <span className="val">{avgUph}</span>
          </div>
        </div>
        <div className="split-big">{planAchievePct}%</div>
      </div>
    </Card>
  );
}
