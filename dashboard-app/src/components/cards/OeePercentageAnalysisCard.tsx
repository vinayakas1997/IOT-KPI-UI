import { Card } from '../shared/Card';
import type { OeeBreakdown, InfoId } from '../../types';
import { subRowValClass } from '../../utils/colorScale';

interface Props extends OeeBreakdown {
  onExplainClick?: (id: InfoId) => void;
}

export function OeePercentageAnalysisCard({ availabilityPct, performancePct, qualityPct, oeePct, onExplainClick }: Props) {
  return (
    <Card infoId="oee-percentage-analysis" title="OEE % Analysis" flex={1.6} onExplainClick={onExplainClick}>
      <div className="split-card">
        <div className="sub-list">
          <div className="sub-row">
            <span>Availability</span>
            <span className={subRowValClass(availabilityPct)}>{availabilityPct}%</span>
          </div>
          <div className="sub-row">
            <span>Performance</span>
            <span className={subRowValClass(performancePct)}>{performancePct}%</span>
          </div>
          <div className="sub-row">
            <span>Quality</span>
            <span className={subRowValClass(qualityPct)}>{qualityPct}%</span>
          </div>
        </div>
        <div className="split-big">{oeePct}%</div>
      </div>
    </Card>
  );
}
