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

export function CycleTimeEnergyConsumptionChart({ language, ...props }: Props) {
  return (
    <ScatterSplineChart
      infoId="cycle-time-energy-consumption"
      title={t('cycleTimeEnergyConsumption', language)}
      flex={4}
      axis={{ title: t('energyAxis', language), maxValue: 50, tickStep: 5 }}
      valueField="energy"
      cycleLabel={t('cycleWord', language)}
      averageLabel={t('averageWord', language)}
      intervalLabel={t('intervalWord', language)}
      {...props}
    />
  );
}
