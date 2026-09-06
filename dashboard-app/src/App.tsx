import { useState } from 'react';
import { TopBar } from './components/v2/TopBar';
import { KpiStrip } from './components/v2/KpiStrip';
import { LineFlow } from './components/v2/LineFlow';
import { OeeGauge } from './components/v2/OeeGauge';
import { LineHealthRadar } from './components/v2/LineHealthRadar';
import { ProductionVsTarget } from './components/v2/ProductionVsTarget';
import { MachineUtilization } from './components/v2/MachineUtilization';
import { ShiftTimeline } from './components/v2/ShiftTimeline';
import { AlarmLog } from './components/v2/AlarmLog';
import { SettingsPanel } from './components/settings/SettingsPanel';
import type { Language, LineHealthMetric } from './types';
import { deriveErrLog } from './utils/deriveFromEvents';
import { useLiveData } from './hooks/useLiveData';
import { useTheme } from './hooks/useTheme';

function App() {
  const [language, setLanguage] = useState<Language>('en');
  const [settingsOpen, setSettingsOpen] = useState(false);
  const { theme, toggle } = useTheme();
  const { snapshot, status, refresh } = useLiveData();

  const fpyAverage = snapshot.fpyByMachine.length
    ? Math.round(snapshot.fpyByMachine.reduce((sum, e) => sum + e.pct, 0) / snapshot.fpyByMachine.length)
    : 0;

  const lineHealthMetrics: LineHealthMetric[] = [
    { key: 'availability', value: snapshot.oeeBreakdown.availabilityPct },
    { key: 'performance', value: snapshot.oeeBreakdown.performancePct },
    { key: 'quality', value: snapshot.oeeBreakdown.qualityPct },
    { key: 'reliability', value: snapshot.reliabilityPct },
    { key: 'planAchieve', value: snapshot.planAchieve.planAchievePct },
    { key: 'firstPassYield', value: fpyAverage },
  ];

  const errLog = deriveErrLog(snapshot.downtimeEvents, language);

  return (
    <div className="wb-shell">
      <TopBar
        language={language}
        onLanguageChange={setLanguage}
        theme={theme}
        onToggleTheme={toggle}
        onOpenSettings={() => setSettingsOpen(true)}
        status={status}
      />

      <KpiStrip snapshot={snapshot} language={language} />

      <div className="wb-grid">
        <LineFlow snapshot={snapshot} language={language} />
        <OeeGauge oee={snapshot.oeeBreakdown} language={language} />
        <LineHealthRadar metrics={lineHealthMetrics} language={language} />

        <ProductionVsTarget hours={snapshot.hours} dailyTarget={snapshot.dailyTarget} language={language} />
        <AlarmLog entries={errLog} snapshot={snapshot} language={language} />

        <MachineUtilization entries={snapshot.utilization} language={language} />
        <ShiftTimeline
          machines={snapshot.MACHINES}
          stageBreakdowns={snapshot.stageBreakdowns}
          buffers={snapshot.buffers}
          shiftStart={snapshot.shiftStart}
          shiftEnd={snapshot.shiftEnd}
          language={language}
        />
      </div>

      {settingsOpen && (
        <SettingsPanel language={language} onClose={() => setSettingsOpen(false)} onSaved={refresh} />
      )}
    </div>
  );
}

export default App;
