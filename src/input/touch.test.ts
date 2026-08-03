import { assertEquals } from "https://deno.land/std@0.203.0/assert/assert_equals.ts";
import { createTouchPadSource, type TouchRoot } from "./touch.ts";
import type { GameAction } from "./action.ts";

function boardSurface(init: Partial<TouchRoot> = {}): TouchRoot {
  const listeners = new Map<string, Set<(e: Event) => void>>();
  const base: TouchRoot = {
    style: { touchAction: "" },
    setPointerCapture(_id: number) {},
    addEventListener(type: string, fn: EventListenerOrEventListenerObject) {
      const f = typeof fn === "function" ? fn : fn.handleEvent.bind(fn);
      if (!listeners.has(type)) listeners.set(type, new Set());
      listeners.get(type)!.add(f as (e: Event) => void);
    },
    removeEventListener(type: string, fn: EventListenerOrEventListenerObject) {
      const f = typeof fn === "function" ? fn : fn.handleEvent.bind(fn);
      listeners.get(type)?.delete(f as (e: Event) => void);
    },
    dispatchEvent(ev: Event) {
      for (const f of listeners.get(ev.type) ?? []) f(ev);
      return true;
    },
  };
  return { ...base, ...init };
}

function fire(
  root: TouchRoot,
  type: string,
  fields: Record<string, unknown> = {},
) {
  const ev = new Event(type) as Event & Record<string, unknown>;
  Object.assign(ev, fields);
  root.dispatchEvent(ev);
}

function swipe(
  root: TouchRoot,
  x0: number,
  y0: number,
  x1: number,
  y1: number,
  fields: Record<string, unknown> = {},
) {
  fire(root, "pointerdown", {
    clientX: x0,
    clientY: y0,
    pointerType: "touch",
    button: 0,
    pointerId: 1,
    ...fields,
  });
  fire(root, "pointerup", {
    clientX: x1,
    clientY: y1,
    pointerType: "touch",
    button: 0,
    pointerId: 1,
    preventDefault() {},
    ...fields,
  });
}

Deno.test("touch: gesture matrix (tap / axes / thresholds)", () => {
  const root = boardSurface();
  const seen: GameAction[] = [];
  const d = createTouchPadSource({ root }).attach((a) => seen.push(a));

  swipe(root, 50, 50, 52, 51); // tap
  swipe(root, 100, 100, 40, 100); // left
  swipe(root, 100, 100, 160, 100); // right
  swipe(root, 100, 200, 100, 100); // up → hardDrop
  swipe(root, 100, 100, 100, 160); // down → rotateCW
  // only adx small → vertical
  swipe(root, 100, 200, 110, 120);
  // only ady small → horizontal
  swipe(root, 100, 100, 180, 110);
  // adx === ady → else vertical (dy>0 → rotate)
  swipe(root, 100, 100, 150, 150);

  assertEquals(seen, [
    "rotateCW",
    "moveLeft",
    "moveRight",
    "hardDrop",
    "rotateCW",
    "hardDrop",
    "moveRight",
    "rotateCW",
  ]);
  d();
});

Deno.test("touch: mouse primary vs secondary", () => {
  const root = boardSurface();
  const seen: GameAction[] = [];
  const d = createTouchPadSource({ root }).attach((a) => seen.push(a));

  fire(root, "pointerdown", {
    clientX: 0,
    clientY: 0,
    pointerType: "mouse",
    button: 2,
    pointerId: 1,
  });
  fire(root, "pointerup", {
    clientX: 0,
    clientY: 80,
    pointerType: "mouse",
    button: 2,
    pointerId: 1,
    preventDefault() {},
  });
  assertEquals(seen, []);

  fire(root, "pointerdown", {
    clientX: 100,
    clientY: 200,
    pointerType: "mouse",
    button: 0,
    pointerId: 1,
  });
  fire(root, "pointerup", {
    clientX: 100,
    clientY: 100,
    pointerType: "mouse",
    button: 0,
    pointerId: 1,
    preventDefault() {},
  });
  assertEquals(seen, ["hardDrop"]);
  d();
});

Deno.test("touch: pointercancel then up is ignored", () => {
  const root = boardSurface();
  const seen: GameAction[] = [];
  const d = createTouchPadSource({ root }).attach((a) => seen.push(a));
  fire(root, "pointerdown", {
    clientX: 100,
    clientY: 200,
    pointerType: "touch",
    button: 0,
    pointerId: 1,
  });
  fire(root, "pointercancel");
  fire(root, "pointerup", {
    clientX: 100,
    clientY: 50,
    pointerType: "touch",
    button: 0,
    pointerId: 1,
    preventDefault() {},
  });
  assertEquals(seen, []);
  d();
});

Deno.test("touch: setPointerCapture throws", () => {
  const root = boardSurface({
    setPointerCapture() {
      throw new Error("no capture");
    },
  });
  const seen: GameAction[] = [];
  const d = createTouchPadSource({ root }).attach((a) => seen.push(a));
  swipe(root, 100, 200, 100, 100);
  assertEquals(seen, ["hardDrop"]);
  d();
});

Deno.test("touch: no style / no capture / no preventDefault / missing coords", () => {
  const root = boardSurface({
    style: undefined,
    setPointerCapture: undefined,
  });
  const seen: GameAction[] = [];
  const d = createTouchPadSource({ root }).attach((a) => seen.push(a));
  fire(root, "pointerdown", { pointerType: "touch", button: 0, pointerId: 1 });
  fire(root, "pointerup", { pointerType: "touch", button: 0, pointerId: 1 });
  assertEquals(seen, ["rotateCW"]);
  d();
});

Deno.test("touch: root null", () => {
  const seen: GameAction[] = [];
  const d = createTouchPadSource({ root: null }).attach((a) => seen.push(a));
  d();
  assertEquals(seen, []);
});

Deno.test("touch: omit root → defaultRoot (no document) no-op", () => {
  const seen: GameAction[] = [];
  const d = createTouchPadSource().attach((a) => seen.push(a));
  d();
  assertEquals(seen, []);
});

Deno.test("touch: defaultRoot hits getElementById when document exists", () => {
  const root = boardSurface();
  const seen: GameAction[] = [];
  const g = globalThis as {
    document?: { getElementById?: (id: string) => TouchRoot | null };
  };
  const prev = g.document;
  g.document = {
    getElementById(id: string) {
      return id === "game-container" ? root : null;
    },
  };
  try {
    const d = createTouchPadSource().attach((a) => seen.push(a));
    swipe(root, 100, 100, 40, 100);
    assertEquals(seen, ["moveLeft"]);
    d();
  } finally {
    g.document = prev;
  }
});

Deno.test("touch: defaultRoot — document without getElementById", () => {
  const g = globalThis as {
    document?: { getElementById?: (id: string) => TouchRoot | null };
  };
  const prev = g.document;
  g.document = {}; // no getElementById
  try {
    const seen: GameAction[] = [];
    const d = createTouchPadSource().attach((a) => seen.push(a));
    d();
    assertEquals(seen, []);
  } finally {
    g.document = prev;
  }
});

Deno.test("touch: defaultRoot — getElementById returns null", () => {
  const g = globalThis as {
    document?: { getElementById?: (id: string) => TouchRoot | null };
  };
  const prev = g.document;
  g.document = {
    getElementById() {
      return null;
    },
  };
  try {
    const seen: GameAction[] = [];
    const d = createTouchPadSource().attach((a) => seen.push(a));
    d();
    assertEquals(seen, []);
  } finally {
    g.document = prev;
  }
});

Deno.test("touch: pointerId undefined uses 0 for capture", () => {
  let captured: number | undefined;
  const root = boardSurface({
    setPointerCapture(id: number) {
      captured = id;
    },
  });
  const seen: GameAction[] = [];
  const d = createTouchPadSource({ root }).attach((a) => seen.push(a));
  fire(root, "pointerdown", {
    clientX: 100,
    clientY: 200,
    pointerType: "touch",
    button: 0,
    // pointerId omitted → ?? 0
  });
  fire(root, "pointerup", {
    clientX: 100,
    clientY: 100,
    pointerType: "touch",
    button: 0,
    preventDefault() {},
  });
  assertEquals(captured, 0);
  assertEquals(seen, ["hardDrop"]);
  d();
});
