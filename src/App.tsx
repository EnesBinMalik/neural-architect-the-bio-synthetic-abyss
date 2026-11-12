/**
 * @license
 * NEURAL ARCHITECT: THE BIO-SYNTHETIC ABYSS
 * Author, Lead Architect & System Designer: Enes Öztürk
 *
 * Game Type: 3D First/Third Person Bio-Mechanical Engineering,
 * Real-Time Molecular Fluid Simulation & Synaptic Network Wetware Coding Adventure
 *
 * Engine: Custom Enes-BioCore Engine Architecture (C++26 & CUDA Parallel Compute)
 */

import React, { useEffect, useRef, useState } from 'react';
import { BioSceneEngine, CameraMode } from './three/BioScene';
import { bioCore } from './simulation/EnesBioCore';
import { bioAudio } from './audio/BioAcousticEngine';
import { BioLayerId, BioLayerInfo } from './types/simulation';
import { VisorHUD } from './components/VisorHUD';
import { WetwareConsole } from './components/WetwareConsole';
import { CudaArchitectureModal } from './components/CudaArchitectureModal';
import { CrisisMissionModal } from './components/CrisisMissionModal';
import { BottomDock } from './components/BottomDock';

const BIO_LAYERS: BioLayerInfo[] = [
  {
    id: 'capillary',
    index: 1,
    name: 'Kılcal Damar Labirentleri',
    subname: 'The Capillary Hydraulics',
    description: 'Yüksek basınçlı biyo-sentetik plazma sıvısının aktığı, esnek ve yarı saydam duvarlara sahip kilometrelerce uzunluktaki tüneller.',
    keyMetric: 'BASINÇ: 145/85 mmHg',
    dangerStatus: 'WARNING',
    accentColor: '#881337',
  },
  {
    id: 'synaptic',
    index: 2,
    name: 'Sinaptik Uçurumlar',
    subname: 'The Synaptic Chasms',
    description: 'İki devasa sinir hücresi arasındaki mikroskobik boşlukların gökdelenler büyüklüğünde tasarlandığı, elektrik arklarının süzüldüğü platform alanı.',
    keyMetric: 'EŞİK: -55 mV',
    dangerStatus: 'NORMAL',
    accentColor: '#0284c7',
  },
  {
    id: 'atp_reactor',
    index: 3,
    name: 'Mitokondriyal Reaktörler',
    subname: 'The ATP Powerplants',
    description: 'Organizmanın tüm enerjisini üreten, devasa dönen türbinlere benzeyen ATP Sentaz motorlarının bulunduğu endüstriyel enerji merkezi.',
    keyMetric: 'TÜRBİN: KRİZ (840 RPM)',
    dangerStatus: 'CRITICAL',
    accentColor: '#d97706',
  },
  {
    id: 'leukocyte',
    index: 4,
    name: 'Bağışıklık Kalesi',
    subname: 'The Leukocyte Bastion',
    description: 'Sisteme sızan virüs kodlarına karşı mekanik antikorların ve fagosit makinelerinin savaştığı kaotik savunma hattı.',
    keyMetric: 'SAVUNMA: DEVREDE',
    dangerStatus: 'NORMAL',
    accentColor: '#10b981',
  },
  {
    id: 'genome_core',
    index: 5,
    name: 'Çekirdek Genom Tapınağı',
    subname: 'The Double-Helix Core',
    description: 'Organizmanın tüm kaynak kodunun (DNA Sarmalı) ışık hızında dönen devasa kristalize kuleler halinde yükseldiği en derin merkez.',
    keyMetric: 'KAYNAK: A-T-G-C',
    dangerStatus: 'NORMAL',
    accentColor: '#ec4899',
  },
];

export default function App() {
  const canvasMountRef = useRef<HTMLDivElement>(null);
  const sceneEngineRef = useRef<BioSceneEngine | null>(null);

  // Application State
  const [hasStarted, setHasStarted] = useState<boolean>(false);
  const [currentLayerId, setCurrentLayerId] = useState<BioLayerId>('atp_reactor');
  const [cameraMode, setCameraMode] = useState<CameraMode>('orbital');

  // Modals & Panels
  const [isWetwareOpen, setIsWetwareOpen] = useState<boolean>(false);
  const [isCudaOpen, setIsCudaOpen] = useState<boolean>(false);
  const [isCrisisOpen, setIsCrisisOpen] = useState<boolean>(false);

  // Live Telemetry Sync state
  const [telemetryTick, setTelemetryTick] = useState<number>(0);

  // 1. Initialize Three.js BioScene once on mount
  useEffect(() => {
    if (!canvasMountRef.current) return;

    const engine = new BioSceneEngine(canvasMountRef.current);
    sceneEngineRef.current = engine;

    // Telemetry polling loop (50ms interval) to keep UI in sync without touching Three.js render loop
    const syncInterval = setInterval(() => {
      setTelemetryTick((t) => (t + 1) % 1000);
      // Audio engine telemetry updates
      bioAudio.updateTelemetry(
        bioCore.suit.heartRateBpm,
        bioCore.suit.analogRadiationMrHr,
        bioCore.fluid.flowVelocityMls
      );
    }, 50);

    return () => {
      clearInterval(syncInterval);
      engine.dispose();
      bioAudio.dispose();
    };
  }, []);

  // 2. Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setIsWetwareOpen(false);
        setIsCudaOpen(false);
        setIsCrisisOpen(false);
      } else if (e.key === 'w' || e.key === 'W') {
        if (!isCudaOpen && !isCrisisOpen) {
          setIsWetwareOpen((prev) => !prev);
          bioAudio.playMechanicalClick(1.0);
        }
      } else if (e.key === 'c' || e.key === 'C') {
        if (!isWetwareOpen && !isCrisisOpen) {
          setIsCudaOpen((prev) => !prev);
          bioAudio.playMechanicalClick(1.0);
        }
      } else if (e.key === '1') {
        selectLayer('capillary');
      } else if (e.key === '2') {
        selectLayer('synaptic');
      } else if (e.key === '3') {
        selectLayer('atp_reactor');
      } else if (e.key === '4') {
        selectLayer('leukocyte');
      } else if (e.key === '5') {
        selectLayer('genome_core');
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isWetwareOpen, isCudaOpen, isCrisisOpen]);

  // Layer & Camera Actions
  const selectLayer = (layerId: BioLayerId) => {
    setCurrentLayerId(layerId);
    if (sceneEngineRef.current) {
      sceneEngineRef.current.setLayer(layerId);
    }
  };

  const selectCameraMode = (mode: CameraMode) => {
    setCameraMode(mode);
    if (sceneEngineRef.current) {
      sceneEngineRef.current.setCameraMode(mode);
    }
  };

  const handleStartExperience = () => {
    bioAudio.init();
    bioAudio.resume();
    bioAudio.playMechanicalClick(1.0);
    setHasStarted(true);
    // Open the crisis scenario immediately to invite Lead Architect Enes Öztürk directly into the action!
    setIsCrisisOpen(true);
  };

  const activeLayer = BIO_LAYERS.find((l) => l.id === currentLayerId) || BIO_LAYERS[2];

  return (
    <div className="relative w-screen h-screen overflow-hidden bg-[#06090e] font-mono select-none">
      {/* 1. Dedicated Isolated 3D Canvas Mount (Zero CSS Backdrop-Filter over WebGL) */}
      <div ref={canvasMountRef} className="absolute inset-0 z-0 cursor-grab active:cursor-grabbing" />

      {/* 2. Diegetic Visor HUD Overlay */}
      <VisorHUD
        telemetry={bioCore.suit}
        fluid={bioCore.fluid}
        activeLayerInfo={activeLayer}
        isFirstPerson={cameraMode === 'first_person'}
      />

      {/* 3. Consolidated Ergonomic Bottom Dock (Three.js Directive Compliant) */}
      <BottomDock
        layers={BIO_LAYERS}
        currentLayer={currentLayerId}
        onSelectLayer={selectLayer}
        cameraMode={cameraMode}
        onSelectCameraMode={selectCameraMode}
        onOpenWetware={() => setIsWetwareOpen(true)}
        onOpenCuda={() => setIsCudaOpen(true)}
        onOpenCrisisMission={() => setIsCrisisOpen(true)}
      />

      {/* 4. Wetware Programming Console Modal */}
      {isWetwareOpen && (
        <WetwareConsole
          membrane={bioCore.membrane}
          fluid={bioCore.fluid}
          turbine={bioCore.turbine}
          genome={bioCore.genome}
          onClose={() => setIsWetwareOpen(false)}
        />
      )}

      {/* 5. C++26 & CUDA Architecture Inspector Modal */}
      {isCudaOpen && (
        <CudaArchitectureModal
          metrics={bioCore.cuda}
          onClose={() => setIsCudaOpen(false)}
        />
      )}

      {/* 6. Operation: ATP Synthase Reboot Crisis Walkthrough Modal */}
      {isCrisisOpen && (
        <CrisisMissionModal
          turbine={bioCore.turbine}
          genome={bioCore.genome}
          fluid={bioCore.fluid}
          onOpenWetware={() => {
            setIsCrisisOpen(false);
            setIsWetwareOpen(true);
          }}
          onClose={() => setIsCrisisOpen(false)}
        />
      )}

      {/* 7. Initial Cinematic Bios-Link Launch Overlay */}
      {!hasStarted && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-6 bg-black/90 font-mono">
          <div className="w-full max-w-xl bg-[#090e17] border-2 border-cyan-500/80 rounded-xl p-8 shadow-[0_0_80px_rgba(6,182,212,0.4)] text-center space-y-6">
            <div className="space-y-2">
              <div className="inline-block px-3 py-1 bg-cyan-950/80 border border-cyan-500 text-cyan-300 text-xs font-bold tracking-widest uppercase rounded">
                ENES-BIOCORE ENGINE // C++26 & CUDA 3D SIMULATOR
              </div>
              <h1 className="text-2xl md:text-3xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-cyan-300 via-amber-300 to-rose-400 tracking-wider">
                NEURAL ARCHITECT: THE BIO-SYNTHETIC ABYSS
              </h1>
              <div className="text-xs text-slate-400 font-semibold tracking-wide">
                YAZAR, BAŞ MİMAR & SİSTEM TASARIMCISI: <span className="text-cyan-300 font-bold">ENES ÖZTÜRK</span>
              </div>
            </div>

            <div className="bg-[#101826] border border-slate-700/80 p-4 rounded-lg text-left text-xs text-slate-300 space-y-2.5 leading-relaxed">
              <div className="flex items-center gap-2 text-amber-400 font-bold">
                <span className="w-2 h-2 rounded-full bg-amber-400" />
                <span>LEVIATHAN MAINFRAME DİREKTİFİ:</span>
              </div>
              <p>
                Gezegen büyüklüğündeki canlı biyo-mekanik organizmanın 3. Katmanında (Mitokondriyal Reaktörler) acil kriz durumu ilan edilmiştir.
                ATP Sentaz türbini durma noktasına gelmiş ve proton kanalları mutasyona uğramıştır.
              </p>
              <p className="text-slate-400 text-[11px]">
                • <strong className="text-slate-200">Sıfır Yapay Zeka:</strong> Tüm aminoasit dizileri (A, U, G, C) ve -55mV aksiyon potansiyelleri el emeğiyle kodlanmalıdır.
                <br />
                • <strong className="text-slate-200">Saf C++26 & CUDA:</strong> Gerçek zamanlı 3D Navier-Stokes akışkan simülasyonu ve diegetik vizör telemetrisi.
              </p>
            </div>

            <button
              onClick={handleStartExperience}
              className="w-full py-4 bg-gradient-to-r from-cyan-500 via-emerald-500 to-amber-500 hover:from-cyan-400 hover:to-amber-400 text-slate-950 font-extrabold text-sm rounded-lg shadow-2xl cursor-pointer transition-all active:scale-[0.98] uppercase tracking-widest"
            >
              BİYO-OPTİK ARAYÜZÜ BAĞLA VE SİSTEME GİR (AUDIO ON) &rarr;
            </button>
            <div className="text-[10px] text-slate-500">
              Gerçekçi biyo-akustik foley ses motoru (kalp atışı, sıvı akışı, ark kıvılcımı) tarayıcı izinleriyle başlatılacaktır.
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
