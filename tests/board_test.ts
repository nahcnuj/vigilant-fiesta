import { assertEquals, assert } from "https://deno.land/std@0.203.0/testing/asserts.ts";
import { Board } from "../src/board.ts";

Deno.test("Board canPlace and place piece", () => {
  const board = new Board(4, 4);
  const piece = [
    [1, 1],
    [1, 1],
  ]; // O-tetromino
  // initially can place at top-left
  assert(board.canPlace(piece, 0, 0));
  board.place(piece, 0, 0);
  // now cannot place overlapping
  assert(!board.canPlace(piece, 0, 0));
  // can place elsewhere
  assert(board.canPlace(piece, 2, 0));
});

Deno.test("Board clears full lines", () => {
  const board = new Board(4, 4);
  // Fill first row completely
  const linePiece = [
    [1, 1, 1, 1],
  ];
  board.place(linePiece, 0, 3); // bottom row (y=3)
  const cleared = board.clearLines();
  assertEquals(cleared, 1);
  // After clearing, bottom row should be empty
  const grid = board.getGrid();
  for (let x = 0; x < board.width; x++) {
    assertEquals(grid[3][x], null);
  }
});

Deno.test("Board placePiece skips empty cells and rejects OOB / overlap", () => {
  const board = new Board(4, 4);
  const withHoles = [
    [1, 0],
    [0, 1],
  ];
  board.placePiece(withHoles, 1, 1);
  const grid = board.getGrid();
  assertEquals(grid[1][1], 1);
  assertEquals(grid[1][2], null);
  assertEquals(grid[2][1], null);
  assertEquals(grid[2][2], 1);

  assert(!board.canPlace([[1]], -1, 0));
  assert(!board.canPlace([[1]], 0, -1));
  assert(!board.canPlace([[1]], 4, 0));
  assert(!board.canPlace([[1]], 0, 4));
  assert(!board.canPlace([[1]], 1, 1)); // occupied
});
