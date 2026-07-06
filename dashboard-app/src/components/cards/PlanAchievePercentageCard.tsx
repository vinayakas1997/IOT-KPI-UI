import { Card } from '../shared/Card';
import type { PlanAchieve, InfoId } from '../../types';

interface Props extends PlanAchieve {
  onExplainClick?: (id: InfoId) => void;
}

export function PlanAchievePercentageCard({ runTimeHours, lostTimeHours, avgUph, planAchievePct, onExplainClick }: Props) {
  return (
    <Card infoId="plan-achieve-percentage" title="Plan Achieve %" flex={1.6} onExplainClick={onExplainClick}>
      <div className="split-card">
        <div className="sub-list">
          <div className="sub-row">
            <span>Run time (Hrs)</span>
            <span className="val">{runTimeHours}</span>
          </div>
          <div className="sub-row">
            <span>Lost Time (Hrs)</span>
            <span className="val">{lostTimeHours}</span>
          </div>
          <div className="sub-row">
            <span>Average UPH</span>
            <span className="val">{avgUph}</span>
          </div>
        </div>
        <div className="split-big">{planAchievePct}%</div>
      </div>
    </Card>
  );
}
