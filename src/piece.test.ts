import {
  assertEquals,
  assertThrows,
} from "https://deno.land/std@0.203.0/testing/asserts.ts";
import { FallingPair, num, op, randomBlock, randomPair } from "./piece.ts";
import { designForScore } from "./level-design.ts";

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

Deno.test("clone は向きをコピーし、元の rotate から独立する", () => {
  const pair = new FallingPair(num(1), num(2));
  pair.rotateCW();
  pair.rotateCW();
  const copy = pair.clone();
  assertEquals(copy.orientation, 2);
  pair.rotateCW();
  assertEquals(pair.orientation, 3);
  assertEquals(copy.orientation, 2);
  copy.rotateCW();
  assertEquals(copy.orientation, 3);
  assertEquals(pair.orientation, 3);
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

Deno.test("num は 0–9 を受け付ける", () => {
  assertEquals(num(0), { kind: "num", value: 0 });
  assertEquals(num(1), { kind: "num", value: 1 });
  assertEquals(num(5), { kind: "num", value: 5 });
  assertEquals(num(9), { kind: "num", value: 9 });
  let threw = false;
  try {
    num(10 as number);
  } catch {
    threw = true;
  }
  assertEquals(threw, true);
  threw = false;
  try {
    num(-1 as number);
  } catch {
    threw = true;
  }
  assertEquals(threw, true);
});

Deno.test("randomBlock / randomPair は設計のブロック集合と分布に従う", () => {
  const initialDesign = designForScore(0);
  const digit = randomBlock(() => 0.4, initialDesign);
  assertEquals(digit, num(5));
  let i = 0;
  const opBlock = randomBlock(() => (i++ === 0 ? 0.9 : 0.95), initialDesign);
  assertEquals(opBlock, op("+"));

  const pair = randomPair(() => 0.4, initialDesign);
  assertEquals(pair.pivot, num(4));
  assertEquals(pair.secondary, op("+"));

  const zeroDesign = designForScore(1_000);
  assertEquals(randomBlock(() => 0, zeroDesign), num(0));
});
