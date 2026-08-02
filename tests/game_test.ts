// tests/game_test.ts
import { assertEquals, assert } from "https://deno.land/std@0.203.0/testing/asserts.ts";
import { Game } from "../src/game.ts";
import { Piece } from "../src/piece.ts";

Deno.test("Game tick free-falls without locking when space below remains", () => {
  const game = new Game(4, 6);
  game.currentPiece.shape = [[1]];
  game.position = { x: 0, y: 0 };
  game.tick();
  // Moved down one cell; still room below → not locked
  assertEquals(game.position, { x: 0, y: 1 });
  assertEquals(game.board.getGrid()[1][0], null);
  assert(!game.isGameOver);
});

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

Deno.test("Game moveLeft / moveRight / moveDown", () => {
  const game = new Game(6, 6);
  game.currentPiece.shape = [[1]];
  game.position = { x: 2, y: 1 };

  game.moveLeft();
  assertEquals(game.position, { x: 1, y: 1 });
  game.moveRight();
  assertEquals(game.position, { x: 2, y: 1 });
  game.moveDown();
  assertEquals(game.position, { x: 2, y: 2 });

  // blocked left edge
  game.position = { x: 0, y: 1 };
  game.moveLeft();
  assertEquals(game.position, { x: 0, y: 1 });

  // blocked right edge
  game.position = { x: 5, y: 1 };
  game.moveRight();
  assertEquals(game.position, { x: 5, y: 1 });

  // blocked by occupied cell below
  game.board.place([[1]], 2, 3);
  game.position = { x: 2, y: 2 };
  game.moveDown();
  assertEquals(game.position, { x: 2, y: 2 });
});

Deno.test("Game rotateCW and rotateCCW success and collision revert", () => {
  const game = new Game(8, 8);
  game.currentPiece = new Piece("T");
  game.position = { x: 3, y: 2 };
  const before = game.currentPiece.shape;
  game.rotateCW();
  assertEquals(game.currentPiece.shape, [
    [0, 1, 0],
    [0, 1, 1],
    [0, 1, 0],
  ]);
  game.rotateCCW();
  assertEquals(game.currentPiece.shape, before);

  // Block a cell used only after CW rotation so rotateCW reverts
  game.currentPiece = new Piece("T");
  game.position = { x: 2, y: 2 };
  // CW T at (2,2) occupies (3,2),(3,3),(4,3),(3,4)
  game.board.place([[1]], 3, 2);
  const preCw = game.currentPiece.shape;
  game.rotateCW();
  assertEquals(game.currentPiece.shape, preCw);

  // Block a cell used only after CCW rotation so rotateCCW reverts
  const game2 = new Game(8, 8);
  game2.currentPiece = new Piece("T");
  game2.position = { x: 2, y: 2 };
  // CCW T at (2,2) occupies (3,2),(2,3),(3,3),(3,4)
  game2.board.place([[1]], 2, 3);
  const preCcw = game2.currentPiece.shape;
  game2.rotateCCW();
  assertEquals(game2.currentPiece.shape, preCcw);
});
Deno.test("Game tick is no-op when already game over", () => {
  const game = new Game(4, 4);
  game.currentPiece.shape = [[1, 1], [1, 1]];
  game.position = { x: 1, y: 0 };
  game.board.placePiece([[1, 1]], 1, 0);
  game.tick();
  assert(game.isGameOver);
  const gridBefore = game.board.getGrid();
  const scoreBefore = game.score;
  game.tick();
  assertEquals(game.board.getGrid(), gridBefore);
  assertEquals(game.score, scoreBefore);
});

Deno.test("Game tick locks when cannot move down without prior free fall", () => {
  const game = new Game(4, 4);
  game.currentPiece.shape = [[1]];
  game.position = { x: 0, y: 3 };
  // Already at bottom: canPlace at y=3 ok but tryMove(0,1) fails → lock path
  // Actually y=3 is last row - canPlace may succeed for 1x1. tryMove down fails.
  game.tick();
  assertEquals(game.board.getGrid()[3][0], 1);
});

Deno.test("Game level increases after 10 lines", () => {
  const game = new Game(4, 12);
  // Fill 10 full rows; piece above cannot move down → clear then lock
  for (let y = 1; y <= 10; y++) {
    game.board.place([[1, 1, 1, 1]], 0, y);
  }
  game.currentPiece.shape = [[1]];
  game.position = { x: 0, y: 0 };
  game.tick();
  assertEquals(game.linesCleared, 10);
  assertEquals(game.level, 2);
  assertEquals(game.score, 1000);
});

Deno.test("Game constructor game over when spawn blocked on tiny board", () => {
  // 1x1 board cannot fit any default tetromino spawn (position x = -1 or 0 with larger shapes)
  const game = new Game(1, 1);
  // Default pieces are multi-cell; canPlace almost always false → game over
  assertEquals(game.isGameOver, true);
});
