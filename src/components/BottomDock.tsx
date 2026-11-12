/**
 * @license
 * Neural Architect: The Bio-Synthetic Abyss
 * Consolidated Ergonomic Bottom Dock (Three.js Directive Compliant)
 * Author: Enes Öztürk
 *
 * Implements:
 * - Single horizontal glassmorphic control dock pinned to bottom center
 * - Collapsible "Cinema / Zen Mode" drawer
 * - Layer navigation, camera view pills, audio foley controls, and workstation drawers
 * - Static clean status indicators (zero pulsating dot animations)
 */

import React, { useState } from 'react';
import { BioLayerId, BioLayerInfo } from '../types/simulation';
import { CameraMode } from '../three/BioScene';
import { bioAudio } from '../audio/BioAcousticEngine';

interface BottomDockProps {
  layers: BioLayerInfo[];
  currentLayer: BioLayerId;
  onSelectLayer: (layerId: BioLayerId) => void;
  cameraMode: CameraMode;
  onSelectCameraMode: (mode: CameraMode) => void;
  onOpenWetware: () => void;
  onOpenCuda: () => void;
  onOpenCrisisMission: () => void;
}

export const BottomDock: React.FC<BottomDockProps> = ({
  layers,
  currentLayer,
  onSelectLayer,
  cameraMode,
  onSelectCameraMode,
  onOpenWetware,
  onOpenCuda,
  onOpenCrisisMission,
}) => {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [volume, setVolume] = useState(0.7);

  const toggleMute = () => {
    const next = !isMuted;
    setIsMuted(next);
    bioAudio.setMute(next);
  };

  const handleVolumeChange = (v: number) => {
    setVolume(v);
    bioAudio.setMasterVolume(v);
  };

  return (
    <div
      className={`fixed bottom-5 left-1/2 -translate-x-1/2 z-40 transition-transform duration-300 font-mono select-none ${
        isCollapsed ? 'translate-y-[calc(100%-28px)]' : 'translate-y-0'
      }`}
      style={{ maxWidth: 'min(980px, 95vw)', width: '100%' }}
    >
      {/* Collapse / Expand Toggle Button */}
      <div className="flex justify-center mb-1">
        <button
          onClick={() => {
            bioAudio.playMechanicalClick(1.0);
            setIsCollapsed(!isCollapsed);
          }}
          className="px-4 py-1 bg-[#0c121e]/95 hover:bg-[#162238] border border-slate-700 hover:border-cyan-500 rounded-t-md text-[11px] text-cyan-300 flex items-center gap-1.5 shadow-md cursor-pointer transition-colors"
        >
          <span>{isCollapsed ? '▴ KONTROLLERİ GÖSTER' : '▾ SİNEMA / ZEN MODU'}</span>
          <span className="text-[9px] text-slate-500">[H]</span>
        </button>
      </div>

      {/* Main Dock Container */}
      <div className="bg-[#0b111c]/95 border-2 border-slate-700/80 rounded-lg p-3 shadow-2xl space-y-2.5">
        {/* ROW 1: 5 Bio-Mechanical Layers */}
        <div className="flex items-center justify-between gap-1 overflow-x-auto pb-1 scrollbar-none">
          <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider pl-1 pr-2 shrink-0">
            KATMAN:
          </span>
          <div className="flex gap-1.5 flex-1">
            {layers.map((layer) => {
              const isActive = currentLayer === layer.id;
              return (
                <button
                  key={layer.id}
                  onClick={() => {
                    bioAudio.playMechanicalClick(1.1);
                    onSelectLayer(layer.id);
                  }}
                  className={`flex-1 min-w-[130px] px-2.5 py-1.5 rounded border text-left cursor-pointer transition-colors ${
                    isActive
                      ? 'bg-[#18263e] border-cyan-500 text-cyan-200'
                      : 'bg-[#101826] border-slate-800 text-slate-400 hover:text-slate-200 hover:border-slate-700'
                  }`}
                >
                  <div className="text-[8px] text-slate-500 tracking-wider">KATMAN {layer.index}</div>
                  <div className="text-[11px] font-bold truncate">{layer.name}</div>
                </button>
              );
            })}
          </div>
        </div>

        {/* ROW 2: Camera View Modes, Audio Foley & Primary Action Modules */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-1 border-t border-slate-800 text-xs">
          {/* Camera View Mode Pills */}
          <div className="flex items-center gap-1.5">
            <span className="text-[10px] text-slate-500 font-bold mr-1">KAMERA:</span>
            <button
              onClick={() => {
                bioAudio.playMechanicalClick(1.2);
                onSelectCameraMode('first_person');
              }}
              className={`px-2.5 py-1 rounded border text-[11px] font-semibold cursor-pointer transition-colors ${
                cameraMode === 'first_person'
                  ? 'bg-cyan-950 border-cyan-500 text-cyan-300'
                  : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-slate-200'
              }`}
            >
              1. ŞAHIS VİZÖR
            </button>
            <button
              onClick={() => {
                bioAudio.playMechanicalClick(1.2);
                onSelectCameraMode('orbital');
              }}
              className={`px-2.5 py-1 rounded border text-[11px] font-semibold cursor-pointer transition-colors ${
                cameraMode === 'orbital'
                  ? 'bg-cyan-950 border-cyan-500 text-cyan-300'
                  : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-slate-200'
              }`}
            >
              360° ORBİTAL
            </button>
            <button
              onClick={() => {
                bioAudio.playMechanicalClick(1.2);
                onSelectCameraMode('macro_micro');
              }}
              className={`px-2.5 py-1 rounded border text-[11px] font-semibold cursor-pointer transition-colors ${
                cameraMode === 'macro_micro'
                  ? 'bg-cyan-950 border-cyan-500 text-cyan-300'
                  : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-slate-200'
              }`}
            >
              MOLEKÜLER MAKRO
            </button>
          </div>

          {/* Audio Foley Controls */}
          <div className="flex items-center gap-2 bg-[#101826] px-2.5 py-1 rounded border border-slate-800">
            <button
              onClick={toggleMute}
              className={`text-[11px] font-bold cursor-pointer ${
                isMuted ? 'text-rose-400' : 'text-emerald-400'
              }`}
            >
              {isMuted ? 'SES: KAPALI' : 'SES: FOLEY AÇIK'}
            </button>
            <input
              type="range"
              min="0"
              max="1"
              step="0.05"
              value={volume}
              onChange={(e) => handleVolumeChange(Number(e.target.value))}
              className="w-16 h-1 accent-emerald-400 cursor-pointer"
            />
          </div>

          {/* Core Interactive Terminal Drawers */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                bioAudio.playMechanicalClick(1.0);
                onOpenWetware();
              }}
              className="px-3.5 py-1.5 bg-cyan-900 hover:bg-cyan-800 border border-cyan-500 rounded text-cyan-100 font-bold text-xs tracking-wider cursor-pointer shadow-md transition-colors"
            >
              WETWARE KONSOLU
            </button>

            <button
              onClick={() => {
                bioAudio.playMechanicalClick(1.0);
                onOpenCrisisMission();
              }}
              className="px-3.5 py-1.5 bg-amber-900 hover:bg-amber-800 border border-amber-500 rounded text-amber-100 font-bold text-xs tracking-wider cursor-pointer shadow-md transition-colors"
            >
              KRİZ SENARYOSU
            </button>

            <button
              onClick={() => {
                bioAudio.playMechanicalClick(1.0);
                onOpenCuda();
              }}
              className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 border border-slate-600 rounded text-slate-300 font-semibold text-xs tracking-wider cursor-pointer transition-colors"
            >
              C++26 & CUDA MİMARİSİ
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
