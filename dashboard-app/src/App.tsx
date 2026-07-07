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
import { deriveErrLog } from './utils/deriveFromEvents';
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
  downtimeEvents,
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
  { key: 'availability', value: oeeBreakdown.availabilityPct },
  { key: 'performance', value: oeeBreakdown.performancePct },
  { key: 'quality', value: oeeBreakdown.qualityPct },
  { key: 'reliability', value: reliabilityPct },
  { key: 'planAchieve', value: planAchieve.planAchievePct },
  { key: 'firstPassYield', value: fpyAverage },
];

function App() {
  const [hoveredMachine, setHoveredMachine] = useState<string | null>(null);
  const [language, setLanguage] = useState<Language>('en');
  const [activeInfoId, setActiveInfoId] = useState<InfoId | null>(null);

  const errLog = deriveErrLog(downtimeEvents, language);

  const main = (
    <>
      <div className="row">
        <TotalApprovedUnitsCard value={scorecardTotals.totalApprovedUnits} language={language} onExplainClick={setActiveInfoId} />
        <TotalDefectsCard value={scorecardTotals.totalDefects} language={language} onExplainClick={setActiveInfoId} />
        <DefectPercentageCard pct={scorecardTotals.defectPct} language={language} onExplainClick={setActiveInfoId} />
        <PlanAchievePercentageCard {...planAchieve} language={language} onExplainClick={setActiveInfoId} />
        <OeePercentageAnalysisCard {...oeeBreakdown} language={language} onExplainClick={setActiveInfoId} />
      </div>
      <div className="row">
        <BottleneckMachineCard bottleneck={bottleneck} language={language} onExplainClick={setActiveInfoId} />
        <FirstPassYieldCard entries={fpyByMachine} language={language} onExplainClick={setActiveInfoId} />
        <ActiveAlarmsCard count={activeAlarmsCount} language={language} onExplainClick={setActiveInfoId} />
        <MachineUtilizationCard entries={utilization} language={language} onExplainClick={setActiveInfoId} />
      </div>
      <div className="row stretch">
        <CycleTimeAnalysisChart
          hours={hours}
          machineProfiles={machineProfiles}
          machineColors={machineColors}
          hoveredMachine={hoveredMachine}
          onHoverMachine={setHoveredMachine}
          language={language}
          onExplainClick={setActiveInfoId}
        />
        <ProductionVsTargetChart hours={hours} dailyTarget={dailyTarget} language={language} onExplainClick={setActiveInfoId} />
      </div>
      <div className="row stretch">
        <CycleTimeEnergyConsumptionChart
          hours={hours}
          machineProfiles={machineProfiles}
          machineColors={machineColors}
          hoveredMachine={hoveredMachine}
          onHoverMachine={setHoveredMachine}
          language={language}
          onExplainClick={setActiveInfoId}
        />
        <HourlyErrorPatternChart errHours={errHours} language={language} onExplainClick={setActiveInfoId} />
      </div>
      <div className="row stretch">
        <ShiftTimelineCard
          machines={MACHINES}
          stageBreakdowns={stageBreakdowns}
          buffers={buffers}
          shiftStart={shiftStart}
          shiftEnd={shiftEnd}
          language={language}
          onExplainClick={setActiveInfoId}
        />
        <MtbfMttrCard
          machines={MACHINES}
          stageBreakdowns={stageBreakdowns}
          buffers={buffers}
          shiftDate={shiftDate}
          shiftStart={shiftStart}
          shiftEnd={shiftEnd}
          language={language}
          onExplainClick={setActiveInfoId}
        />
        <OverallLineHealthRadar metrics={lineHealthMetrics} language={language} onExplainClick={setActiveInfoId} />
      </div>
    </>
  );

  return (
    <div className="app-shell">
      <DashboardHeader language={language} onLanguageChange={setLanguage} />
      <DashboardContainer
        main={main}
        sidebar={<LiveErrorAlarmLog entries={errLog} language={language} onExplainClick={setActiveInfoId} />}
      />
      <DisplayTabsBar language={language} />
      <ExplanationModal infoId={activeInfoId} language={language} onClose={() => setActiveInfoId(null)} />
    </div>
  );
}

export default App;
