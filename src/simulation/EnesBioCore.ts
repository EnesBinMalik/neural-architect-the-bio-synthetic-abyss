/**
 * @license
 * Neural Architect: The Bio-Synthetic Abyss
 * Enes-BioCore Simulation Engine (Mathematical & Biophysical Core)
 * Author: Enes Öztürk
 *
 * Implements:
 * 1. Hodgkin-Huxley & FitzHugh-Nagumo Synaptic Wetware Action Potentials
 * 2. Navier-Stokes SPH Fluid Pressure & Viscosity Dynamics
 * 3. Mitchell Chemiosmotic ATP Synthase Rotary Torque Model
 * 4. Ribosomal Codon Translation Engine (A, U, G, C base pairing)
 */

import {
  MembranePotentialState,
  FluidDynamicsState,
  AtpTurbineState,
  GenomeSynthesisState,
  BioSuitTelemetry,
  CudaKernelMetrics,
} from '../types/simulation';

export class EnesBioCoreEngine {
  // 1. Synaptic State
  public membrane: MembranePotentialState = {
    restingPotential: -70,
    thresholdVoltage: -55,
    currentVoltage: -70,
    actionPotentialActive: false,
    firingFrequencyHz: 24,
    excitotoxicityRisk: 12,
    paralysisRisk: 5,
    naPermeability: 50,
    kPermeability: 45,
    caInflux: 30,
  };

  // 2. Navier-Stokes Fluid Mechanics
  public fluid: FluidDynamicsState = {
    systolicPressure: 145,
    diastolicPressure: 85,
    currentPressure: 95,
    viscosityCentipoise: 2.4,
    flowVelocityMls: 68,
    hydraulicGateOpen: true,
    polymerPatchApplied: false,
    vesselTearIntegrity: 62, // damaged, leaking!
  };

  // 3. ATP Synthase Turbine Reactor (Initial Crisis State!)
  public turbine: AtpTurbineState = {
    rpm: 840, // failing! normal is 7200
    targetRpm: 7200,
    protonMotiveForceDeltaPsi: 98, // collapsed! normal is 190+ mV
    atpOutputRate: 42, // failing!
    cRingStallStatus: true,
    temperatureKelvin: 318.4,
    statorTorqueNm: 14.2,
    emergencyOverdrive: false,
  };

  // 4. Genome / Codon Engine
  public genome: GenomeSynthesisState = {
    targetSequence: ['A', 'U', 'G', 'C', 'U', 'G', 'G', 'G', 'C', 'U', 'A', 'A'],
    currentSequence: ['A', 'U', 'G'],
    droneAssemblyPercent: 25,
    enzymeDeployed: false,
  };

  // 5. Bio-Suit Telemetry
  public suit: BioSuitTelemetry = {
    oxygenCapillaryLevel: 88,
    atpEnergyLevel: 28, // LOW because turbine is stalled!
    analogRadiationMrHr: 44, // high radiation in the Abyss
    heartRateBpm: 114, // elevated due to crisis
    visorIntegrity: 94,
    neuralSyncRate: 78,
  };

  // 6. CUDA Parallel Architecture Engine Telemetry
  public cuda: CudaKernelMetrics = {
    activeThreads: 2097152,
    gridDim: '<<<65536, 1, 1>>>',
    blockDim: '<<<256, 1, 1>>>',
    kernelName: 'kernel_navier_stokes_sph_3d_fp32',
    vramAllocatedMb: 6144,
    framerateFps: 144,
    simStepTimeMs: 1.42,
    memoryBandwidthGbS: 936.2,
  };

  // Internal time variables
  private simTime: number = 0;
  private actionPotentialTimer: number = 0;
  private voltageHistory: number[] = Array(60).fill(-70);

  // Calibration triggers
  public update(dt: number) {
    this.simTime += dt;

    // --- 1. Synaptic Potential Dynamics ---
    this.updateSynapticMembrane(dt);

    // --- 2. Navier-Stokes Pressure Wave Dynamics ---
    this.updateFluidDynamics(dt);

    // --- 3. ATP Turbine Physics ---
    this.updateAtpTurbine(dt);

    // --- 4. Bio-Suit Telemetry & Heartbeat Modulation ---
    this.updateSuitTelemetry(dt);

    // Track voltage history for oscilloscope
    this.voltageHistory.push(this.membrane.currentVoltage);
    if (this.voltageHistory.length > 80) {
      this.voltageHistory.shift();
    }
  }

  private updateSynapticMembrane(dt: number) {
    // If action potential is active, advance the spike waveform
    if (this.membrane.actionPotentialActive) {
      this.actionPotentialTimer += dt;
      // Phase 1: Rapid depolarization up to +35 mV
      if (this.actionPotentialTimer < 0.04) {
        const t = this.actionPotentialTimer / 0.04;
        this.membrane.currentVoltage = this.membrane.thresholdVoltage + (35 - this.membrane.thresholdVoltage) * t;
      }
      // Phase 2: Rapid repolarization down to -82 mV
      else if (this.actionPotentialTimer < 0.09) {
        const t = (this.actionPotentialTimer - 0.04) / 0.05;
        this.membrane.currentVoltage = 35 - (35 - -82) * t;
      }
      // Phase 3: Refractory recovery to resting potential (-70 mV)
      else if (this.actionPotentialTimer < 0.16) {
        const t = (this.actionPotentialTimer - 0.09) / 0.07;
        this.membrane.currentVoltage = -82 + (-70 - -82) * t;
      } else {
        this.membrane.actionPotentialActive = false;
        this.membrane.currentVoltage = this.membrane.restingPotential;
      }
    } else {
      // Resting oscillations with sodium/potassium ratio
      const noise = Math.sin(this.simTime * 8) * 1.5;
      const baseResting = -70 + (this.membrane.naPermeability - 50) * 0.25 - (this.membrane.kPermeability - 45) * 0.2;
      this.membrane.currentVoltage = baseResting + noise;

      // Auto-trigger if threshold is reached
      if (this.membrane.currentVoltage >= this.membrane.thresholdVoltage) {
        this.triggerActionPotential();
      }
    }

    // Excitotoxicity: too positive threshold or too high Na+ influx burns synapses
    if (this.membrane.thresholdVoltage > -40 || this.membrane.naPermeability > 80) {
      this.membrane.excitotoxicityRisk = Math.min(100, this.membrane.excitotoxicityRisk + dt * 15);
    } else {
      this.membrane.excitotoxicityRisk = Math.max(0, this.membrane.excitotoxicityRisk - dt * 6);
    }

    // Paralysis risk: threshold too negative or K+ too high prevents all firing
    if (this.membrane.thresholdVoltage < -65 || this.membrane.kPermeability > 80) {
      this.membrane.paralysisRisk = Math.min(100, this.membrane.paralysisRisk + dt * 12);
    } else {
      this.membrane.paralysisRisk = Math.max(0, this.membrane.paralysisRisk - dt * 8);
    }
  }

  public triggerActionPotential() {
    if (!this.membrane.actionPotentialActive) {
      this.membrane.actionPotentialActive = true;
      this.actionPotentialTimer = 0;
    }
  }

  private updateFluidDynamics(dt: number) {
    // Systole/Diastole cardiac pressure oscillation:
    const heartFreq = (this.suit.heartRateBpm / 60) * 2 * Math.PI;
    const wave = Math.max(0, Math.sin(this.simTime * heartFreq));
    const pulseFactor = Math.pow(wave, 2.5); // steep systolic rise

    const pRange = this.fluid.systolicPressure - this.fluid.diastolicPressure;
    this.fluid.currentPressure = this.fluid.diastolicPressure + pRange * pulseFactor;

    // Poiseuille Navier-Stokes velocity:
    const gateFactor = this.fluid.hydraulicGateOpen ? 1.0 : 0.15;
    const patchFactor = this.fluid.polymerPatchApplied ? 1.2 : 0.6;
    const baseVelocity = (this.fluid.currentPressure / (this.fluid.viscosityCentipoise * 1.2)) * gateFactor * patchFactor;
    this.fluid.flowVelocityMls = Math.max(10, Math.min(180, baseVelocity));

    // If vessel tear is patched, integrity heals
    if (this.fluid.polymerPatchApplied && this.fluid.vesselTearIntegrity < 100) {
      this.fluid.vesselTearIntegrity = Math.min(100, this.fluid.vesselTearIntegrity + dt * 12);
    }
  }

  private updateAtpTurbine(dt: number) {
    // If enzyme drone is deployed and repairing proton channel, PMF recovers!
    if (this.genome.enzymeDeployed) {
      this.turbine.protonMotiveForceDeltaPsi = Math.min(210, this.turbine.protonMotiveForceDeltaPsi + dt * 25);
    } else {
      // Without enzyme drone, PMF remains constrained
      if (this.turbine.protonMotiveForceDeltaPsi > 120 && !this.turbine.emergencyOverdrive) {
        this.turbine.protonMotiveForceDeltaPsi -= dt * 2;
      }
    }

    // Stator torque is proportional to PMF
    this.turbine.statorTorqueNm = (this.turbine.protonMotiveForceDeltaPsi / 200) * 48;

    // RPM acceleration based on PMF and cRingStall
    if (this.turbine.protonMotiveForceDeltaPsi > 150) {
      this.turbine.cRingStallStatus = false;
      const targetRpm = (this.turbine.protonMotiveForceDeltaPsi / 200) * this.turbine.targetRpm;
      this.turbine.rpm += (targetRpm - this.turbine.rpm) * dt * 1.5;
    } else {
      // Stalling or failing
      this.turbine.cRingStallStatus = this.turbine.rpm < 1200;
      this.turbine.rpm = Math.max(400, this.turbine.rpm - dt * 250);
    }

    // ATP synthesis is directly 3 ATP per 360-degree rotation of the c-ring gamma shaft
    this.turbine.atpOutputRate = Math.floor((this.turbine.rpm / 60) * 3);

    // Temperature rises if friction/stall occurs
    if (this.turbine.cRingStallStatus) {
      this.turbine.temperatureKelvin = Math.min(365, this.turbine.temperatureKelvin + dt * 1.8);
    } else {
      this.turbine.temperatureKelvin = Math.max(310, this.turbine.temperatureKelvin - dt * 1.2);
    }
  }

  private updateSuitTelemetry(dt: number) {
    // ATP energy charges when turbine is running above 5000 RPM
    if (this.turbine.rpm > 5000) {
      this.suit.atpEnergyLevel = Math.min(100, this.suit.atpEnergyLevel + dt * 6);
      this.suit.oxygenCapillaryLevel = Math.min(100, this.suit.oxygenCapillaryLevel + dt * 3);
    } else {
      this.suit.atpEnergyLevel = Math.max(10, this.suit.atpEnergyLevel - dt * 2.5);
    }

    // Heart rate elevates during crisis (low ATP or high excitotoxicity)
    const targetBpm = 70 + (100 - this.suit.atpEnergyLevel) * 0.9 + this.membrane.excitotoxicityRisk * 0.4;
    this.suit.heartRateBpm += (targetBpm - this.suit.heartRateBpm) * dt * 0.8;

    // Radiation fluctuation
    this.suit.analogRadiationMrHr = 35 + Math.sin(this.simTime * 0.5) * 12 + Math.random() * 4;
  }

  // --- Codon Sequencing Controls ---
  public appendCodonBase(base: 'A' | 'U' | 'G' | 'C'): boolean {
    if (this.genome.enzymeDeployed) return false;
    const nextIdx = this.genome.currentSequence.length;
    if (nextIdx >= this.genome.targetSequence.length) return false;

    // Check if correct base matches the target sequence
    if (base === this.genome.targetSequence[nextIdx]) {
      this.genome.currentSequence.push(base);
      this.genome.droneAssemblyPercent = Math.round(
        (this.genome.currentSequence.length / this.genome.targetSequence.length) * 100
      );
      if (this.genome.currentSequence.length === this.genome.targetSequence.length) {
        this.deployEnzymeDrone();
      }
      return true;
    }
    return false; // mismatch!
  }

  public resetCodonSequence() {
    this.genome.currentSequence = [];
    this.genome.droneAssemblyPercent = 0;
    this.genome.enzymeDeployed = false;
  }

  public deployEnzymeDrone() {
    this.genome.enzymeDeployed = true;
    this.genome.droneAssemblyPercent = 100;
  }

  // Polymer patch application
  public applyPolymerPatch() {
    this.fluid.polymerPatchApplied = true;
  }

  // Threshold Voltage calibration by Enes Öztürk
  public setThresholdVoltage(voltageMv: number) {
    this.membrane.thresholdVoltage = Math.max(-85, Math.min(-35, voltageMv));
  }

  // Ion permeability calibration
  public setIonPermeability(na: number, k: number) {
    this.membrane.naPermeability = Math.max(0, Math.min(100, na));
    this.membrane.kPermeability = Math.max(0, Math.min(100, k));
  }

  // Viscosity control
  public setFluidViscosity(viscosityCp: number) {
    this.fluid.viscosityCentipoise = Math.max(0.8, Math.min(6.0, viscosityCp));
  }

  // Toggle hydraulic gate
  public toggleHydraulicGate() {
    this.fluid.hydraulicGateOpen = !this.fluid.hydraulicGateOpen;
  }

  public getVoltageHistory(): number[] {
    return [...this.voltageHistory];
  }
}

export const bioCore = new EnesBioCoreEngine();
