/** Web Audio API only SE/BGM (no external assets). */

export type SeId =
  | "move"
  | "rotate"
  | "drop"
  | "clear"
  | "levelup"
  | "gameover"
  | "ui";

const MUTE_KEY = "vf-audio-muted";

function isE2e(): boolean {
  try {
    return new URLSearchParams(globalThis.location?.search ?? "").get("e2e") === "1";
  } catch {
    return false;
  }
}

export class AudioManager {
  private ctx: AudioContext | null = null;
  private muted = false;
  private bgmGain: GainNode | null = null;
  private bgmTimer: number | null = null;
  private unlocked = false;
  private readonly disabled: boolean;

  constructor(opts?: { disabled?: boolean }) {
    this.disabled = opts?.disabled ?? isE2e();
    if (typeof localStorage !== "undefined") {
      this.muted = localStorage.getItem(MUTE_KEY) === "1";
    }
  }

  get isMuted(): boolean {
    return this.muted;
  }

  setMuted(m: boolean): void {
    this.muted = m;
    try {
      localStorage.setItem(MUTE_KEY, m ? "1" : "0");
    } catch {
      /* ignore */
    }
    if (m) this.stopBgm();
    else if (this.unlocked) this.startBgm();
  }

  async unlock(): Promise<void> {
    if (this.disabled) return;
    const ctx = this.ensureCtx();
    if (!ctx) return;
    if (ctx.state === "suspended") {
      try {
        await ctx.resume();
      } catch {
        /* ignore */
      }
    }
    this.unlocked = true;
  }

  playSe(id: SeId): void {
    if (this.disabled || this.muted || !this.unlocked) return;
    const ctx = this.ensureCtx();
    if (!ctx) return;
    const t0 = ctx.currentTime;
    switch (id) {
      case "move":
        this.beep(ctx, 520, 0.04, 0.08, t0);
        break;
      case "rotate":
        this.beep(ctx, 660, 0.05, 0.1, t0);
        this.beep(ctx, 880, 0.04, 0.08, t0 + 0.05);
        break;
      case "drop":
        this.noiseBurst(ctx, 0.06, 0.12, t0);
        this.beep(ctx, 180, 0.08, 0.15, t0);
        break;
      case "clear":
        this.beep(ctx, 523, 0.08, 0.12, t0);
        this.beep(ctx, 659, 0.08, 0.12, t0 + 0.07);
        this.beep(ctx, 784, 0.1, 0.15, t0 + 0.14);
        break;
      case "levelup":
        this.beep(ctx, 392, 0.08, 0.1, t0);
        this.beep(ctx, 523, 0.08, 0.1, t0 + 0.09);
        this.beep(ctx, 659, 0.08, 0.1, t0 + 0.18);
        this.beep(ctx, 784, 0.12, 0.18, t0 + 0.27);
        break;
      case "gameover":
        this.beep(ctx, 400, 0.15, 0.2, t0);
        this.beep(ctx, 300, 0.2, 0.25, t0 + 0.18);
        this.beep(ctx, 200, 0.3, 0.35, t0 + 0.4);
        break;
      case "ui":
        this.beep(ctx, 700, 0.04, 0.08, t0);
        break;
    }
  }

  startBgm(): void {
    if (this.disabled || this.muted || !this.unlocked) return;
    if (this.bgmTimer != null) return;
    const ctx = this.ensureCtx();
    if (!ctx) return;

    const master = ctx.createGain();
    master.gain.value = 0.04;
    master.connect(ctx.destination);
    this.bgmGain = master;

    const pattern = [0, 4, 7, 12, 7, 4];
    let step = 0;
    const tick = () => {
      if (!this.bgmGain || this.muted) return;
      const base = 220;
      const n = pattern[step % pattern.length]!;
      const freq = base * Math.pow(2, n / 12);
      this.beep(ctx, freq, 0.12, 0.18, ctx.currentTime, this.bgmGain);
      this.beep(ctx, base / 2, 0.2, 0.15, ctx.currentTime, this.bgmGain);
      step++;
    };
    tick();
    this.bgmTimer = globalThis.setInterval(tick, 280) as unknown as number;
  }

  stopBgm(): void {
    if (this.bgmTimer != null) {
      globalThis.clearInterval(this.bgmTimer);
      this.bgmTimer = null;
    }
    this.bgmGain = null;
  }

  private ensureCtx(): AudioContext | null {
    if (this.disabled) return null;
    if (!this.ctx) {
      const AC =
        globalThis.AudioContext ||
        (globalThis as unknown as { webkitAudioContext?: typeof AudioContext })
          .webkitAudioContext;
      if (!AC) return null;
      this.ctx = new AC();
    }
    return this.ctx;
  }

  private beep(
    ctx: AudioContext,
    freq: number,
    duration: number,
    peak: number,
    when: number,
    dest: AudioNode = ctx.destination,
  ): void {
    const osc = ctx.createOscillator();
    const g = ctx.createGain();
    osc.type = "square";
    osc.frequency.value = freq;
    g.gain.setValueAtTime(0.0001, when);
    g.gain.exponentialRampToValueAtTime(peak, when + 0.01);
    g.gain.exponentialRampToValueAtTime(0.0001, when + duration);
    osc.connect(g);
    g.connect(dest);
    osc.start(when);
    osc.stop(when + duration + 0.02);
  }

  private noiseBurst(
    ctx: AudioContext,
    duration: number,
    peak: number,
    when: number,
  ): void {
    const len = Math.floor(ctx.sampleRate * duration);
    const buf = ctx.createBuffer(1, len, ctx.sampleRate);
    const data = buf.getChannelData(0);
    for (let i = 0; i < len; i++) data[i] = Math.random() * 2 - 1;
    const src = ctx.createBufferSource();
    src.buffer = buf;
    const g = ctx.createGain();
    g.gain.setValueAtTime(peak, when);
    g.gain.exponentialRampToValueAtTime(0.0001, when + duration);
    src.connect(g);
    g.connect(ctx.destination);
    src.start(when);
  }
}

export const audio = new AudioManager();
