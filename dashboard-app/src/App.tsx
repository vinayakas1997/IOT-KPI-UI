import { useState } from 'react';
import { DashboardHeader } from './components/layout/DashboardHeader';
import { DashboardContainer } from './components/layout/DashboardContainer';
import { DisplayTabsBar } from './components/layout/DisplayTabsBar';
import { TotalApprovedUnitsCard } from './components/cards/TotalApprovedUnitsCard';
import { TotalDefectsCard } from './components/cards/TotalDefectsCard';
import { DefectPercentageCard } from './components/cards/DefectPercentageCard';
import { PlanAchievePercentageCard } from './components/cards/PlanAchievePercentageCard';
import { OeePercentageAnalysisCard } from './components/cards/OeePercentageAnalysisCard';
import { BottleneckMachineCard } from './components/cards/BottleneckMachineCard';
import { FirstPassYieldCard } from './components/cards/FirstPassYieldCard';
import { ActiveAlarmsCard } from './components/cards/ActiveAlarmsCard';
import { MachineUtilizationCard } from './components/cards/MachineUtilizationCard';
import { CycleTimeAnalysisChart } from './components/cards/CycleTimeAnalysisChart';
import { ProductionVsTargetChart } from './components/cards/ProductionVsTargetChart';
import { CycleTimeEnergyConsumptionChart } from './components/cards/CycleTimeEnergyConsumptionChart';
import { HourlyErrorPatternChart } from './components/cards/HourlyErrorPatternChart';
import { ShiftTimelineCard } from './components/cards/ShiftTimelineCard';
import { MtbfMttrCard } from './components/cards/MtbfMttrCard';
import { OverallLineHealthRadar } from './components/cards/OverallLineHealthRadar';
import { LiveErrorAlarmLog } from './components/cards/LiveErrorAlarmLog';
import { ExplanationModal } from './components/shared/ExplanationModal';
import type { InfoId, Language, LineHealthMetric } from './types';
import {
  scorecardTotals,
  planAchieve,
  oeeBreakdown,
  bottleneck,
  fpyByMachine,
  activeAlarmsCount,
  utilization,
  hours,
  dailyTarget,
  errHours,
  errLog,
  MACHINES,
  stageBreakdowns,
  buffers,
  shiftDate,
  shiftStart,
  shiftEnd,
  machineProfiles,
  machineColors,
  reliabilityPct,
} from './data/mockData';

const fpyAverage = Math.round(fpyByMachine.reduce((sum, e) => sum + e.pct, 0) / fpyByMachine.length);

const lineHealthMetrics: LineHealthMetric[] = [
  { name: 'Availability', value: oeeBreakdown.availabilityPct },
  { name: 'Performance', value: oeeBreakdown.performancePct },
  { name: 'Quality', value: oeeBreakdown.qualityPct },
  { name: 'Reliability', value: reliabilityPct },
  { name: 'Plan Achieve %', value: planAchieve.planAchievePct },
  { name: 'First Pass Yield', value: fpyAverage },
];

function App() {
  const [hoveredMachine, setHoveredMachine] = useState<string | null>(null);
  const [language, setLanguage] = useState<Language>('en');
  const [activeInfoId, setActiveInfoId] = useState<InfoId | null>(null);

  const main = (
    <>
      <div className="row">
        <TotalApprovedUnitsCard value={scorecardTotals.totalApprovedUnits} onExplainClick={setActiveInfoId} />
        <TotalDefectsCard value={scorecardTotals.totalDefects} onExplainClick={setActiveInfoId} />
        <DefectPercentageCard pct={scorecardTotals.defectPct} onExplainClick={setActiveInfoId} />
        <PlanAchievePercentageCard {...planAchieve} onExplainClick={setActiveInfoId} />
        <OeePercentageAnalysisCard {...oeeBreakdown} onExplainClick={setActiveInfoId} />
      </div>
      <div className="row">
        <BottleneckMachineCard bottleneck={bottleneck} onExplainClick={setActiveInfoId} />
        <FirstPassYieldCard entries={fpyByMachine} onExplainClick={setActiveInfoId} />
        <ActiveAlarmsCard count={activeAlarmsCount} onExplainClick={setActiveInfoId} />
        <MachineUtilizationCard entries={utilization} onExplainClick={setActiveInfoId} />
      </div>
      <div className="row stretch">
        <CycleTimeAnalysisChart
          hours={hours}
          machineProfiles={machineProfiles}
          machineColors={machineColors}
          hoveredMachine={hoveredMachine}
          onHoverMachine={setHoveredMachine}
          onExplainClick={setActiveInfoId}
        />
        <ProductionVsTargetChart hours={hours} dailyTarget={dailyTarget} onExplainClick={setActiveInfoId} />
      </div>
      <div className="row stretch">
        <CycleTimeEnergyConsumptionChart
          hours={hours}
          machineProfiles={machineProfiles}
          machineColors={machineColors}
          hoveredMachine={hoveredMachine}
          onHoverMachine={setHoveredMachine}
          onExplainClick={setActiveInfoId}
        />
        <HourlyErrorPatternChart errHours={errHours} onExplainClick={setActiveInfoId} />
      </div>
      <div className="row stretch">
        <ShiftTimelineCard
          machines={MACHINES}
          stageBreakdowns={stageBreakdowns}
          buffers={buffers}
          shiftStart={shiftStart}
          shiftEnd={shiftEnd}
          onExplainClick={setActiveInfoId}
        />
        <MtbfMttrCard
          machines={MACHINES}
          stageBreakdowns={stageBreakdowns}
          buffers={buffers}
          shiftDate={shiftDate}
          shiftStart={shiftStart}
          shiftEnd={shiftEnd}
          onExplainClick={setActiveInfoId}
        />
        <OverallLineHealthRadar metrics={lineHealthMetrics} onExplainClick={setActiveInfoId} />
      </div>
    </>
  );

  return (
    <div className="app-shell">
      <DashboardHeader language={language} onLanguageChange={setLanguage} />
      <DashboardContainer
        main={main}
        sidebar={<LiveErrorAlarmLog entries={errLog} onExplainClick={setActiveInfoId} />}
      />
      <DisplayTabsBar />
      <ExplanationModal infoId={activeInfoId} language={language} onClose={() => setActiveInfoId(null)} />
    </div>
  );
}

export default App;
