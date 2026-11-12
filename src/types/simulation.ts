/**
 * @license
 * Neural Architect: The Bio-Synthetic Abyss
 * System Architecture & Simulation Types
 * Author & Lead Architect: Enes Öztürk
 */

export type BioLayerId = 'capillary' | 'synaptic' | 'atp_reactor' | 'leukocyte' | 'genome_core';

export interface BioLayerInfo {
  id: BioLayerId;
  index: number;
  name: string;
  subname: string;
  description: string;
  keyMetric: string;
  dangerStatus: 'NORMAL' | 'WARNING' | 'CRITICAL' | 'STABILIZED';
  accentColor: string;
}

export interface MembranePotentialState {
  restingPotential: number; // typically -70 mV
  thresholdVoltage: number; // typically -55 mV
  currentVoltage: number; // current mV
  actionPotentialActive: boolean;
  firingFrequencyHz: number;
  excitotoxicityRisk: number; // 0 - 100%
  paralysisRisk: number; // 0 - 100%
  naPermeability: number; // 0 - 100
  kPermeability: number; // 0 - 100
  caInflux: number; // 0 - 100
}

export interface FluidDynamicsState {
  systolicPressure: number; // mmHg (e.g. 120-180)
  diastolicPressure: number; // mmHg (e.g. 70-110)
  currentPressure: number; // instantaneous mmHg
  viscosityCentipoise: number; // cP (plasma ~1.5 cP, high ~4.5 cP)
  flowVelocityMls: number; // mL/s
  hydraulicGateOpen: boolean;
  polymerPatchApplied: boolean;
  vesselTearIntegrity: number; // 0 - 100% (100 is fully intact)
}

export interface AtpTurbineState {
  rpm: number; // 0 to 9000 RPM
  targetRpm: number; // 7200 RPM
  protonMotiveForceDeltaPsi: number; // mV (normal ~180-220 mV, collapsed <100)
  atpOutputRate: number; // fmol/s
  cRingStallStatus: boolean;
  temperatureKelvin: number;
  statorTorqueNm: number;
  emergencyOverdrive: boolean;
}

export interface GenomeSynthesisState {
  targetSequence: string[]; // e.g. ['A', 'U', 'G', 'C', 'U', 'G', 'G', 'G', 'C']
  currentSequence: string[];
  droneAssemblyPercent: number;
  enzymeDeployed: boolean;
}

export interface BioSuitTelemetry {
  oxygenCapillaryLevel: number; // 0 - 100%
  atpEnergyLevel: number; // 0 - 100%
  analogRadiationMrHr: number; // 0 - 250 mR/hr
  heartRateBpm: number; // 50 to 195 BPM
  visorIntegrity: number; // 0 - 100%
  neuralSyncRate: number; // 0 - 100%
}

export interface CudaKernelMetrics {
  activeThreads: number;
  gridDim: string;
  blockDim: string;
  kernelName: string;
  vramAllocatedMb: number;
  framerateFps: number;
  simStepTimeMs: number;
  memoryBandwidthGbS: number;
}
