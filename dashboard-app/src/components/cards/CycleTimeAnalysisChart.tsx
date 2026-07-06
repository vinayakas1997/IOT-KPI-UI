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

export function CycleTimeAnalysisChart(props: Props) {
  return (
    <ScatterSplineChart
      infoId="cycle-time-analysis"
      title="Cycle-Time Analysis"
      flex={4}
      axis={{ title: 'Cycle Time (s)', maxValue: 100, tickStep: 10 }}
      valueField="cycle"
      {...props}
    />
  );
}
