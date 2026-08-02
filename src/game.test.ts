import { assertEquals, assert } from "https://deno.land/std@0.203.0/testing/asserts.ts";
import { Game } from "./game.ts";
import { FallingPair, num, op } from "./piece.ts";

function pair(a: ReturnType<typeof num> | ReturnType<typeof op>, b: ReturnType<typeof num> | ReturnType<typeof op>) {
  return new FallingPair(a, b);
}

Deno.test("1 tick でペアが1マス落下する", () => {
  const game = new Game(8, 10, {
    current: pair(num(1), num(2)),
    next: pair(num(3), num(4)),
  });
  const y = game.position.y;
  game.tick();
  assertEquals(game.position.y, y + 1);
});

Deno.test("接地すると盤に固定され next が current になる", () => {
  const game = new Game(8, 10, {
    current: pair(num(1), num(2)),
    next: pair(num(5), op("+")),
  });
  game.hardDrop();
  assertEquals(game.current.pivot, num(5));
  assertEquals(game.current.secondary, op("+"));
  const filled = game.board.getGrid().some((row) => row.some((c) => c !== null));
  assert(filled);
});

Deno.test("数式が揃うと消えスコアが増える", () => {
  const game = new Game(8, 10, {
    current: pair(num(9), num(9)),
    next: pair(num(0), num(0)),
  });
  // 盤面に 1 +  を置き、落下で 3 を置く… ペアは2個なので事前配置で 1 + 3
  game.board.placeBlocks([
    { x: 0, y: 9, block: num(1) },
    { x: 1, y: 9, block: op("+") },
    { x: 2, y: 9, block: num(3) },
  ]);
  // 強制 resolve: hardDrop の lock で formula 解決
  // すでに数式があるので、何かロックすれば resolveFormulas が走る
  game.hardDrop();
  assertEquals(game.score >= 4, true);
  // 1+3 のセルは消えている
  assertEquals(game.board.get(0, 9), null);
});

Deno.test("出現位置に置けないとゲームオーバー", () => {
  const game = new Game(8, 10, {
    current: pair(num(1), num(2)),
    next: pair(num(3), num(4)),
  });
  // 出現帯を埋める
  for (let x = 0; x < 8; x++) {
    game.board.placeBlocks([
      { x, y: 0, block: num(1) },
      { x, y: 1, block: num(2) },
    ]);
  }
  game.hardDrop();
  assert(game.isGameOver);
});
