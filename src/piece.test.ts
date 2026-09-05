import {
  assertEquals,
  assertThrows,
} from "https://deno.land/std@0.203.0/testing/asserts.ts";
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

Deno.test("asView は向きを読めても rotate を公開しない", () => {
  const pair = new FallingPair(num(1), num(2));
  pair.rotateCW();
  const view = pair.asView();
  assertEquals(view.orientation, 1);
  assertEquals(
    "rotateCW" in view,
    false,
  );
  assertEquals(view.blocksAt(0, 0)[1], { x: -1, y: 0, block: num(2) });
});

Deno.test("num は 1–9 のみ受け付ける", () => {
  assertEquals(num(1), { kind: "num", value: 1 });
  assertEquals(num(5), { kind: "num", value: 5 });
  assertEquals(num(9), { kind: "num", value: 9 });
  let threw = false;
  try {
    num(0 as number);
  } catch {
    threw = true;
  }
  assertEquals(threw, true);
  threw = false;
  try {
    num(10 as number);
  } catch {
    threw = true;
  }
  assertEquals(threw, true);
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
