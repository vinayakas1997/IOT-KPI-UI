export type MachineId = string;

export interface MachineProfile {
  cycleMin: number;
  cycleMax: number;
  energyMin: number;
  energyMax: number;
}

export type MachineColorMap = Record<MachineId, string>;
export type MachineProfileMap = Record<MachineId, MachineProfile>;
