/**
 * @license
 * Neural Architect: The Bio-Synthetic Abyss
 * Katman 3 Kriz Oynanış Senaryosu: "ATP Sentaz Yeniden Başlatma Protokolü"
 * Author & Lead Architect: Enes Öztürk
 */

import React from 'react';
import { AtpTurbineState, GenomeSynthesisState, FluidDynamicsState } from '../types/simulation';
import { bioAudio } from '../audio/BioAcousticEngine';

interface CrisisMissionModalProps {
  turbine: AtpTurbineState;
  genome: GenomeSynthesisState;
  fluid: FluidDynamicsState;
  onOpenWetware: () => void;
  onClose: () => void;
}

export const CrisisMissionModal: React.FC<CrisisMissionModalProps> = ({
  turbine,
  genome,
  fluid,
  onOpenWetware,
  onClose,
}) => {
  const isDroneReady = genome.enzymeDeployed;
  const isVesselPatched = fluid.polymerPatchApplied;
  const isPmfOptimal = turbine.protonMotiveForceDeltaPsi >= 180;
  const isRpmStable = turbine.rpm >= 5000;

  const isMissionAccomplished = isDroneReady && isVesselPatched && isPmfOptimal && isRpmStable;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 font-mono">
      <div className="w-full max-w-2xl bg-[#0b101a] border-2 border-amber-600/80 rounded-lg shadow-[0_0_60px_rgba(217,119,6,0.35)] flex flex-col overflow-hidden text-slate-200">
        {/* Header */}
        <div className="bg-[#172033] border-b border-amber-700/80 px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className={`w-3.5 h-3.5 rounded ${isMissionAccomplished ? 'bg-emerald-400' : 'bg-amber-400 animate-pulse'}`} />
            <div>
              <h2 className="text-sm font-bold text-amber-300 tracking-wider uppercase">
                OPERASYON: ATP-SENTAZ REAKTÖRÜ KRİZ PROTOKOLÜ
              </h2>
              <div className="text-[10px] text-slate-400">
                BAŞ MİMAR: ENES ÖZTÜRK // LEVIATHAN MAINFRAME KATMAN 3
              </div>
            </div>
          </div>
          <button
            onClick={() => {
              bioAudio.playMechanicalClick(1.0);
              onClose();
            }}
            className="px-3 py-1 bg-slate-800 hover:bg-slate-700 border border-slate-600 rounded text-xs text-slate-300 cursor-pointer transition-colors"
          >
            KAPAT [ESC]
          </button>
        </div>

        {/* Mission Briefing */}
        <div className="p-6 space-y-5 overflow-y-auto max-h-[70vh] text-xs">
          {/* Situation Report */}
          <div className="bg-[#121b2b] p-4 rounded border border-amber-900/60 leading-relaxed space-y-2">
            <div className="text-amber-400 font-bold text-sm">DURUM RAPORU // SİSTEMİK KRİZ:</div>
            <p className="text-slate-300">
              Mitokondriyal enerji santralindeki devasa F0/F1 ATP Sentaz türbini durma noktasına gelmiştir.
              Proton Motive Force (ΔΨm) çökmüş ve rotor kanalları mutasyonlu biyopolimerlerle tıkanmıştır.
              Türbin hızla 5,000 RPM altına düşmekte; tüm organizmanın ana organları dakikalar içinde enerji felcine uğrama tehlikesiyle karşı karşıyadır!
            </p>
          </div>

          {/* 4 Interactive Mission Objectives */}
          <div className="space-y-3">
            <div className="text-slate-400 font-bold tracking-wider text-[11px] uppercase">
              GÖREV PROTOKOLLERİ (EL EMEĞİYLE MÜHENDİSLİK):
            </div>

            {/* Objective 1: Codon Synthesis */}
            <div className={`p-3.5 rounded border flex items-start gap-3 transition-colors ${
              isDroneReady ? 'bg-emerald-950/40 border-emerald-600' : 'bg-[#121b2b] border-slate-700'
            }`}>
              <div className={`w-5 h-5 rounded-full flex items-center justify-center font-bold text-[10px] shrink-0 mt-0.5 ${
                isDroneReady ? 'bg-emerald-600 text-white' : 'bg-slate-700 text-slate-300'
              }`}>
                {isDroneReady ? '✓' : '1'}
              </div>
              <div className="flex-1 space-y-1">
                <div className="flex justify-between items-center">
                  <span className="font-bold text-slate-200">Enzim Chaperone Dronunu Sentezle (Sıfır Yapay Zeka)</span>
                  <span className={`font-semibold ${isDroneReady ? 'text-emerald-400' : 'text-amber-400'}`}>
                    {isDroneReady ? 'TAMAMLANDI' : `${genome.droneAssemblyPercent}%`}
                  </span>
                </div>
                <p className="text-slate-400 text-[11px] leading-relaxed">
                  Wetware konsolundaki ribozom arayüzünden A, U, G, C bazlarını el emeğiyle dizerek tıkanan kanalı açacak onarım enzimini kodlayın.
                </p>
              </div>
            </div>

            {/* Objective 2: Fluid Patch */}
            <div className={`p-3.5 rounded border flex items-start gap-3 transition-colors ${
              isVesselPatched ? 'bg-emerald-950/40 border-emerald-600' : 'bg-[#121b2b] border-slate-700'
            }`}>
              <div className={`w-5 h-5 rounded-full flex items-center justify-center font-bold text-[10px] shrink-0 mt-0.5 ${
                isVesselPatched ? 'bg-emerald-600 text-white' : 'bg-slate-700 text-slate-300'
              }`}>
                {isVesselPatched ? '✓' : '2'}
              </div>
              <div className="flex-1 space-y-1">
                <div className="flex justify-between items-center">
                  <span className="font-bold text-slate-200">Damar Yırtığını Mühürle & Akışkan Basıncını Dengele</span>
                  <span className={`font-semibold ${isVesselPatched ? 'text-emerald-400' : 'text-amber-400'}`}>
                    {isVesselPatched ? 'TAMAMLANDI' : 'BEKLENİYOR'}
                  </span>
                </div>
                <p className="text-slate-400 text-[11px] leading-relaxed">
                  Navier-Stokes hidrolik sekmesinde polimer yamayı uygulayarak biyo-plazma basıncını dengeleyin ve türbin soğutma akışını garantiye alın.
                </p>
              </div>
            </div>

            {/* Objective 3: Proton Motive Force */}
            <div className={`p-3.5 rounded border flex items-start gap-3 transition-colors ${
              isPmfOptimal ? 'bg-emerald-950/40 border-emerald-600' : 'bg-[#121b2b] border-slate-700'
            }`}>
              <div className={`w-5 h-5 rounded-full flex items-center justify-center font-bold text-[10px] shrink-0 mt-0.5 ${
                isPmfOptimal ? 'bg-emerald-600 text-white' : 'bg-slate-700 text-slate-300'
              }`}>
                {isPmfOptimal ? '✓' : '3'}
              </div>
              <div className="flex-1 space-y-1">
                <div className="flex justify-between items-center">
                  <span className="font-bold text-slate-200">Proton Potansiyeli (ΔΨm) ≥ 180 mV'a Ulaşmalı</span>
                  <span className={`font-semibold ${isPmfOptimal ? 'text-emerald-400' : 'text-amber-400'}`}>
                    {Math.round(turbine.protonMotiveForceDeltaPsi)} mV
                  </span>
                </div>
                <p className="text-slate-400 text-[11px] leading-relaxed">
                  Enzim dronu konuşlandırıldıktan sonra proton gradiyenti kendiliğinden toparlanarak rotor şaftına tork uygulayacaktır.
                </p>
              </div>
            </div>

            {/* Objective 4: Stable RPM */}
            <div className={`p-3.5 rounded border flex items-start gap-3 transition-colors ${
              isRpmStable ? 'bg-emerald-950/40 border-emerald-600' : 'bg-[#121b2b] border-slate-700'
            }`}>
              <div className={`w-5 h-5 rounded-full flex items-center justify-center font-bold text-[10px] shrink-0 mt-0.5 ${
                isRpmStable ? 'bg-emerald-600 text-white' : 'bg-slate-700 text-slate-300'
              }`}>
                {isRpmStable ? '✓' : '4'}
              </div>
              <div className="flex-1 space-y-1">
                <div className="flex justify-between items-center">
                  <span className="font-bold text-slate-200">ATP Üretimi: Türbin ≥ 5,000 RPM (Hedef: 7,200 RPM)</span>
                  <span className={`font-semibold ${isRpmStable ? 'text-emerald-400' : 'text-amber-400'}`}>
                    {Math.round(turbine.rpm)} RPM
                  </span>
                </div>
                <p className="text-slate-400 text-[11px] leading-relaxed">
                  Türbin nominal devrine ulaştığında, 3 ATP / devir sentezlenerek organizmanın ATP rezervleri %100'e dolacaktır.
                </p>
              </div>
            </div>
          </div>

          {/* Victory Banner or Action CTA */}
          {isMissionAccomplished ? (
            <div className="bg-emerald-900/60 border border-emerald-500 p-4 rounded text-center space-y-1 shadow-lg">
              <div className="text-emerald-300 font-bold text-sm tracking-wider uppercase">
                ★ KRİZ AŞILDI: LEVIATHAN MAINFRAME TAM GÜÇTE! ★
              </div>
              <p className="text-emerald-200 text-[11px]">
                Enes Öztürk'ün biyo-mühendislik dehasıyla ATP Sentaz reaktörü stabilize edildi. Biyo-akışkan basıncı ve sinaptik ağlar kusursuz senkronda çalışıyor.
              </p>
            </div>
          ) : (
            <div className="pt-2">
              <button
                onClick={() => {
                  onClose();
                  onOpenWetware();
                }}
                className="w-full py-3 bg-gradient-to-r from-amber-600 via-amber-500 to-emerald-600 hover:from-amber-500 hover:to-emerald-500 text-slate-950 font-bold rounded cursor-pointer transition-all shadow-xl text-xs uppercase tracking-wider"
              >
                WETWARE KONSOLUNU AÇ VE REAKTÖRÜ KURTAR &rarr;
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
