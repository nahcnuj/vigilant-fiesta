/** Web Audio API only SE/BGM (no external assets). */

import { isE2e } from "./e2e.ts";

export type SeId =
  | "move"
  | "rotate"
  | "drop"
  | "clear"
  | "levelup"
  | "gameover"
  | "ui";

const MUTE_KEY = "vf-audio-muted";

/** Minimal Web Audio surface used by AudioManager (for tests). */
export interface AudioContextLike {
  state: string;
  currentTime: number;
  sampleRate: number;
  destination: AudioNodeLike;
  resume(): Promise<void>;
  createOscillator(): OscillatorLike;
  createGain(): GainLike;
  createBuffer(channels: number, length: number, sampleRate: number): BufferLike;
  createBufferSource(): BufferSourceLike;
}

export interface AudioNodeLike {
  connect(dest: AudioNodeLike): void;
}

export interface GainLike extends AudioNodeLike {
  gain: {
    value: number;
    setValueAtTime(value: number, when: number): void;
    exponentialRampToValueAtTime(value: number, when: number): void;
  };
}

export interface OscillatorLike extends AudioNodeLike {
  type: string;
  frequency: { value: number };
  start(when?: number): void;
  stop(when?: number): void;
}

export interface BufferLike {
  getChannelData(channel: number): Float32Array;
}

export interface BufferSourceLike extends AudioNodeLike {
  buffer: BufferLike | null;
  start(when?: number): void;
}

export interface StorageLike {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
}


function defaultCreateContext(): AudioContextLike | null {
  const g = globalThis as unknown as {
    AudioContext?: new () => AudioContextLike;
    webkitAudioContext?: new () => AudioContextLike;
  };
  const AC = g.AudioContext ?? g.webkitAudioContext;
  if (!AC) return null;
  return new AC();
}

function defaultStorage(): StorageLike | null {
  try {
    const s = (globalThis as unknown as { localStorage?: StorageLike }).localStorage;
    if (!s || typeof s.getItem !== "function") return null;
    return s;
  } catch {
    return null;
  }
}

export type AudioManagerOptions = {
  disabled?: boolean;
  /** Inject for tests. */
  createContext?: () => AudioContextLike | null;
  storage?: StorageLike | null;
};

export class AudioManager {
  private ctx: AudioContextLike | null = null;
  private muted = false;
  private bgmGain: GainLike | null = null;
  private bgmTimer: number | null = null;
  private unlocked = false;
  private readonly disabled: boolean;
  private readonly createContext: () => AudioContextLike | null;
  private readonly storage: StorageLike | null;

  constructor(opts: AudioManagerOptions = {}) {
    this.disabled = opts.disabled ?? isE2e();
    this.createContext = opts.createContext ?? defaultCreateContext;
    this.storage = opts.storage === undefined ? defaultStorage() : opts.storage;
    if (this.storage) {
      try {
        this.muted = this.storage.getItem(MUTE_KEY) === "1";
      } catch {
        this.muted = false;
      }
    }
  }

  get isMuted(): boolean {
    return this.muted;
  }

  setMuted(m: boolean): void {
    this.muted = m;
    if (this.storage) {
      try {
        this.storage.setItem(MUTE_KEY, m ? "1" : "0");
      } catch {
        /* ignore */
      }
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

  private ensureCtx(): AudioContextLike | null {
    if (this.disabled) return null;
    if (!this.ctx) {
      this.ctx = this.createContext();
    }
    return this.ctx;
  }

  private beep(
    ctx: AudioContextLike,
    freq: number,
    duration: number,
    peak: number,
    when: number,
    dest: AudioNodeLike = ctx.destination,
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
    ctx: AudioContextLike,
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
