// Synthesized Web Audio API Sound Effects Engine for IFP Classroom TV
// Zero external audio file dependencies — works reliably offline and online.

class SoundEngine {
  private ctx: AudioContext | null = null;
  private muted: boolean = false;

  private getContext(): AudioContext | null {
    try {
      if (this.muted) return null;
      if (typeof window === 'undefined') return null;

      if (!this.ctx) {
        const AudioCtx =
          window.AudioContext ||
          (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
        if (AudioCtx) {
          this.ctx = new AudioCtx();
        }
      }

      if (this.ctx && this.ctx.state === 'suspended') {
        this.ctx.resume().catch(() => {});
      }

      return this.ctx;
    } catch {
      return null;
    }
  }

  public setMuted(muted: boolean) {
    this.muted = muted;
  }

  public isMuted(): boolean {
    return this.muted;
  }

  private playTone(
    freq: number,
    duration: number,
    type: OscillatorType = 'sine',
    volume = 0.16,
    delay = 0,
    pan = 0
  ) {
    try {
      const ctx = this.getContext();
      if (!ctx) return;

      const startTime = ctx.currentTime + delay;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = type;
      osc.frequency.setValueAtTime(freq, startTime);

      gain.gain.setValueAtTime(0.001, startTime);
      gain.gain.exponentialRampToValueAtTime(volume, startTime + 0.015);
      gain.gain.exponentialRampToValueAtTime(0.001, startTime + duration);

      if (typeof ctx.createStereoPanner === 'function') {
        const panner = ctx.createStereoPanner();
        panner.pan.setValueAtTime(Math.max(-1, Math.min(1, pan)), startTime);
        osc.connect(gain);
        gain.connect(panner);
        panner.connect(ctx.destination);
      } else {
        osc.connect(gain);
        gain.connect(ctx.destination);
      }

      osc.start(startTime);
      osc.stop(startTime + duration + 0.02);
    } catch {
      // Never let audio context restrictions break game interactions
    }
  }

  public playTap() {
    this.playTone(520, 0.06, 'triangle', 0.12);
  }

  public playCorrect(side: 'left' | 'right') {
    const pan = side === 'left' ? -0.55 : 0.55;
    // Left side slightly warmer pitch, right side slightly brighter pitch so teams hear their own chime
    const base = side === 'left' ? 523.25 : 587.33; // C5 vs D5
    this.playTone(base, 0.11, 'triangle', 0.18, 0, pan);
    this.playTone(base * 1.25, 0.12, 'triangle', 0.18, 0.07, pan);
    this.playTone(base * 1.5, 0.2, 'sine', 0.2, 0.14, pan);
  }

  public playStreakBonus(side: 'left' | 'right') {
    const pan = side === 'left' ? -0.55 : 0.55;
    this.playTone(659.25, 0.1, 'sine', 0.16, 0, pan);
    this.playTone(783.99, 0.1, 'sine', 0.17, 0.06, pan);
    this.playTone(1046.5, 0.22, 'triangle', 0.2, 0.12, pan);
  }

  public playWrong(side: 'left' | 'right') {
    const pan = side === 'left' ? -0.55 : 0.55;
    this.playTone(210, 0.14, 'sawtooth', 0.1, 0, pan);
    this.playTone(165, 0.2, 'sawtooth', 0.09, 0.09, pan);
  }

  public playRelayPass(side: 'left' | 'right') {
    const pan = side === 'left' ? -0.45 : 0.45;
    this.playTone(440, 0.07, 'sine', 0.08, 0, pan);
    this.playTone(660, 0.09, 'sine', 0.09, 0.05, pan);
  }

  public playCountdownBeep(isFinalGo = false) {
    if (isFinalGo) {
      this.playTone(587.33, 0.12, 'triangle', 0.22, 0);
      this.playTone(880, 0.35, 'triangle', 0.24, 0.1);
    } else {
      this.playTone(440, 0.14, 'sine', 0.18, 0);
    }
  }

  public playLastSecondsTick() {
    this.playTone(760, 0.06, 'square', 0.07, 0);
  }

  public playTimeUp() {
    this.playTone(523.25, 0.18, 'triangle', 0.2, 0);
    this.playTone(440, 0.18, 'triangle', 0.2, 0.16);
    this.playTone(349.23, 0.42, 'triangle', 0.22, 0.32);
  }

  public playVictoryFanfare() {
    const notes = [523.25, 659.25, 783.99, 1046.5, 783.99, 1046.5];
    const delays = [0, 0.1, 0.2, 0.32, 0.48, 0.6];
    const durations = [0.12, 0.12, 0.14, 0.18, 0.12, 0.45];

    notes.forEach((n, idx) => {
      this.playTone(n, durations[idx], 'triangle', 0.2, delays[idx]);
    });
  }
}

export const soundEngine = new SoundEngine();
