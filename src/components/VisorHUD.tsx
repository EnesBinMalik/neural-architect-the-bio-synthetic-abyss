/**
 * @license
 * Neural Architect: The Bio-Synthetic Abyss
 * Diegetic Bio-Suit Helmet Visor HUD (Zero-UI Specification)
 * Author: Enes Öztürk
 *
 * Implements:
 * - Capillary glass manometer tubes (Oxygen & ATP Energy)
 * - Analog brass wrist Geiger needle gauge with mechanical jitter
 * - Systolic/Diastolic hemodial barometer & real-time ECG curve
 * - Zero backdrop-filter to prevent software-WebGL GPU stalls
 */

import React, { useEffect, useState } from 'react';
import { BioSuitTelemetry, FluidDynamicsState, BioLayerInfo } from '../types/simulation';
import { bioAudio } from '../audio/BioAcousticEngine';

interface VisorHUDProps {
  telemetry: BioSuitTelemetry;
  fluid: FluidDynamicsState;
  activeLayerInfo: BioLayerInfo;
  isFirstPerson: boolean;
}

export const VisorHUD: React.FC<VisorHUDProps> = ({
  telemetry,
  fluid,
  activeLayerInfo,
  isFirstPerson,
}) => {
  // Needle jitter for analog Geiger tube
  const [needleAngle, setNeedleAngle] = useState(-45);

  useEffect(() => {
    const jitterInterval = setInterval(() => {
      // Base angle mapped from 0-250 mR/hr to -60 deg -> +60 deg
      const base = -60 + (telemetry.analogRadiationMrHr / 250) * 120;
      const jitter = (Math.random() - 0.5) * 6;
      setNeedleAngle(base + jitter);
    }, 70);

    return () => clearInterval(jitterInterval);
  }, [telemetry.analogRadiationMrHr]);

  return (
    <div className="pointer-events-none absolute inset-0 select-none overflow-hidden font-mono">
      {/* 1. Curved Helmet Visor Optical Glass Border (when in First Person) */}
      {isFirstPerson && (
        <div className="absolute inset-0 border-[16px] border-[#0c121e]/90 pointer-events-none shadow-[inset_0_0_80px_rgba(0,0,0,0.85)]">
          {/* Subtle curved visor vignette */}
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_60%,rgba(6,9,14,0.6)_100%)]" />
          {/* Micro HUD Crosshair */}
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-8 h-8 pointer-events-none opacity-40">
            <div className="absolute top-0 left-1/2 w-[1px] h-2 bg-cyan-400 -translate-x-1/2" />
            <div className="absolute bottom-0 left-1/2 w-[1px] h-2 bg-cyan-400 -translate-x-1/2" />
            <div className="absolute left-0 top-1/2 h-[1px] w-2 bg-cyan-400 -translate-y-1/2" />
            <div className="absolute right-0 top-1/2 h-[1px] w-2 bg-cyan-400 -translate-y-1/2" />
          </div>
        </div>
      )}

      {/* 2. Top Diegetic Telemetry Header */}
      <div className="absolute top-4 left-6 flex items-center gap-3">
        <div className="bg-[#0b111c]/90 border border-cyan-900/60 px-3 py-1.5 rounded text-[11px] text-cyan-400 tracking-wider flex items-center gap-2 shadow-lg">
          <span className="w-2 h-2 rounded-full bg-cyan-400 inline-block" />
          <span>LEVIATHAN MAINFRAME // ARCHITECT: ENES ÖZTÜRK</span>
        </div>
        <div className="bg-[#0b111c]/90 border border-slate-800 px-3 py-1.5 rounded text-[11px] text-slate-300 tracking-wider">
          ZONE: <span className="text-amber-400 font-semibold">{activeLayerInfo.name}</span>
        </div>
      </div>

      <div className="absolute top-4 right-6 flex items-center gap-3">
        <div className="bg-[#0b111c]/90 border border-rose-900/50 px-3 py-1.5 rounded text-[11px] text-rose-400 flex items-center gap-2">
          <span>PULSE:</span>
          <span className="text-rose-300 font-bold text-sm tracking-wider">{Math.round(telemetry.heartRateBpm)} BPM</span>
        </div>
        <div className={`px-2.5 py-1.5 rounded text-[10px] tracking-wider font-semibold border ${
          activeLayerInfo.dangerStatus === 'CRITICAL'
            ? 'bg-rose-950/90 text-rose-300 border-rose-600'
            : activeLayerInfo.dangerStatus === 'WARNING'
            ? 'bg-amber-950/90 text-amber-300 border-amber-600'
            : 'bg-emerald-950/90 text-emerald-300 border-emerald-600'
        }`}>
          {activeLayerInfo.dangerStatus}
        </div>
      </div>

      {/* 3. Left Edge: Glass Capillary Manometer Tube (Oxygen & Plasma Reserves) */}
      <div className="absolute left-6 top-1/2 -translate-y-1/2 flex items-center gap-2.5">
        <div className="bg-[#0b111c]/95 border border-cyan-950/80 p-2 rounded flex flex-col items-center shadow-xl">
          <div className="text-[9px] text-cyan-400 uppercase tracking-widest mb-1.5 font-bold">O₂ FLUID</div>
          {/* Glass Column */}
          <div className="relative w-4 h-48 bg-[#030712] border border-cyan-800/80 rounded-full overflow-hidden p-0.5">
            {/* Liquid level */}
            <div
              className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-cyan-600 via-cyan-400 to-emerald-300 transition-all duration-300 rounded-b-full"
              style={{ height: `${telemetry.oxygenCapillaryLevel}%` }}
            />
            {/* Glass meniscus highlight line */}
            <div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(255,255,255,0.25)_0%,transparent_50%,rgba(0,0,0,0.5)_100%)] pointer-events-none" />
            {/* Calibration graduation notches */}
            <div className="absolute inset-0 flex flex-col justify-between py-2 pointer-events-none opacity-40">
              {[...Array(10)].map((_, i) => (
                <div key={i} className="w-1.5 h-[1px] bg-white self-end mr-0.5" />
              ))}
            </div>
          </div>
          <div className="text-[10px] text-cyan-300 mt-1 font-semibold">
            {Math.round(telemetry.oxygenCapillaryLevel)}%
          </div>
        </div>
      </div>

      {/* 4. Right Edge: Glass Capillary Manometer Tube (ATP Power Reservoir) */}
      <div className="absolute right-6 top-1/2 -translate-y-1/2 flex items-center gap-2.5">
        <div className="bg-[#0b111c]/95 border border-amber-950/80 p-2 rounded flex flex-col items-center shadow-xl">
          <div className="text-[9px] text-amber-400 uppercase tracking-widest mb-1.5 font-bold">ATP ENG</div>
          {/* Glass Column */}
          <div className="relative w-4 h-48 bg-[#030712] border border-amber-800/80 rounded-full overflow-hidden p-0.5">
            {/* Liquid level */}
            <div
              className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-amber-700 via-amber-500 to-yellow-300 transition-all duration-300 rounded-b-full"
              style={{ height: `${telemetry.atpEnergyLevel}%` }}
            />
            {/* Glass highlight */}
            <div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(255,255,255,0.25)_0%,transparent_50%,rgba(0,0,0,0.5)_100%)] pointer-events-none" />
            {/* Calibration graduation notches */}
            <div className="absolute inset-0 flex flex-col justify-between py-2 pointer-events-none opacity-40">
              {[...Array(10)].map((_, i) => (
                <div key={i} className="w-1.5 h-[1px] bg-white self-start ml-0.5" />
              ))}
            </div>
          </div>
          <div className="text-[10px] text-amber-300 mt-1 font-semibold">
            {Math.round(telemetry.atpEnergyLevel)}%
          </div>
        </div>
      </div>

      {/* 5. Bottom Left: Diegetic Analog Wrist Geiger-Muller Counter Gauge */}
      <div className="absolute bottom-28 left-6 pointer-events-auto">
        <div className="bg-[#0c121e]/95 border-2 border-[#334155] rounded-md p-2.5 w-44 shadow-2xl relative">
          <div className="flex justify-between items-center mb-1 border-b border-slate-700 pb-1">
            <span className="text-[9px] text-amber-400 font-bold uppercase tracking-wider">GEIGER-MÜLLER</span>
            <span className="text-[9px] text-slate-400">mR/hr</span>
          </div>

          {/* Analog Dial Face */}
          <div className="relative w-full h-20 bg-[#161f30] rounded border border-slate-700 overflow-hidden flex items-end justify-center">
            {/* Curved scale markings */}
            <svg viewBox="0 0 160 85" className="absolute inset-0 w-full h-full">
              <path
                d="M 20 75 A 60 60 0 0 1 140 75"
                fill="none"
                stroke="#64748b"
                strokeWidth="2"
                strokeDasharray="2,3"
              />
              <path
                d="M 105 32 A 60 60 0 0 1 140 75"
                fill="none"
                stroke="#ef4444"
                strokeWidth="3"
              />
              <text x="25" y="80" fill="#94a3b8" fontSize="8">0</text>
              <text x="75" y="24" fill="#94a3b8" fontSize="8">125</text>
              <text x="135" y="80" fill="#ef4444" fontSize="8">250</text>
            </svg>

            {/* Pivot and rotating physical needle */}
            <div
              className="absolute bottom-0 left-1/2 w-0.5 h-16 bg-amber-400 origin-bottom shadow-md transition-transform duration-75"
              style={{
                transform: `translateX(-50%) rotate(${needleAngle}deg)`,
              }}
            >
              <div className="w-1.5 h-1.5 rounded-full bg-amber-300 -translate-x-[2px] -translate-y-1" />
            </div>
            {/* Center brass cap */}
            <div className="w-4 h-4 rounded-full bg-slate-400 border border-slate-900 absolute bottom-0 left-1/2 -translate-x-1/2 translate-y-1/2 z-10" />
          </div>

          <div className="mt-1.5 flex justify-between items-center text-[10px]">
            <span className="text-slate-400">RAD FLUX:</span>
            <span className="text-amber-300 font-bold">{Math.round(telemetry.analogRadiationMrHr)} mR/h</span>
          </div>
        </div>
      </div>

      {/* 6. Bottom Right: Hemodynamic Barometer & Dynamic Systolic Waveform */}
      <div className="absolute bottom-28 right-6 pointer-events-auto">
        <div className="bg-[#0c121e]/95 border-2 border-[#334155] rounded-md p-2.5 w-52 shadow-2xl">
          <div className="flex justify-between items-center mb-1 border-b border-slate-700 pb-1">
            <span className="text-[9px] text-cyan-400 font-bold uppercase tracking-wider">HEMODYNAMICS</span>
            <span className="text-[9px] text-slate-400">NAVIER-STOKES</span>
          </div>

          {/* Pressure Telemetry */}
          <div className="grid grid-cols-2 gap-1.5 mb-1.5 text-[10px]">
            <div className="bg-[#161f30] p-1 rounded border border-slate-800">
              <div className="text-slate-400 text-[8px]">SYS / DIA</div>
              <div className="text-cyan-300 font-bold">{fluid.systolicPressure}/{fluid.diastolicPressure} <span className="text-[8px] font-normal">mmHg</span></div>
            </div>
            <div className="bg-[#161f30] p-1 rounded border border-slate-800">
              <div className="text-slate-400 text-[8px]">FLOW VELOCITY</div>
              <div className="text-emerald-300 font-bold">{Math.round(fluid.flowVelocityMls)} <span className="text-[8px] font-normal">mL/s</span></div>
            </div>
          </div>

          {/* Mini Real-Time Pulse Graph */}
          <div className="h-8 bg-[#090d15] rounded border border-cyan-900/60 flex items-center px-1 overflow-hidden relative">
            <div className="absolute inset-0 bg-[linear-gradient(90deg,transparent_90%,rgba(6,182,212,0.15)_100%)] pointer-events-none" />
            <svg className="w-full h-full" viewBox="0 0 100 24">
              <path
                d="M 0 14 L 20 14 L 25 4 L 32 20 L 36 14 L 60 14 L 65 4 L 72 20 L 76 14 L 100 14"
                fill="none"
                stroke="#06b6d4"
                strokeWidth="1.5"
                strokeLinecap="round"
              />
            </svg>
          </div>
        </div>
      </div>
    </div>
  );
};
