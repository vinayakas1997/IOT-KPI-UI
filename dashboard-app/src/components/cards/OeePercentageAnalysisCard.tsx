import { Card } from '../shared/Card';
import type { OeeBreakdown, InfoId, Language } from '../../types';
import { subRowValClass } from '../../utils/colorScale';
import { t } from '../../i18n/strings';

interface Props extends OeeBreakdown {
  language: Language;
  onExplainClick?: (id: InfoId) => void;
}

export function OeePercentageAnalysisCard({
  availabilityPct,
  performancePct,
  qualityPct,
  oeePct,
  language,
  onExplainClick,
}: Props) {
  return (
    <Card infoId="oee-percentage-analysis" title={t('oeePercentageAnalysis', language)} flex={1.6} onExplainClick={onExplainClick}>
      <div className="split-card">
        <div className="sub-list">
          <div className="sub-row">
            <span>{t('availability', language)}</span>
            <span className={subRowValClass(availabilityPct)}>{availabilityPct}%</span>
          </div>
          <div className="sub-row">
            <span>{t('performance', language)}</span>
            <span className={subRowValClass(performancePct)}>{performancePct}%</span>
          </div>
          <div className="sub-row">
            <span>{t('quality', language)}</span>
            <span className={subRowValClass(qualityPct)}>{qualityPct}%</span>
          </div>
        </div>
        <div className="split-big">{oeePct}%</div>
      </div>
    </Card>
  );
}
