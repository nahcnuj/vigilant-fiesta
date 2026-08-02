import { assertEquals } from "https://deno.land/std@0.203.0/testing/asserts.ts";
import { createKeyboardSource, DEFAULT_KEY_MAP } from "./keyboard.ts";
import type { GameAction } from "./action.ts";

class FakeTarget extends EventTarget {}

class FakeKeyDown extends Event {
  constructor(readonly key: string) {
    super("keydown", { cancelable: true });
  }
}

Deno.test("DEFAULT_KEY_MAP は要件どおりの矢印キー対応", () => {
  assertEquals(DEFAULT_KEY_MAP["ArrowLeft"], "moveLeft");
  assertEquals(DEFAULT_KEY_MAP["ArrowRight"], "moveRight");
  assertEquals(DEFAULT_KEY_MAP["ArrowDown"], "rotateCW");
  assertEquals(DEFAULT_KEY_MAP["ArrowUp"], "hardDrop");
});

Deno.test("keyboard source は keydown を GameAction に変換する", () => {
  const target = new FakeTarget();
  const source = createKeyboardSource({ target });
  const seen: GameAction[] = [];
  const detach = source.attach((a) => seen.push(a));

  target.dispatchEvent(new FakeKeyDown("ArrowLeft"));
  target.dispatchEvent(new FakeKeyDown("ArrowUp"));
  target.dispatchEvent(new FakeKeyDown("a"));

  assertEquals(seen, ["moveLeft", "hardDrop"]);
  detach();
  target.dispatchEvent(new FakeKeyDown("ArrowRight"));
  assertEquals(seen, ["moveLeft", "hardDrop"]);
});

Deno.test("keyboard source covers unmapped / no-key / no-preventDefault / custom map", () => {
  const listeners: Array<(ev: Event) => void> = [];
  const target = {
    addEventListener(_type: string, fn: EventListenerOrEventListenerObject) {
      listeners.push(fn as (ev: Event) => void);
    },
    removeEventListener(_type: string, fn: EventListenerOrEventListenerObject) {
      const i = listeners.indexOf(fn as (ev: Event) => void);
      if (i >= 0) listeners.splice(i, 1);
    },
  };

  const seen: GameAction[] = [];
  const source = createKeyboardSource({
    target: target as unknown as EventTarget,
    keyMap: { x: "rotateCW" },
  });
  const detach = source.attach((a) => seen.push(a));

  for (const fn of listeners) fn({} as Event); // key undefined
  for (const fn of listeners) fn({ key: "z" } as unknown as Event); // unmapped
  for (const fn of listeners) {
    fn({ key: "x" } as unknown as Event); // mapped, no preventDefault
  }

  assertEquals(seen, ["rotateCW"]);
  detach();
  assertEquals(listeners.length, 0);
});
