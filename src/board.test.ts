import { assertEquals, assert } from "https://deno.land/std@0.203.0/testing/asserts.ts";
import { Board } from "./board.ts";

Deno.test("空きマスには置けるが、重なりと場外には置けない", () => {
  const board = new Board(4, 4);
  const o = [
    [1, 1],
    [1, 1],
  ];

  assert(board.canPlace(o, 0, 0));
  board.place(o, 0, 0);
  assert(!board.canPlace(o, 0, 0));
  assert(board.canPlace(o, 2, 0));
  assert(!board.canPlace([[1]], -1, 0));
  assert(!board.canPlace([[1]], 0, 4));
});

Deno.test("揃った行を消し、上に詰める", () => {
  const board = new Board(4, 4);
  board.place([[1, 1, 1, 1]], 0, 3);

  assertEquals(board.clearLines(), 1);
  assert(board.getGrid()[3].every((c) => c === null));
});
