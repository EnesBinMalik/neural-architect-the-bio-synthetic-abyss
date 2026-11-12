/**
 * @license
 * Neural Architect: The Bio-Synthetic Abyss
 * Procedural Bio-Acoustic & Foley Studio Synthesizer (Web Audio API)
 * Author: Enes Öztürk
 *
 * Implements organic ultrasound blood flow hum, deep systolic heart thump,
 * synaptic high-voltage electric crackle, analog Geiger tube discharges,
 * and mechanical brass gear clicks without external audio files.
 */

class BioAcousticEngine {
  private ctx: AudioContext | null = null;
  private isMuted: boolean = false;
  private masterGain: GainNode | null = null;

  // Fluid noise node
  private fluidGain: GainNode | null = null;
  private fluidFilter: BiquadFilterNode | null = null;
  private fluidSource: AudioBufferSourceNode | null = null;

  // Heartbeat scheduling
  private heartbeatTimer: number | null = null;
  private currentBpm: number = 72;

  // Geiger scheduling
  private geigerTimer: number | null = null;
  private radiationLevel: number = 18; // mR/hr

  // Arc discharge
  private lastArcTime: number = 0;

  constructor() {
    // Will be initialized on first user interaction
  }

  public init() {
    if (this.ctx) return;
    try {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      this.ctx = new AudioCtx();

      this.masterGain = this.ctx.createGain();
      this.masterGain.gain.setValueAtTime(0.7, this.ctx.currentTime);
      this.masterGain.connect(this.ctx.destination);

      this.startFluidAtmosphere();
      this.startHeartbeatLoop();
      this.startGeigerLoop();
    } catch (e) {
      console.warn('Web Audio API not supported or blocked:', e);
    }
  }

  public resume() {
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }

  public setMute(muted: boolean) {
    this.isMuted = muted;
    if (this.masterGain && this.ctx) {
      this.masterGain.gain.setTargetAtTime(muted ? 0 : 0.7, this.ctx.currentTime, 0.05);
    }
  }

  public setMasterVolume(vol: number) {
    if (this.masterGain && this.ctx && !this.isMuted) {
      this.masterGain.gain.setTargetAtTime(Math.max(0, Math.min(1, vol)), this.ctx.currentTime, 0.05);
    }
  }

  public updateTelemetry(bpm: number, radiation: number, fluidFlowRate: number) {
    this.currentBpm = Math.max(45, Math.min(200, bpm));
    this.radiationLevel = radiation;

    // Adjust fluid filter frequency with flow velocity
    if (this.fluidFilter && this.ctx) {
      const baseFreq = 140 + (fluidFlowRate / 100) * 360;
      this.fluidFilter.frequency.setTargetAtTime(baseFreq, this.ctx.currentTime, 0.1);
    }
  }

  // 1. Procedural Hemodynamic Bio-Plasma Fluid Atmosphere
  private startFluidAtmosphere() {
    if (!this.ctx || !this.masterGain) return;

    // Generate 4-second looping pink/brownish noise buffer
    const bufferSize = this.ctx.sampleRate * 4;
    const noiseBuffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const output = noiseBuffer.getChannelData(0);

    let b0 = 0, b1 = 0, b2 = 0, b3 = 0, b4 = 0, b5 = 0, b6 = 0;
    for (let i = 0; i < bufferSize; i++) {
      const white = Math.random() * 2 - 1;
      b0 = 0.99886 * b0 + white * 0.0555179;
      b1 = 0.99332 * b1 + white * 0.0750759;
      b2 = 0.96900 * b2 + white * 0.1538520;
      b3 = 0.86650 * b3 + white * 0.3104856;
      b4 = 0.55000 * b4 + white * 0.5329522;
      b5 = -0.7616 * b5 - white * 0.0168980;
      output[i] = (b0 + b1 + b2 + b3 + b4 + b5 + b6 + white * 0.5362) * 0.04;
      b6 = white * 0.115926;
    }

    this.fluidSource = this.ctx.createBufferSource();
    this.fluidSource.buffer = noiseBuffer;
    this.fluidSource.loop = true;

    this.fluidFilter = this.ctx.createBiquadFilter();
    this.fluidFilter.type = 'bandpass';
    this.fluidFilter.frequency.setValueAtTime(220, this.ctx.currentTime);
    this.fluidFilter.Q.setValueAtTime(1.8, this.ctx.currentTime);

    this.fluidGain = this.ctx.createGain();
    this.fluidGain.gain.setValueAtTime(0.25, this.ctx.currentTime);

    this.fluidSource.connect(this.fluidFilter);
    this.fluidFilter.connect(this.fluidGain);
    this.fluidGain.connect(this.masterGain);

    this.fluidSource.start(0);
  }

  // 2. Anatomical Dual-Chamber Heartbeat (Lub-Dub)
  private startHeartbeatLoop() {
    const scheduleNext = () => {
      this.playHeartbeatStroke();
      const intervalMs = (60 / this.currentBpm) * 1000;
      this.heartbeatTimer = window.setTimeout(scheduleNext, intervalMs);
    };
    scheduleNext();
  }

  private playHeartbeatStroke() {
    if (!this.ctx || !this.masterGain || this.isMuted) return;
    const now = this.ctx.currentTime;

    // Stroke 1: Systole "LUB" (Deep low-frequency visceral kick, ~52 Hz dropping to ~35 Hz)
    this.synthesizeHeartThud(now, 58, 38, 0.18, 0.55);

    // Stroke 2: Diastole "DUB" (Slightly snappier closure, ~75 Hz dropping to ~45 Hz at +0.16s offset)
    this.synthesizeHeartThud(now + 0.17, 78, 48, 0.14, 0.42);

    // Pulse fluid rush during systole
    if (this.fluidGain && this.fluidFilter) {
      this.fluidGain.gain.cancelScheduledValues(now);
      this.fluidGain.gain.setValueAtTime(0.2, now);
      this.fluidGain.gain.linearRampToValueAtTime(0.48, now + 0.08);
      this.fluidGain.gain.exponentialRampToValueAtTime(0.2, now + 0.35);

      this.fluidFilter.frequency.cancelScheduledValues(now);
      this.fluidFilter.frequency.setValueAtTime(200, now);
      this.fluidFilter.frequency.linearRampToValueAtTime(420, now + 0.09);
      this.fluidFilter.frequency.exponentialRampToValueAtTime(200, now + 0.38);
    }
  }

  private synthesizeHeartThud(startTime: number, startFreq: number, endFreq: number, duration: number, gainPeak: number) {
    if (!this.ctx || !this.masterGain) return;

    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    const filter = this.ctx.createBiquadFilter();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(startFreq, startTime);
    osc.frequency.exponentialRampToValueAtTime(endFreq, startTime + duration);

    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(140, startTime);

    gain.gain.setValueAtTime(0.0001, startTime);
    gain.gain.linearRampToValueAtTime(gainPeak, startTime + 0.02);
    gain.gain.exponentialRampToValueAtTime(0.0001, startTime + duration);

    osc.connect(filter);
    filter.connect(gain);
    gain.connect(this.masterGain);

    osc.start(startTime);
    osc.stop(startTime + duration + 0.05);
  }

  // 3. Synaptic High-Voltage Electrical Arc Discharge
  public triggerSynapticArc(intensity: number = 1.0) {
    if (!this.ctx || !this.masterGain || this.isMuted) return;
    const now = this.ctx.currentTime;
    if (now - this.lastArcTime < 0.08) return; // limit density
    this.lastArcTime = now;

    const duration = 0.12 * intensity;
    const osc = this.ctx.createOscillator();
    const noiseOsc = this.ctx.createOscillator();
    const bandpass = this.ctx.createBiquadFilter();
    const gain = this.ctx.createGain();

    // High carrier with FM distortion
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(380 + Math.random() * 400, now);
    osc.frequency.linearRampToValueAtTime(80 + Math.random() * 120, now + duration);

    noiseOsc.type = 'square';
    noiseOsc.frequency.setValueAtTime(1200 + Math.random() * 800, now);

    bandpass.type = 'bandpass';
    bandpass.frequency.setValueAtTime(1800, now);
    bandpass.Q.setValueAtTime(4.0, now);

    gain.gain.setValueAtTime(0.001, now);
    gain.gain.linearRampToValueAtTime(0.35 * intensity, now + 0.01);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + duration);

    osc.connect(gain);
    noiseOsc.connect(bandpass);
    bandpass.connect(gain);
    gain.connect(this.masterGain);

    osc.start(now);
    noiseOsc.start(now);
    osc.stop(now + duration + 0.02);
    noiseOsc.stop(now + duration + 0.02);
  }

  // 4. Analog Wrist Geiger Counter Tube Poisson Clicks
  private startGeigerLoop() {
    const scheduleNextClick = () => {
      if (!this.isMuted && this.radiationLevel > 2) {
        this.playGeigerClick();
      }
      // Poisson arrival timing: higher radiation = shorter average wait
      const lambda = Math.max(0.2, this.radiationLevel * 0.15);
      const waitMs = (-Math.log(1 - Math.random()) / lambda) * 800;
      const clampedWait = Math.max(25, Math.min(1800, waitMs));
      this.geigerTimer = window.setTimeout(scheduleNextClick, clampedWait);
    };
    scheduleNextClick();
  }

  public playGeigerClick() {
    if (!this.ctx || !this.masterGain || this.isMuted) return;
    const now = this.ctx.currentTime;

    const buffer = this.ctx.createBuffer(1, Math.floor(this.ctx.sampleRate * 0.003), this.ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < data.length; i++) {
      data[i] = (Math.random() * 2 - 1) * Math.exp(-i / (data.length * 0.2));
    }

    const source = this.ctx.createBufferSource();
    source.buffer = buffer;

    const filter = this.ctx.createBiquadFilter();
    filter.type = 'highpass';
    filter.frequency.setValueAtTime(2400, now);

    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(0.32, now);

    source.connect(filter);
    filter.connect(gain);
    gain.connect(this.masterGain);

    source.start(now);
  }

  // 5. Heavy Biomechanical Brass Valve & Relay Gear Click
  public playMechanicalClick(pitchFactor: number = 1.0) {
    if (!this.ctx || !this.masterGain || this.isMuted) return;
    const now = this.ctx.currentTime;

    // Metallic ping
    const ping = this.ctx.createOscillator();
    const pingGain = this.ctx.createGain();
    ping.type = 'triangle';
    ping.frequency.setValueAtTime(1420 * pitchFactor, now);
    ping.frequency.exponentialRampToValueAtTime(220 * pitchFactor, now + 0.08);

    pingGain.gain.setValueAtTime(0.4, now);
    pingGain.gain.exponentialRampToValueAtTime(0.001, now + 0.09);

    ping.connect(pingGain);
    pingGain.connect(this.masterGain);

    ping.start(now);
    ping.stop(now + 0.1);

    // Mechanical thud
    const thud = this.ctx.createOscillator();
    const thudGain = this.ctx.createGain();
    thud.type = 'sine';
    thud.frequency.setValueAtTime(110 * pitchFactor, now);
    thud.frequency.exponentialRampToValueAtTime(40, now + 0.12);

    thudGain.gain.setValueAtTime(0.5, now);
    thudGain.gain.exponentialRampToValueAtTime(0.001, now + 0.13);

    thud.connect(thudGain);
    thudGain.connect(this.masterGain);

    thud.start(now);
    thud.stop(now + 0.14);
  }

  // 6. Emergency Excitotoxicity / Low Pressure Klaxon Alarm
  public playCriticalAlarm(active: boolean) {
    if (!this.ctx || !this.masterGain || this.isMuted || !active) return;
    const now = this.ctx.currentTime;

    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(880, now);
    osc.frequency.linearRampToValueAtTime(440, now + 0.25);

    gain.gain.setValueAtTime(0.18, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.28);

    osc.connect(gain);
    gain.connect(this.masterGain);

    osc.start(now);
    osc.stop(now + 0.3);
  }

  public dispose() {
    if (this.heartbeatTimer) clearTimeout(this.heartbeatTimer);
    if (this.geigerTimer) clearTimeout(this.geigerTimer);
    if (this.fluidSource) {
      try { this.fluidSource.stop(); } catch { /* ignore */ }
    }
    if (this.ctx) {
      this.ctx.close();
      this.ctx = null;
    }
  }
}

export const bioAudio = new BioAcousticEngine();
