import { assertEquals } from "https://deno.land/std@0.203.0/testing/asserts.ts";
import { Board } from "./board.ts";
import { num, op } from "./piece.ts";
import { findFormulas, totalFormulaScore, isPermanentlyUnclearable } from "./formula.ts";

Deno.test("横方向の 数字 演算子 数字 を検出して評価する", () => {
  const board = new Board(5, 3);
  board.placeBlocks([
    { x: 0, y: 1, block: num(1) },
    { x: 1, y: 1, block: op("+") },
    { x: 2, y: 1, block: num(3) },
  ]);
  const m = findFormulas(board);
  assertEquals(m.length, 1);
  assertEquals(m[0].result, 4);
  assertEquals(totalFormulaScore(m), 4);
});

Deno.test("縦方向も検出し、連続する数式はそれぞれ評価して合算する", () => {
  const board = new Board(5, 3);
  board.placeBlocks([
    { x: 0, y: 0, block: num(1) },
    { x: 1, y: 0, block: op("+") },
    { x: 2, y: 0, block: num(2) },
    { x: 3, y: 0, block: op("*") },
    { x: 4, y: 0, block: num(3) },
  ]);
  const m = findFormulas(board);
  assertEquals(totalFormulaScore(m), 3 + 6);
});

Deno.test("引き算の負の結果はそのままスコアに足す（減算になる）", () => {
  const board = new Board(5, 3);
  board.placeBlocks([
    { x: 0, y: 0, block: num(3) },
    { x: 1, y: 0, block: op("-") },
    { x: 2, y: 0, block: num(7) },
  ]);
  assertEquals(totalFormulaScore(findFormulas(board)), -4);
});

Deno.test("掛け算と割り算を評価する", () => {
  const board = new Board(5, 4);
  board.placeBlocks([
    { x: 0, y: 0, block: num(2) },
    { x: 1, y: 0, block: op("*") },
    { x: 2, y: 0, block: num(4) },
  ]);
  assertEquals(findFormulas(board)[0].result, 8);

  board.placeBlocks([
    { x: 0, y: 2, block: num(5) },
    { x: 1, y: 2, block: op("/") },
    { x: 2, y: 2, block: num(2) },
  ]);
  const div = findFormulas(board).find((m) => m.cells[0].y === 2);
  assertEquals(div?.result, 2.5);
});

Deno.test("縦方向の数式を検出する", () => {
  const board = new Board(3, 5);
  board.placeBlocks([
    { x: 1, y: 0, block: num(2) },
    { x: 1, y: 1, block: op("+") },
    { x: 1, y: 2, block: num(6) },
  ]);
  const m = findFormulas(board);
  assertEquals(m.length, 1);
  assertEquals(m[0].result, 8);
  assertEquals(m[0].cells, [
    { x: 1, y: 0 },
    { x: 1, y: 1 },
    { x: 1, y: 2 },
  ]);
});

Deno.test("bottom-row adjacent operators are permanently unerasable", () => {
  const board = new Board(8, 10);
  board.placeBlocks([
    { x: 3, y: 9, block: op("+") },
    { x: 4, y: 9, block: op("-") },
  ]);
  assertEquals(isPermanentlyUnclearable(board, 3, 9), true);
  assertEquals(isPermanentlyUnclearable(board, 4, 9), true);
});

Deno.test("bottom-row N O N is erasable", () => {
  const board = new Board(8, 10);
  board.placeBlocks([
    { x: 2, y: 9, block: num(1) },
    { x: 3, y: 9, block: op("+") },
    { x: 4, y: 9, block: num(5) },
  ]);
  assertEquals(isPermanentlyUnclearable(board, 3, 9), false);
});

Deno.test("non-bottom row is never marked permanently unerasable", () => {
  const board = new Board(8, 10);
  board.placeBlocks([
    { x: 3, y: 8, block: op("*") },
    { x: 4, y: 8, block: op("/") },
  ]);
  assertEquals(isPermanentlyUnclearable(board, 3, 8), false);
  assertEquals(isPermanentlyUnclearable(board, 4, 8), false);
});

Deno.test("bottom-row 1 + ÷ 4 → only the two operators are permanently unerasable", () => {
  const board = new Board(8, 10);
  board.placeBlocks([
    { x: 2, y: 9, block: num(1) },
    { x: 3, y: 9, block: op("+") },
    { x: 4, y: 9, block: op("/") },
    { x: 5, y: 9, block: num(4) },
  ]);

  // 数字は消せる可能性あり
  assertEquals(isPermanentlyUnclearable(board, 2, 9), false); // 1
  assertEquals(isPermanentlyUnclearable(board, 5, 9), false); // 4

  // 隣り合った演算子は永久に消せない
  assertEquals(isPermanentlyUnclearable(board, 3, 9), true);  // +
  assertEquals(isPermanentlyUnclearable(board, 4, 9), true);  // ÷
});

Deno.test("bottom-row single operator with empty sides is erasable", () => {
  const board = new Board(8, 10);
  board.placeBlocks([
    { x: 3, y: 9, block: op("+") },
  ]);
  assertEquals(isPermanentlyUnclearable(board, 3, 9), false);
});
