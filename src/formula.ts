import type { Block, Digit, Operator } from "./piece.ts";
import type { Board } from "./board.ts";

export interface FormulaMatch {
  cells: { x: number; y: number }[];
  result: number;
}

function evalOp(a: Digit, op: Operator, b: Digit): number {
  switch (op) {
    case "+":
      return a + b;
    case "-":
      return a - b;
    case "*":
      return a * b;
    case "/":
      return Math.trunc((a / b) * 10) / 10;
  }
}

function isNum(c: Block | null): c is { kind: "num"; value: Digit } {
  return c !== null && c.kind === "num";
}

function isOp(c: Block | null): c is { kind: "op"; value: Operator } {
  return c !== null && c.kind === "op";
}

type CellAt = (x: number, y: number) => Block | null;

/** Scan one axis of triples: digit · op · digit. */
function scanAxis(
  matches: FormulaMatch[],
  cellAt: CellAt,
  outerMax: number,
  innerMax: number,
  cellsFor: (
    outer: number,
    inner: number,
  ) => [
    { x: number; y: number },
    { x: number; y: number },
    { x: number; y: number },
  ],
): void {
  for (let outer = 0; outer < outerMax; outer++) {
    for (let inner = 0; inner + 2 < innerMax; inner++) {
      const [c0, c1, c2] = cellsFor(outer, inner);
      const a = cellAt(c0.x, c0.y);
      const o = cellAt(c1.x, c1.y);
      const b = cellAt(c2.x, c2.y);
      if (isNum(a) && isOp(o) && isNum(b)) {
        const result = evalOp(a.value, o.value, b.value);
        if (!Number.isNaN(result)) {
          matches.push({ cells: [c0, c1, c2], result });
        }
      }
    }
  }
}

export function findFormulas(board: Board): FormulaMatch[] {
  const matches: FormulaMatch[] = [];
  const grid = board.getGrid();
  const h = board.height;
  const w = board.width;
  const cellAt: CellAt = (x, y) => grid[y][x];

  // Horizontal: outer = row y, inner = column x
  scanAxis(matches, cellAt, h, w, (y, x) => [
    { x, y },
    { x: x + 1, y },
    { x: x + 2, y },
  ]);

  // Vertical: outer = column x, inner = row y
  scanAxis(matches, cellAt, w, h, (x, y) => [
    { x, y },
    { x, y: y + 1 },
    { x, y: y + 2 },
  ]);

  return matches;
}

export function totalFormulaScore(matches: FormulaMatch[]): number {
  return matches.reduce((s, m) => s + m.result, 0);
}

/**
 * 「どうやっても」消せないブロックか？
 * 一番下の行の演算子で、左右のどちらか一方でも
 * すでに演算子が入っていて数字になれない場合 → true
 */
export function isPermanentlyUnclearable(
  board: Board,
  x: number,
  y: number,
): boolean {
  if (y !== board.height - 1) return false;

  const grid = board.getGrid();
  const cell = grid[y][x];
  if (cell === null || cell.kind !== "op") return false;

  const left = x > 0 ? grid[y][x - 1] : null;
  const right = x < board.width - 1 ? grid[y][x + 1] : null;

  // 数字になれるか？（空き or すでに数字）
  const leftOk = left === null || left.kind === "num";
  const rightOk = right === null || right.kind === "num";

  // 両方とも数字になれる場合だけ消せる可能性あり
  return !(leftOk && rightOk);
}
