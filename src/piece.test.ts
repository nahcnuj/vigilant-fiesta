import { assertEquals } from "https://deno.land/std@0.203.0/testing/asserts.ts";
import { FallingPair, num, op } from "./piece.ts";

Deno.test("2ブロックのペアは時計回りに回転し、4回で向きが戻る", () => {
  const pair = new FallingPair(num(1), op("+"));
  assertEquals(pair.offsets()[1], { dx: 0, dy: 1 });
  pair.rotateCW();
  assertEquals(pair.offsets()[1], { dx: -1, dy: 0 });
  pair.rotateCW();
  assertEquals(pair.offsets()[1], { dx: 0, dy: -1 });
  pair.rotateCW();
  assertEquals(pair.offsets()[1], { dx: 1, dy: 0 });
  pair.rotateCW();
  assertEquals(pair.offsets()[1], { dx: 0, dy: 1 });
});
