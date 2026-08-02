import { assertEquals, assert } from "https://deno.land/std@0.203.0/testing/asserts.ts";
import { Board } from "./board.ts";
import { num, op } from "./piece.ts";

Deno.test("空きには置けるが、重なりと場外には置けない", () => {
  const board = new Board(8, 10);
  const cells = [
    { x: 3, y: 0, block: num(1) },
    { x: 3, y: 1, block: op("+") },
  ];
  assert(board.canPlaceBlocks(cells));
  board.placeBlocks(cells);
  assert(!board.canPlaceBlocks(cells));
  assert(!board.canPlaceBlocks([{ x: -1, y: 0, block: num(2) }]));
});

Deno.test("セル消去後、列ごとに下へ詰める", () => {
  const board = new Board(3, 3);
  board.placeBlocks([
    { x: 0, y: 0, block: num(1) },
    { x: 0, y: 2, block: num(9) },
  ]);
  board.clearCells([{ x: 0, y: 2 }]);
  board.applyGravity();
  assertEquals(board.get(0, 2), num(1));
  assertEquals(board.get(0, 0), null);
});

Deno.test("get は場外で null、clearCells は場外を無視する", () => {
  const board = new Board(3, 3);
  assertEquals(board.get(-1, 0), null);
  assertEquals(board.get(0, 99), null);
  board.placeBlocks([{ x: 1, y: 1, block: num(4) }]);
  board.clearCells([{ x: -1, y: 0 }, { x: 1, y: 1 }]);
  assertEquals(board.get(1, 1), null);
});
