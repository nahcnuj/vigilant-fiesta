// tests/game_test.ts
import { assertEquals, assert } from "https://deno.land/std@0.203.0/testing/asserts.ts";
import { Game } from "../src/game.ts";

Deno.test("Game tick locks piece and spawns next", () => {
  const game = new Game(4, 4);
  // Force piece to a 1x1 block for determinism
  game.currentPiece.shape = [[1]];
  game.position = { x: 0, y: 2 };
  // Tick should move down then lock at bottom (y=3)
  game.tick();
  assertEquals(game.board.getGrid()[3][0], 1);
  // After locking, next piece should be spawned and game not over
  assert(!game.isGameOver);
});

Deno.test("Game clears full line and updates score/level", () => {
  const game = new Game(4, 4);
  // Fill bottom row completely
  const linePiece = [[1, 1, 1, 1]];
  game.board.placePiece(linePiece, 0, 3);
  // Give a piece that will lock immediately to trigger clear
  game.currentPiece.shape = [[1]];
  game.position = { x: 0, y: 2 };
  game.tick(); // lock and clear lines
  // Bottom row should be empty after clear
  assertEquals(game.board.getGrid()[3].every((c) => c === null), true);
  // Score and level updates
  assertEquals(game.score, 100);
  assertEquals(game.linesCleared, 1);
  assertEquals(game.level, 1);
});

Deno.test("Game over when spawn collides with existing blocks", () => {
  const game = new Game(4, 4);
  // Fill cells where the next piece would spawn (center top)
  const block = [[1, 1]];
  game.board.placePiece(block, 1, 0);
  // Force the current piece to be O tetromino that would occupy those cells
  game.currentPiece.shape = [[1, 1], [1, 1]];
  game.position = { x: 1, y: 0 };
  // Trigger spawn of next piece (which will collide)
  game.tick();
  assertEquals(game.isGameOver, true);
});
