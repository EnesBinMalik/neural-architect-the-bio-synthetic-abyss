/**
 * @license
 * Neural Architect: The Bio-Synthetic Abyss
 * Wetware Engineering & Synaptic Programming Terminal
 * Author: Enes Öztürk
 *
 * Implements:
 * - Real-time Membrane Potential Oscilloscope (-90mV to +40mV)
 * - Hodgkin-Huxley Threshold Voltage calibration (-55mV nominal)
 * - Excitotoxicity vs. Paralysis danger meters
 * - Manual Codon Sequencer (A, U, G, C) to program Enzyme Chaperone Drones
 * - Navier-Stokes Hydraulic Valve & Polymer Patch applicator
 */

import React, { useState, useEffect } from 'react';
import {
  MembranePotentialState,
  FluidDynamicsState,
  AtpTurbineState,
  GenomeSynthesisState,
} from '../types/simulation';
import { bioCore } from '../simulation/EnesBioCore';
import { bioAudio } from '../audio/BioAcousticEngine';

interface WetwareConsoleProps {
  membrane: MembranePotentialState;
  fluid: FluidDynamicsState;
  turbine: AtpTurbineState;
  genome: GenomeSynthesisState;
  onClose: () => void;
}

export const WetwareConsole: React.FC<WetwareConsoleProps> = ({
  membrane,
  fluid,
  turbine,
  genome,
  onClose,
}) => {
  const [activeTab, setActiveTab] = useState<'synapse' | 'atp_crisis' | 'genome' | 'fluid'>('atp_crisis');
  const [voltagePoints, setVoltagePoints] = useState<number[]>([]);
  const [codonFeedback, setCodonFeedback] = useState<string | null>(null);

  // Update oscilloscope trace
  useEffect(() => {
    const interval = setInterval(() => {
      setVoltagePoints(bioCore.getVoltageHistory());
    }, 40);
    return () => clearInterval(interval);
  }, []);

  // Handlers
  const handleThresholdChange = (val: number) => {
    bioCore.setThresholdVoltage(val);
    bioAudio.playMechanicalClick(1.2);
  };

  const handlePermeabilityChange = (na: number, k: number) => {
    bioCore.setIonPermeability(na, k);
    bioAudio.playMechanicalClick(0.9);
  };

  const handleTriggerSpike = () => {
    bioCore.triggerActionPotential();
    bioAudio.triggerSynapticArc(1.2);
  };

  const handleBaseClick = (base: 'A' | 'U' | 'G' | 'C') => {
    bioAudio.playMechanicalClick(1.5);
    const success = bioCore.appendCodonBase(base);
    if (!success) {
      setCodonFeedback(`MISMATCH: Base '${base}' rejected by ribosome!`);
      bioAudio.playCriticalAlarm(true);
      setTimeout(() => setCodonFeedback(null), 1400);
    } else {
      setCodonFeedback(`ACCEPTED: Polymer peptide chain extended.`);
      setTimeout(() => setCodonFeedback(null), 900);
    }
  };

  const handleResetCodon = () => {
    bioCore.resetCodonSequence();
    bioAudio.playMechanicalClick(0.7);
  };

  const handleApplyPatch = () => {
    bioCore.applyPolymerPatch();
    bioAudio.playMechanicalClick(0.8);
  };

  const handleToggleGate = () => {
    bioCore.toggleHydraulicGate();
    bioAudio.playMechanicalClick(0.6);
  };

  // Convert voltage history array to SVG polyline coordinates
  const svgWidth = 320;
  const svgHeight = 90;
  const polylineCoords = voltagePoints
    .map((v, i) => {
      const x = (i / Math.max(1, voltagePoints.length - 1)) * svgWidth;
      // Map -90mV to 40mV into height
      const y = svgHeight - ((v - -90) / 130) * svgHeight;
      return `${x},${Math.max(2, Math.min(svgHeight - 2, y))}`;
    })
    .join(' ');

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75">
      <div className="w-full max-w-3xl bg-[#0c121e] border-2 border-cyan-800/80 rounded-lg shadow-[0_0_50px_rgba(8,145,178,0.3)] flex flex-col overflow-hidden text-slate-200 font-mono">
        {/* Terminal Header */}
        <div className="bg-[#111927] border-b border-cyan-900/60 px-5 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-3 h-3 rounded-sm bg-cyan-400 shadow-[0_0_8px_#22d3ee]" />
            <div>
              <h2 className="text-sm font-bold text-cyan-300 tracking-wider">
                WETWARE PROGRAMMING INTERFACE // BIO-OPTIC LINK
              </h2>
              <div className="text-[10px] text-slate-400">
                ENES-BIOCORE ENGINE // AXON INTERLINK: DOCKED (P-CLAMP OK)
              </div>
            </div>
          </div>
          <button
            onClick={() => {
              bioAudio.playMechanicalClick(1.0);
              onClose();
            }}
            className="px-3 py-1 bg-slate-800 hover:bg-rose-900 border border-slate-600 hover:border-rose-500 rounded text-xs text-slate-300 hover:text-white transition-colors cursor-pointer"
          >
            DISCONNECT [ESC]
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="flex bg-[#070b13] border-b border-slate-800 px-4 gap-2 pt-2">
          <button
            onClick={() => { setActiveTab('atp_crisis'); bioAudio.playMechanicalClick(1.1); }}
            className={`px-4 py-2 text-xs font-semibold rounded-t border-t border-x cursor-pointer transition-colors ${
              activeTab === 'atp_crisis'
                ? 'bg-[#0c121e] border-amber-600 text-amber-300'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            CRISIS: ATP TURBINE REBOOT
          </button>
          <button
            onClick={() => { setActiveTab('synapse'); bioAudio.playMechanicalClick(1.1); }}
            className={`px-4 py-2 text-xs font-semibold rounded-t border-t border-x cursor-pointer transition-colors ${
              activeTab === 'synapse'
                ? 'bg-[#0c121e] border-cyan-600 text-cyan-300'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            SYNAPSE & VOLTAGE (-55mV)
          </button>
          <button
            onClick={() => { setActiveTab('genome'); bioAudio.playMechanicalClick(1.1); }}
            className={`px-4 py-2 text-xs font-semibold rounded-t border-t border-x cursor-pointer transition-colors ${
              activeTab === 'genome'
                ? 'bg-[#0c121e] border-emerald-600 text-emerald-300'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            CODON DRONE SEQUENCER
          </button>
          <button
            onClick={() => { setActiveTab('fluid'); bioAudio.playMechanicalClick(1.1); }}
            className={`px-4 py-2 text-xs font-semibold rounded-t border-t border-x cursor-pointer transition-colors ${
              activeTab === 'fluid'
                ? 'bg-[#0c121e] border-sky-600 text-sky-300'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            NAVIER-STOKES HYDRAULICS
          </button>
        </div>

        {/* Console Body */}
        <div className="p-6 space-y-6 overflow-y-auto max-h-[70vh]">
          {/* TAB 1: ATP CRISIS REBOOT */}
          {activeTab === 'atp_crisis' && (
            <div className="space-y-5">
              <div className="bg-amber-950/40 border border-amber-700/60 p-4 rounded text-xs space-y-2">
                <div className="flex items-center justify-between text-amber-400 font-bold text-sm">
                  <span>MITOCHONDRIAL CRISIS: ATP SYNTHASE ROTOR STALLED</span>
                  <span className={`px-2 py-0.5 rounded text-[10px] ${turbine.cRingStallStatus ? 'bg-rose-900 text-rose-200' : 'bg-emerald-900 text-emerald-200'}`}>
                    {turbine.cRingStallStatus ? 'CRITICAL STALL' : 'ONLINE (SYNTHESIZING)'}
                  </span>
                </div>
                <p className="text-slate-300 leading-relaxed">
                  Proton Motive Force (ΔΨm) has collapsed to <span className="text-amber-300 font-bold">{Math.round(turbine.protonMotiveForceDeltaPsi)} mV</span>.
                  The c-ring rotor requires 180+ mV and an active Enzyme Chaperone Drone to clear the proton channels.
                  If the turbine fails to reach 5,000 RPM, the Leviathan Mainframe will enter irreversible systemic paralysis.
                </p>
              </div>

              {/* Turbine Metrics Grid */}
              <div className="grid grid-cols-4 gap-3 text-center">
                <div className="bg-[#141d2e] p-3 rounded border border-slate-700">
                  <div className="text-[10px] text-slate-400 mb-1">ROTOR SPEED</div>
                  <div className="text-xl font-bold text-amber-300">{Math.round(turbine.rpm)}</div>
                  <div className="text-[9px] text-slate-500">RPM (TARGET: 7200)</div>
                </div>
                <div className="bg-[#141d2e] p-3 rounded border border-slate-700">
                  <div className="text-[10px] text-slate-400 mb-1">PROTON MOTIVE FORCE</div>
                  <div className="text-xl font-bold text-cyan-300">{Math.round(turbine.protonMotiveForceDeltaPsi)}</div>
                  <div className="text-[9px] text-slate-500">mV (MIN: 180 mV)</div>
                </div>
                <div className="bg-[#141d2e] p-3 rounded border border-slate-700">
                  <div className="text-[10px] text-slate-400 mb-1">ATP GENERATION</div>
                  <div className="text-xl font-bold text-emerald-300">{turbine.atpOutputRate}</div>
                  <div className="text-[9px] text-slate-500">fmol/s (3 ATP / REV)</div>
                </div>
                <div className="bg-[#141d2e] p-3 rounded border border-slate-700">
                  <div className="text-[10px] text-slate-400 mb-1">CORE TEMPERATURE</div>
                  <div className="text-xl font-bold text-rose-300">{Math.round(turbine.temperatureKelvin)}</div>
                  <div className="text-[9px] text-slate-500">KELVIN</div>
                </div>
              </div>

              {/* Progress Bar towards Stabilization */}
              <div className="space-y-1">
                <div className="flex justify-between text-xs">
                  <span className="text-slate-400">TURBINE REBOOT STATUS</span>
                  <span className="text-amber-400 font-bold">{Math.min(100, Math.round((turbine.rpm / 7200) * 100))}%</span>
                </div>
                <div className="w-full h-3 bg-slate-900 border border-slate-700 rounded-full overflow-hidden p-0.5">
                  <div
                    className="h-full bg-gradient-to-r from-amber-600 via-amber-400 to-emerald-400 rounded-full transition-all duration-300"
                    style={{ width: `${Math.min(100, Math.round((turbine.rpm / 7200) * 100))}%` }}
                  />
                </div>
              </div>

              {/* Quick Actions */}
              <div className="flex items-center gap-4 pt-2">
                <button
                  onClick={() => setActiveTab('genome')}
                  className="flex-1 py-2.5 bg-emerald-900 hover:bg-emerald-800 border border-emerald-600 rounded text-xs font-bold text-emerald-200 cursor-pointer transition-colors shadow-lg"
                >
                  PROGRAM ENZYME DRONE (A-U-G-C) &rarr;
                </button>
                <button
                  onClick={handleTriggerSpike}
                  className="py-2.5 px-4 bg-cyan-950 hover:bg-cyan-900 border border-cyan-600 rounded text-xs font-bold text-cyan-300 cursor-pointer transition-colors"
                >
                  INJECT HIGH-VOLTAGE SPARK
                </button>
              </div>
            </div>
          )}

          {/* TAB 2: SYNAPSE & ACTION POTENTIAL OSCILLOSCOPE */}
          {activeTab === 'synapse' && (
            <div className="space-y-5">
              {/* Oscilloscope Screen */}
              <div className="bg-[#05080e] border-2 border-cyan-900/80 rounded-lg p-3 relative">
                <div className="flex justify-between text-[11px] text-cyan-400 border-b border-cyan-950 pb-1 mb-2 font-mono">
                  <span>HODGKIN-HUXLEY MEMBRANE OSCILLOSCOPE</span>
                  <span className="text-emerald-400 font-bold">{Math.round(membrane.currentVoltage)} mV</span>
                </div>
                <div className="relative w-full h-24 overflow-hidden">
                  {/* Grid lines */}
                  <div className="absolute inset-0 grid grid-rows-4 grid-cols-8 opacity-20 pointer-events-none">
                    {[...Array(32)].map((_, i) => (
                      <div key={i} className="border border-cyan-500/40" />
                    ))}
                  </div>
                  {/* Reference threshold dashed line */}
                  <div
                    className="absolute w-full border-t border-dashed border-amber-400/70"
                    style={{
                      top: `${svgHeight - ((membrane.thresholdVoltage - -90) / 130) * svgHeight}px`,
                    }}
                  >
                    <span className="text-[8px] text-amber-300 absolute right-2 -top-3">
                      THRESHOLD: {membrane.thresholdVoltage} mV
                    </span>
                  </div>
                  {/* Active SVG wave */}
                  <svg className="w-full h-full" viewBox={`0 0 ${svgWidth} ${svgHeight}`} preserveAspectRatio="none">
                    <polyline
                      fill="none"
                      stroke="#22d3ee"
                      strokeWidth="2.5"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      points={polylineCoords}
                    />
                  </svg>
                </div>
              </div>

              {/* Threshold Calibration Slider */}
              <div className="space-y-2 bg-[#141d2e] p-4 rounded border border-slate-700">
                <div className="flex justify-between text-xs">
                  <span className="text-slate-300 font-semibold">FIRING THRESHOLD VOLTAGE (V_th)</span>
                  <span className="text-amber-400 font-bold">{membrane.thresholdVoltage} mV (NOMINAL: -55 mV)</span>
                </div>
                <input
                  type="range"
                  min="-80"
                  max="-40"
                  step="1"
                  value={membrane.thresholdVoltage}
                  onChange={(e) => handleThresholdChange(Number(e.target.value))}
                  className="w-full accent-amber-400 cursor-pointer"
                />
                <div className="flex justify-between text-[10px] text-slate-500">
                  <span>-80 mV (PARALYSIS ZONE)</span>
                  <span>-55 mV (OPTIMAL SYNAPSE)</span>
                  <span>-40 mV (EXCITOTOXIC HAZARD)</span>
                </div>
              </div>

              {/* Excitotoxicity vs Paralysis Meters */}
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-[#141d2e] p-3 rounded border border-rose-900/50">
                  <div className="flex justify-between text-xs mb-1">
                    <span className="text-rose-400 font-semibold">EXCITOTOXICITY OVERLOAD</span>
                    <span className="text-rose-300 font-bold">{Math.round(membrane.excitotoxicityRisk)}%</span>
                  </div>
                  <div className="w-full h-2 bg-slate-900 rounded overflow-hidden">
                    <div
                      className="h-full bg-rose-500 transition-all duration-200"
                      style={{ width: `${membrane.excitotoxicityRisk}%` }}
                    />
                  </div>
                </div>

                <div className="bg-[#141d2e] p-3 rounded border border-indigo-900/50">
                  <div className="flex justify-between text-xs mb-1">
                    <span className="text-indigo-400 font-semibold">SYNAPTIC PARALYSIS RISK</span>
                    <span className="text-indigo-300 font-bold">{Math.round(membrane.paralysisRisk)}%</span>
                  </div>
                  <div className="w-full h-2 bg-slate-900 rounded overflow-hidden">
                    <div
                      className="h-full bg-indigo-500 transition-all duration-200"
                      style={{ width: `${membrane.paralysisRisk}%` }}
                    />
                  </div>
                </div>
              </div>

              {/* Ion Channel Sliders */}
              <div className="grid grid-cols-2 gap-4 text-xs">
                <div className="bg-[#141d2e] p-3 rounded border border-slate-700 space-y-1">
                  <div className="flex justify-between text-slate-300">
                    <span>Na⁺ PERMEABILITY (DEPOLARIZE)</span>
                    <span className="text-cyan-400 font-bold">{membrane.naPermeability}%</span>
                  </div>
                  <input
                    type="range"
                    min="10"
                    max="95"
                    value={membrane.naPermeability}
                    onChange={(e) => handlePermeabilityChange(Number(e.target.value), membrane.kPermeability)}
                    className="w-full accent-cyan-400 cursor-pointer"
                  />
                </div>
                <div className="bg-[#141d2e] p-3 rounded border border-slate-700 space-y-1">
                  <div className="flex justify-between text-slate-300">
                    <span>K⁺ PERMEABILITY (REPOLARIZE)</span>
                    <span className="text-emerald-400 font-bold">{membrane.kPermeability}%</span>
                  </div>
                  <input
                    type="range"
                    min="10"
                    max="95"
                    value={membrane.kPermeability}
                    onChange={(e) => handlePermeabilityChange(membrane.naPermeability, Number(e.target.value))}
                    className="w-full accent-emerald-400 cursor-pointer"
                  />
                </div>
              </div>

              <button
                onClick={handleTriggerSpike}
                className="w-full py-2.5 bg-cyan-700 hover:bg-cyan-600 text-white font-bold rounded cursor-pointer transition-colors text-xs tracking-wider shadow-lg"
              >
                DISCHARGE ACTION POTENTIAL SPIKE (+35 mV)
              </button>
            </div>
          )}

          {/* TAB 3: CODON DRONE SEQUENCER */}
          {activeTab === 'genome' && (
            <div className="space-y-5">
              <div className="bg-[#141d2e] p-4 rounded border border-emerald-800/60 text-xs space-y-2">
                <div className="flex justify-between items-center text-emerald-400 font-bold text-sm">
                  <span>ZERO-AI PROTOCOL: MANUAL RIBOSOMAL SYNTHESIS</span>
                  <span className="text-slate-300">TARGET: CHAPERONE PROTEIN</span>
                </div>
                <p className="text-slate-300 leading-relaxed">
                  Every amino acid must be manually aligned base-by-base by Lead Architect Enes Öztürk.
                  Target RNA Sequence: <span className="text-amber-400 font-bold tracking-widest">{genome.targetSequence.join(' ')}</span>
                  (AUG = Start, CUG = Leucine, GGC = Glycine, UAA = Stop).
                </p>
              </div>

              {/* Sequence Display */}
              <div className="bg-[#05080e] p-4 rounded border border-slate-700">
                <div className="text-[10px] text-slate-400 mb-2">CURRENT RIBOSOMAL STRAND:</div>
                <div className="flex gap-2 flex-wrap min-h-[48px] items-center">
                  {genome.currentSequence.map((base, idx) => (
                    <div
                      key={idx}
                      className={`w-9 h-10 rounded flex items-center justify-center font-bold text-sm border ${
                        base === 'A'
                          ? 'bg-emerald-950 text-emerald-300 border-emerald-600'
                          : base === 'U'
                          ? 'bg-blue-950 text-blue-300 border-blue-600'
                          : base === 'G'
                          ? 'bg-amber-950 text-amber-300 border-amber-600'
                          : 'bg-pink-950 text-pink-300 border-pink-600'
                      }`}
                    >
                      {base}
                    </div>
                  ))}
                  {/* Empty slots remaining */}
                  {[...Array(Math.max(0, genome.targetSequence.length - genome.currentSequence.length))].map((_, i) => (
                    <div
                      key={`empty-${i}`}
                      className="w-9 h-10 rounded border border-dashed border-slate-700 flex items-center justify-center text-slate-600 text-xs"
                    >
                      ?
                    </div>
                  ))}
                </div>
                {codonFeedback && (
                  <div className="mt-2 text-xs text-amber-400 font-semibold animate-pulse">
                    {codonFeedback}
                  </div>
                )}
              </div>

              {/* Base Input Buttons */}
              <div className="grid grid-cols-4 gap-3">
                <button
                  disabled={genome.enzymeDeployed}
                  onClick={() => handleBaseClick('A')}
                  className="py-3 bg-emerald-900/80 hover:bg-emerald-800 disabled:opacity-40 border-2 border-emerald-600 rounded text-base font-bold text-emerald-200 cursor-pointer transition-all shadow-md active:scale-95"
                >
                  [A] ADENINE
                </button>
                <button
                  disabled={genome.enzymeDeployed}
                  onClick={() => handleBaseClick('U')}
                  className="py-3 bg-blue-900/80 hover:bg-blue-800 disabled:opacity-40 border-2 border-blue-600 rounded text-base font-bold text-blue-200 cursor-pointer transition-all shadow-md active:scale-95"
                >
                  [U] URACIL
                </button>
                <button
                  disabled={genome.enzymeDeployed}
                  onClick={() => handleBaseClick('G')}
                  className="py-3 bg-amber-900/80 hover:bg-amber-800 disabled:opacity-40 border-2 border-amber-600 rounded text-base font-bold text-amber-200 cursor-pointer transition-all shadow-md active:scale-95"
                >
                  [G] GUANINE
                </button>
                <button
                  disabled={genome.enzymeDeployed}
                  onClick={() => handleBaseClick('C')}
                  className="py-3 bg-pink-900/80 hover:bg-pink-800 disabled:opacity-40 border-2 border-pink-600 rounded text-base font-bold text-pink-200 cursor-pointer transition-all shadow-md active:scale-95"
                >
                  [C] CYTOSINE
                </button>
              </div>

              {/* Status & Deploy */}
              <div className="flex items-center justify-between pt-2">
                <div className="text-xs text-slate-300">
                  ASSEMBLY COMPLETION: <span className="text-emerald-400 font-bold">{genome.droneAssemblyPercent}%</span>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={handleResetCodon}
                    className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded text-xs cursor-pointer"
                  >
                    RESET STRAND
                  </button>
                  {genome.droneAssemblyPercent === 100 && (
                    <div className="px-3 py-1.5 bg-emerald-700 text-emerald-100 rounded text-xs font-bold animate-pulse">
                      ENZYME DRONE DEPLOYED & REPAIRING!
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* TAB 4: NAVIER-STOKES HYDRAULICS */}
          {activeTab === 'fluid' && (
            <div className="space-y-5">
              <div className="bg-[#141d2e] p-4 rounded border border-sky-800/60 text-xs space-y-2">
                <div className="flex justify-between items-center text-sky-400 font-bold text-sm">
                  <span>3D NAVIER-STOKES FLUID CONTINUUM</span>
                  <span className="text-slate-300">VISCOSITY & PRESSURE GRADIENT</span>
                </div>
                <p className="text-slate-300 leading-relaxed">
                  Real-time bioplasma flow dynamics computed with SPH particle kinematics:
                  <span className="block text-sky-300 font-bold mt-1 text-[11px]">
                    ρ (∂v/∂t + v · ∇v) = -∇P + μ ∇²v + f
                  </span>
                </p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                {/* Viscosity slider */}
                <div className="bg-[#141d2e] p-4 rounded border border-slate-700 space-y-2 text-xs">
                  <div className="flex justify-between text-slate-300">
                    <span>PLASMA VISCOSITY (μ)</span>
                    <span className="text-sky-400 font-bold">{fluid.viscosityCentipoise.toFixed(1)} cP</span>
                  </div>
                  <input
                    type="range"
                    min="1.0"
                    max="5.0"
                    step="0.1"
                    value={fluid.viscosityCentipoise}
                    onChange={(e) => bioCore.setFluidViscosity(Number(e.target.value))}
                    className="w-full accent-sky-400 cursor-pointer"
                  />
                  <div className="text-[10px] text-slate-500">
                    Higher viscosity dampens turbulence but elevates vascular wall stress.
                  </div>
                </div>

                {/* Vessel Integrity & Polymer Patch */}
                <div className="bg-[#141d2e] p-4 rounded border border-slate-700 space-y-3 text-xs">
                  <div className="flex justify-between text-slate-300">
                    <span>VESSEL TEAR INTEGRITY</span>
                    <span className={`font-bold ${fluid.vesselTearIntegrity < 80 ? 'text-rose-400' : 'text-emerald-400'}`}>
                      {Math.round(fluid.vesselTearIntegrity)}%
                    </span>
                  </div>
                  <div className="w-full h-2 bg-slate-900 rounded overflow-hidden">
                    <div
                      className={`h-full transition-all duration-300 ${fluid.vesselTearIntegrity < 80 ? 'bg-rose-500' : 'bg-emerald-500'}`}
                      style={{ width: `${fluid.vesselTearIntegrity}%` }}
                    />
                  </div>
                  <button
                    disabled={fluid.polymerPatchApplied}
                    onClick={handleApplyPatch}
                    className={`w-full py-2 rounded text-xs font-bold cursor-pointer transition-colors ${
                      fluid.polymerPatchApplied
                        ? 'bg-slate-800 text-slate-500 cursor-not-allowed'
                        : 'bg-emerald-800 hover:bg-emerald-700 text-emerald-200'
                    }`}
                  >
                    {fluid.polymerPatchApplied ? 'POLYMERIC SEAL APPLIED' : 'APPLY POLYMER PATCH TO VESSEL'}
                  </button>
                </div>
              </div>

              {/* Hydraulic gate toggle */}
              <div className="flex items-center justify-between bg-[#141d2e] p-4 rounded border border-slate-700">
                <div>
                  <div className="text-xs text-slate-200 font-semibold">HYDRAULIC GATE BYPASS VALVE</div>
                  <div className="text-[10px] text-slate-400">Controls bioplasma diversion into the Mitochondrial chamber</div>
                </div>
                <button
                  onClick={handleToggleGate}
                  className={`px-4 py-2 rounded text-xs font-bold cursor-pointer transition-colors ${
                    fluid.hydraulicGateOpen
                      ? 'bg-emerald-900 border border-emerald-500 text-emerald-200'
                      : 'bg-rose-900 border border-rose-500 text-rose-200'
                  }`}
                >
                  GATE: {fluid.hydraulicGateOpen ? 'OPEN (FLOW ACTIVE)' : 'CLOSED (DIVERTED)'}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
