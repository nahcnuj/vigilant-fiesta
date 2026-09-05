/** Integration: Game + Board + formula via public Game API. */
import { assertEquals, assert } from "https://deno.land/std@0.203.0/testing/asserts.ts";
import { Game } from "../../src/game.ts";
import { FallingPair, num, op } from "../../src/piece.ts";

Deno.test("integration: hard drop locks pair and next becomes current", () => {
  const game = new Game(8, 10, {
    current: new FallingPair(num(1), num(2)),
    next: new FallingPair(num(7), op("+")),
  });
  game.hardDrop();
  assertEquals(game.current.pivot, num(7));
  assertEquals(game.current.secondary, op("+"));
  assert(
    game.getGrid().some((row) => row.some((c) => c !== null)),
  );
});

Deno.test("integration: existing num-op-num clears on resolve after lock", () => {
  const game = new Game(8, 10, {
    current: new FallingPair(num(9), num(8)),
    next: new FallingPair(num(1), num(1)),
  });
  game.seedBlocks([
    { x: 0, y: 9, block: num(1) },
    { x: 1, y: 9, block: op("+") },
    { x: 2, y: 9, block: num(3) },
  ]);
  game.hardDrop();
  assertEquals(game.score >= 4, true);
  assertEquals(game.getCell(0, 9), null);
  assertEquals(game.getCell(1, 9), null);
  assertEquals(game.getCell(2, 9), null);
});
