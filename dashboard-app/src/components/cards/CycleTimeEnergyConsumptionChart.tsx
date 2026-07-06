import { ScatterSplineChart } from '../shared/ScatterSplineChart';
import type { HourInterval, MachineProfileMap, MachineColorMap, InfoId } from '../../types';

interface Props {
  hours: HourInterval[];
  machineProfiles: MachineProfileMap;
  machineColors: MachineColorMap;
  hoveredMachine: string | null;
  onHoverMachine: (machine: string | null) => void;
  onExplainClick?: (id: InfoId) => void;
}

export function CycleTimeEnergyConsumptionChart(props: Props) {
  return (
    <ScatterSplineChart
      infoId="cycle-time-energy-consumption"
      title="Cycle Time Energy Consumption"
      flex={4}
      axis={{ title: 'Energy (kW)', maxValue: 50, tickStep: 5 }}
      valueField="energy"
      {...props}
    />
  );
}
