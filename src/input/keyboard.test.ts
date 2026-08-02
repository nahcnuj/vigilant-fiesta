import { assertEquals } from "https://deno.land/std@0.203.0/testing/asserts.ts";
import { createKeyboardSource, DEFAULT_KEY_MAP } from "./keyboard.ts";
import type { GameAction } from "./action.ts";

class FakeTarget extends EventTarget {}

/** keydown stand-in without relying on DOM KeyboardEvent in typecheck. */
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
