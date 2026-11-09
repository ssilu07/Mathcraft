// src/engines/MathAudioSynth.ts

export class MathAudioSynth {
  private static instance: MathAudioSynth | null = null;
  private ctx: AudioContext | null = null;
  private isMuted: boolean = false;
  private masterGain: GainNode | null = null;

  // Continuous oscillator for trigonometry/oscillator mode
  private continuousOsc: OscillatorNode | null = null;
  private continuousGain: GainNode | null = null;
  private harmonicOscs: OscillatorNode[] = [];
  private harmonicGains: GainNode[] = [];

  private constructor() {
    // Lazily initialized on first user interaction
  }

  public static getInstance(): MathAudioSynth {
    if (!MathAudioSynth.instance) {
      MathAudioSynth.instance = new MathAudioSynth();
    }
    return MathAudioSynth.instance;
  }

  private initContext() {
    if (!this.ctx) {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      this.ctx = new AudioCtx();
      this.masterGain = this.ctx.createGain();
      this.masterGain.gain.setValueAtTime(this.isMuted ? 0 : 0.35, this.ctx.currentTime);
      this.masterGain.connect(this.ctx.destination);
    }
    if (this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }

  public toggleMute(): boolean {
    this.isMuted = !this.isMuted;
    if (this.masterGain && this.ctx) {
      this.masterGain.gain.setTargetAtTime(this.isMuted ? 0 : 0.35, this.ctx.currentTime, 0.02);
    }
    return this.isMuted;
  }

  public setMuted(muted: boolean): void {
    this.isMuted = muted;
    if (this.masterGain && this.ctx) {
      this.masterGain.gain.setTargetAtTime(this.isMuted ? 0 : 0.35, this.ctx.currentTime, 0.02);
    }
  }

  public getMuted(): boolean {
    return this.isMuted;
  }

  // Tactile 1500Hz mechanical click on snap or select
  public playTactileSnap(frequency: number = 1500) {
    if (this.isMuted) return;
    this.initContext();
    if (!this.ctx || !this.masterGain) return;

    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'triangle';
    osc.frequency.setValueAtTime(frequency, this.ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(300, this.ctx.currentTime + 0.025);

    gain.gain.setValueAtTime(0.2, this.ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.025);

    osc.connect(gain);
    gain.connect(this.masterGain);

    osc.start();
    osc.stop(this.ctx.currentTime + 0.03);
  }

  // Musical note when creating a point (pentatonic scale C4, D4, E4, G4, A4, C5)
  public playPointNote(index: number = 0) {
    if (this.isMuted) return;
    this.initContext();
    if (!this.ctx || !this.masterGain) return;

    const scale = [261.63, 293.66, 329.63, 392.0, 440.0, 523.25, 587.33, 659.25];
    const freq = scale[Math.abs(index) % scale.length];

    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(freq, this.ctx.currentTime);

    gain.gain.setValueAtTime(0.18, this.ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.25);

    osc.connect(gain);
    gain.connect(this.masterGain);

    osc.start();
    osc.stop(this.ctx.currentTime + 0.26);
  }

  // Continuous sound harmonizer for Unit Circle: f = 220 * 2^(theta / pi)
  public startContinuousHarmonizer(theta: number) {
    if (this.isMuted) return;
    this.initContext();
    if (!this.ctx || !this.masterGain) return;

    if (!this.continuousOsc) {
      const baseFreq = 220 * Math.pow(2, theta / Math.PI);

      this.continuousOsc = this.ctx.createOscillator();
      this.continuousGain = this.ctx.createGain();
      this.continuousOsc.type = 'sine';
      this.continuousOsc.frequency.setValueAtTime(baseFreq, this.ctx.currentTime);

      this.continuousGain.gain.setValueAtTime(0.001, this.ctx.currentTime);
      this.continuousGain.gain.exponentialRampToValueAtTime(0.12, this.ctx.currentTime + 0.05);

      this.continuousOsc.connect(this.continuousGain);
      this.continuousGain.connect(this.masterGain);
      this.continuousOsc.start();

      // Overtones (2nd and 3rd harmonics)
      const overtoneRatios = [2, 3];
      const overtoneGains = [0.03, 0.015];
      this.harmonicOscs = [];
      this.harmonicGains = [];

      overtoneRatios.forEach((ratio, i) => {
        if (!this.ctx || !this.masterGain) return;
        const hOsc = this.ctx.createOscillator();
        const hGain = this.ctx.createGain();
        hOsc.type = 'sine';
        hOsc.frequency.setValueAtTime(baseFreq * ratio, this.ctx.currentTime);

        hGain.gain.setValueAtTime(0.001, this.ctx.currentTime);
        hGain.gain.exponentialRampToValueAtTime(overtoneGains[i], this.ctx.currentTime + 0.05);

        hOsc.connect(hGain);
        hGain.connect(this.masterGain);
        hOsc.start();

        this.harmonicOscs.push(hOsc);
        this.harmonicGains.push(hGain);
      });
    } else {
      this.updateContinuousHarmonizer(theta);
    }
  }

  public updateContinuousHarmonizer(theta: number) {
    if (!this.ctx || !this.continuousOsc) return;
    const baseFreq = Math.min(880, Math.max(110, 220 * Math.pow(2, theta / Math.PI)));
    this.continuousOsc.frequency.setTargetAtTime(baseFreq, this.ctx.currentTime, 0.015);

    this.harmonicOscs.forEach((hOsc, i) => {
      if (!this.ctx) return;
      const ratio = i === 0 ? 2 : 3;
      hOsc.frequency.setTargetAtTime(baseFreq * ratio, this.ctx.currentTime, 0.015);
    });
  }

  public stopContinuousHarmonizer() {
    if (!this.ctx) return;
    if (this.continuousGain && this.continuousOsc) {
      try {
        this.continuousGain.gain.setTargetAtTime(0.0001, this.ctx.currentTime, 0.05);
        setTimeout(() => {
          this.continuousOsc?.stop();
          this.continuousOsc?.disconnect();
          this.continuousOsc = null;
          this.continuousGain = null;
        }, 60);
      } catch {
        this.continuousOsc = null;
      }
    }
    this.harmonicOscs.forEach((hOsc, i) => {
      try {
        const hGain = this.harmonicGains[i];
        if (hGain && this.ctx) {
          hGain.gain.setTargetAtTime(0.0001, this.ctx.currentTime, 0.05);
        }
        setTimeout(() => {
          hOsc.stop();
          hOsc.disconnect();
        }, 60);
      } catch {
        // ignore
      }
    });
    this.harmonicOscs = [];
    this.harmonicGains = [];
  }

  // Harmonic chord fanfare for puzzle victory
  public playVictoryChord() {
    if (this.isMuted) return;
    this.initContext();
    if (!this.ctx || !this.masterGain) return;

    // Major 9th chord arpeggio: C4, E4, G4, B4, D5
    const notes = [261.63, 329.63, 392.0, 493.88, 587.33];
    const now = this.ctx.currentTime;

    notes.forEach((freq, idx) => {
      if (!this.ctx || !this.masterGain) return;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'triangle';
      osc.frequency.setValueAtTime(freq, now + idx * 0.08);

      const startTime = now + idx * 0.08;
      gain.gain.setValueAtTime(0.001, startTime);
      gain.gain.exponentialRampToValueAtTime(0.18, startTime + 0.05);
      gain.gain.exponentialRampToValueAtTime(0.001, startTime + 0.8);

      osc.connect(gain);
      gain.connect(this.masterGain);

      osc.start(startTime);
      osc.stop(startTime + 0.85);
    });
  }

  // Liquid bubble / drip sound for liquid integration and liquid Pythagoras
  public playLiquidDrip() {
    if (this.isMuted) return;
    this.initContext();
    if (!this.ctx || !this.masterGain) return;

    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    const startFreq = 400 + Math.random() * 400;
    const endFreq = startFreq + 300 + Math.random() * 200;

    osc.type = 'sine';
    osc.frequency.setValueAtTime(startFreq, this.ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(endFreq, this.ctx.currentTime + 0.08);

    gain.gain.setValueAtTime(0.08, this.ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.08);

    osc.connect(gain);
    gain.connect(this.masterGain);

    osc.start();
    osc.stop(this.ctx.currentTime + 0.09);
  }

  // Laser reflection ping
  public playLaserBounce(pitchMult: number = 1.0) {
    if (this.isMuted) return;
    this.initContext();
    if (!this.ctx || !this.masterGain) return;

    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(1200 * pitchMult, this.ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(300, this.ctx.currentTime + 0.12);

    gain.gain.setValueAtTime(0.15, this.ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.12);

    osc.connect(gain);
    gain.connect(this.masterGain);

    osc.start();
    osc.stop(this.ctx.currentTime + 0.13);
  }

  // Cannon boom
  public playCannonBoom() {
    if (this.isMuted) return;
    this.initContext();
    if (!this.ctx || !this.masterGain) return;

    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(140, this.ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(30, this.ctx.currentTime + 0.35);

    gain.gain.setValueAtTime(0.25, this.ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.35);

    osc.connect(gain);
    gain.connect(this.masterGain);

    osc.start();
    osc.stop(this.ctx.currentTime + 0.36);
  }

  // Star or hoop chime
  public playHoopChime(hoopIndex: number = 1) {
    if (this.isMuted) return;
    this.initContext();
    if (!this.ctx || !this.masterGain) return;

    const freqs = [523.25, 659.25, 783.99, 1046.5];
    const freq = freqs[(hoopIndex - 1) % freqs.length];

    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(freq, this.ctx.currentTime);

    gain.gain.setValueAtTime(0.2, this.ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.4);

    osc.connect(gain);
    gain.connect(this.masterGain);

    osc.start();
    osc.stop(this.ctx.currentTime + 0.42);
  }

  // Rollercoaster swoosh sound
  public playCartSwoosh(speedNormalized: number) {
    if (this.isMuted) return;
    this.initContext();
    if (!this.ctx || !this.masterGain) return;

    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    const freq = 180 + speedNormalized * 240;
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(freq, this.ctx.currentTime);

    gain.gain.setValueAtTime(0.05 + speedNormalized * 0.05, this.ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.08);

    osc.connect(gain);
    gain.connect(this.masterGain);

    osc.start();
    osc.stop(this.ctx.currentTime + 0.09);
  }
}
