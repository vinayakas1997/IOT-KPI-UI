import { ScatterSplineChart } from '../shared/ScatterSplineChart';
import type { HourInterval, MachineProfileMap, MachineColorMap, InfoId, Language } from '../../types';
import { t } from '../../i18n/strings';

interface Props {
  hours: HourInterval[];
  machineProfiles: MachineProfileMap;
  machineColors: MachineColorMap;
  hoveredMachine: string | null;
  onHoverMachine: (machine: string | null) => void;
  language: Language;
  onExplainClick?: (id: InfoId) => void;
}

export function CycleTimeAnalysisChart({ language, ...props }: Props) {
  return (
    <ScatterSplineChart
      infoId="cycle-time-analysis"
      title={t('cycleTimeAnalysis', language)}
      flex={4}
      axis={{ title: t('cycleTimeAxis', language), maxValue: 100, tickStep: 10 }}
      valueField="cycle"
      cycleLabel={t('cycleWord', language)}
      averageLabel={t('averageWord', language)}
      intervalLabel={t('intervalWord', language)}
      {...props}
    />
  );
}
