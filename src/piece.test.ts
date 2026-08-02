import { assertEquals, assertThrows } from "https://deno.land/std@0.203.0/testing/asserts.ts";
import { FallingPair, num, op, randomBlock, randomPair } from "./piece.ts";

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

Deno.test("反時計回りに1回回すと右隣配置になる", () => {
  const pair = new FallingPair(num(1), num(2));
  pair.rotateCCW();
  assertEquals(pair.offsets()[1], { dx: 1, dy: 0 });
});

Deno.test("blocksAt は原点と相対オフセットを返す", () => {
  const pair = new FallingPair(num(3), op("-"));
  assertEquals(pair.blocksAt(4, 2), [
    { x: 4, y: 2, block: num(3) },
    { x: 4, y: 3, block: op("-") },
  ]);
});

Deno.test("num は 0–9 のみ受け付ける", () => {
  assertEquals(num(0).value, 0);
  assertEquals(num(9).value, 9);
  assertThrows(() => num(10), RangeError);
  assertThrows(() => num(-1), RangeError);
  assertThrows(() => num(1.5), RangeError);
});

Deno.test("randomBlock / randomPair は rng に従う", () => {
  // < 0.7 → digit; floor(0.5*10)=5
  const digit = randomBlock(() => 0.5);
  assertEquals(digit, num(5));
  // >= 0.7 → op; floor(0.85*4)=3 → "/"
  let i = 0;
  const opBlock = randomBlock(() => (i++ === 0 ? 0.8 : 0.85));
  assertEquals(opBlock, op("/"));

  const pair = randomPair(() => 0.5);
  assertEquals(pair.pivot, num(5));
  assertEquals(pair.secondary, num(5));
});
