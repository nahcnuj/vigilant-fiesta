import {
  assertEquals,
  assert,
} from "https://deno.land/std@0.203.0/testing/asserts.ts";
import {
  AudioManager,
  audio,
  type AudioContextLike,
  type SeId,
  type StorageLike,
} from "./audio.ts";

type AnyFn = (...args: never[]) => unknown;

function makeCtx(state: "running" | "suspended" = "running") {
  const calls = {
    resume: 0,
    createOscillator: 0,
    createGain: 0,
    createBuffer: 0,
    createBufferSource: 0,
  };

  const gain = () => ({
    gain: {
      value: 0,
      setValueAtTime: () => {},
      exponentialRampToValueAtTime: () => {},
    },
    connect: () => {},
  });

  const osc = () => ({
    type: "sine",
    frequency: { value: 0 },
    connect: () => {},
    start: () => {},
    stop: () => {},
  });

  const bufferSource = () => ({
    buffer: null as unknown as null,
    connect: () => {},
    start: () => {},
  });

  const ctx: AudioContextLike = {
    state,
    currentTime: 0,
    sampleRate: 48000,
    destination: { connect: () => {} },
    resume: async () => {
      calls.resume++;
      ctx.state = "running";
    },
    createOscillator: () => {
      calls.createOscillator++;
      return osc();
    },
    createGain: () => {
      calls.createGain++;
      return gain();
    },
    createBuffer: (_c, length, _r) => {
      calls.createBuffer++;
      return { getChannelData: () => new Float32Array(length) };
    },
    createBufferSource: () => {
      calls.createBufferSource++;
      return bufferSource();
    },
  };

  return { ctx, calls };
}

function memStorage(init: Record<string, string> = {}): StorageLike & {
  data: Record<string, string>;
} {
  const data = { ...init };
  return {
    data,
    getItem: (k) => (k in data ? data[k]! : null),
    setItem: (k, v) => {
      data[k] = v;
    },
  };
}

Deno.test("disabled: no throw", async () => {
  const a = new AudioManager({ disabled: true, storage: memStorage() });
  await a.unlock();
  a.playSe("move");
  a.startBgm();
  a.stopBgm();
  assertEquals(a.isMuted, false);
});

Deno.test("setMuted persists to storage", () => {
  const s = memStorage();
  const a = new AudioManager({ disabled: true, storage: s });
  a.setMuted(true);
  assertEquals(a.isMuted, true);
  assertEquals(s.data["vf-audio-muted"], "1");
  a.setMuted(false);
  assertEquals(s.data["vf-audio-muted"], "0");
});

Deno.test("constructor reads muted from storage", () => {
  const a = new AudioManager({
    disabled: true,
    storage: memStorage({ "vf-audio-muted": "1" }),
  });
  assertEquals(a.isMuted, true);
});

Deno.test("storage null is fine", () => {
  const a = new AudioManager({ disabled: true, storage: null });
  assertEquals(a.isMuted, false);
  a.setMuted(true);
  assertEquals(a.isMuted, true);
});

Deno.test("storage getItem/setItem throw are ignored", () => {
  const a = new AudioManager({
    disabled: true,
    storage: {
      getItem: () => {
        throw new Error("g");
      },
      setItem: () => {
        throw new Error("s");
      },
    },
  });
  assertEquals(a.isMuted, false);
  a.setMuted(true);
  assertEquals(a.isMuted, true);
});

Deno.test("full SE + BGM paths", async () => {
  const { ctx, calls } = makeCtx("suspended");
  let intervals = 0;
  const realSet = globalThis.setInterval;
  const realClear = globalThis.clearInterval;
  (globalThis as unknown as { setInterval: AnyFn }).setInterval = (
    fn: () => void,
  ) => {
    intervals++;
    fn();
    return intervals;
  };
  (globalThis as unknown as { clearInterval: AnyFn }).clearInterval = () => {};

  try {
    const a = new AudioManager({
      disabled: false,
      storage: memStorage(),
      createContext: () => ctx,
    });
    await a.unlock();
    assertEquals(calls.resume >= 1, true);

    const ids: SeId[] = [
      "move",
      "rotate",
      "drop",
      "clear",
      "levelup",
      "gameover",
      "ui",
    ];
    for (const id of ids) a.playSe(id);
    assert(calls.createOscillator > 0);
    assert(calls.createBufferSource > 0);

    a.startBgm();
    a.startBgm(); // already running
    assert(intervals >= 1);
    a.stopBgm();
    a.stopBgm();

    a.setMuted(true);
    a.playSe("move");
    a.startBgm();
    a.setMuted(false); // restart BGM
    a.stopBgm();
  } finally {
    globalThis.setInterval = realSet;
    globalThis.clearInterval = realClear;
  }
});

Deno.test("unlock resume rejection ignored", async () => {
  const { ctx } = makeCtx("suspended");
  ctx.resume = async () => {
    throw new Error("denied");
  };
  const a = new AudioManager({
    disabled: false,
    storage: memStorage(),
    createContext: () => ctx,
  });
  await a.unlock();
  a.playSe("ui");
  assert(true);
});

Deno.test("unlock running skips resume", async () => {
  const { ctx, calls } = makeCtx("running");
  const a = new AudioManager({
    disabled: false,
    storage: memStorage(),
    createContext: () => ctx,
  });
  await a.unlock();
  assertEquals(calls.resume, 0);
});

Deno.test("createContext null", async () => {
  const a = new AudioManager({
    disabled: false,
    storage: memStorage(),
    createContext: () => null,
  });
  await a.unlock();
  a.playSe("move");
  a.startBgm();
});

Deno.test("not unlocked: playSe/startBgm no-op", () => {
  const { ctx, calls } = makeCtx("running");
  const a = new AudioManager({
    disabled: false,
    storage: memStorage(),
    createContext: () => ctx,
  });
  a.playSe("move");
  a.startBgm();
  assertEquals(calls.createOscillator, 0);
});

Deno.test("BGM tick muted branch", async () => {
  const { ctx } = makeCtx("running");
  let captured: (() => void) | undefined;
  const realSet = globalThis.setInterval;
  const realClear = globalThis.clearInterval;
  (globalThis as unknown as { setInterval: AnyFn }).setInterval = (
    fn: () => void,
  ) => {
    captured = fn;
    return 1;
  };
  (globalThis as unknown as { clearInterval: AnyFn }).clearInterval = () => {};
  try {
    const a = new AudioManager({
      disabled: false,
      storage: memStorage(),
      createContext: () => ctx,
    });
    await a.unlock();
    a.startBgm();
    assert(captured);
    a.setMuted(true);
    captured!();
  } finally {
    globalThis.setInterval = realSet;
    globalThis.clearInterval = realClear;
  }
});

Deno.test("BGM tick after stop (no gain)", async () => {
  const { ctx } = makeCtx("running");
  let captured: (() => void) | undefined;
  const realSet = globalThis.setInterval;
  const realClear = globalThis.clearInterval;
  (globalThis as unknown as { setInterval: AnyFn }).setInterval = (
    fn: () => void,
  ) => {
    captured = fn;
    return 1;
  };
  (globalThis as unknown as { clearInterval: AnyFn }).clearInterval = () => {};
  try {
    const a = new AudioManager({
      disabled: false,
      storage: memStorage(),
      createContext: () => ctx,
    });
    await a.unlock();
    a.startBgm();
    assert(captured);
    a.stopBgm();
    captured!();
  } finally {
    globalThis.setInterval = realSet;
    globalThis.clearInterval = realClear;
  }
});

Deno.test("isE2e disables via location", async () => {
  const g = globalThis as unknown as { location?: unknown };
  const prev = g.location;
  Object.defineProperty(globalThis, "location", {
    value: { search: "?e2e=1" },
    configurable: true,
    writable: true,
  });
  try {
    const { ctx, calls } = makeCtx("running");
    const a = new AudioManager({ createContext: () => ctx });
    await a.unlock();
    a.playSe("ui");
    assertEquals(calls.createOscillator, 0);
  } finally {
    Object.defineProperty(globalThis, "location", {
      value: prev,
      configurable: true,
      writable: true,
    });
  }
});

Deno.test("singleton export", () => {
  assertEquals(typeof audio.isMuted, "boolean");
});
