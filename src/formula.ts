import type { Block, Operator, Digit } from "./piece.ts";
import type { Board } from "./board.ts";

export interface FormulaMatch {
  cells: { x: number; y: number }[];
  result: number;
}

function evalOp(a: Digit, op: Operator, b: Digit): number {
  switch (op) {
    case "+": return a + b;
    case "-": return a - b;
    case "*": return a * b;
    case "/": return Math.trunc((a / b) * 10) / 10;
  }
}

function isNum(c: Block | null): c is { kind: "num"; value: Digit } {
  return c !== null && c.kind === "num";
}

function isOp(c: Block | null): c is { kind: "op"; value: Operator } {
  return c !== null && c.kind === "op";
}

export function findFormulas(board: Board): FormulaMatch[] {
  const matches: FormulaMatch[] = [];
  const grid = board.getGrid();
  const h = board.height;
  const w = board.width;

  // Horizontal →
  for (let y = 0; y < h; y++) {
    for (let x = 0; x + 2 < w; x++) {
      const a = grid[y][x];
      const o = grid[y][x + 1];
      const b = grid[y][x + 2];
      if (isNum(a) && isOp(o) && isNum(b)) {
        const result = evalOp(a.value, o.value, b.value);
        if (!Number.isNaN(result)) {
          matches.push({
            cells: [{ x, y }, { x: x + 1, y }, { x: x + 2, y }],
            result,
          });
        }
      }
    }
  }

  // Vertical ↓
  for (let x = 0; x < w; x++) {
    for (let y = 0; y + 2 < h; y++) {
      const a = grid[y][x];
      const o = grid[y + 1][x];
      const b = grid[y + 2][x];
      if (isNum(a) && isOp(o) && isNum(b)) {
        const result = evalOp(a.value, o.value, b.value);
        if (!Number.isNaN(result)) {
          matches.push({
            cells: [{ x, y }, { x, y: y + 1 }, { x, y: y + 2 }],
            result,
          });
        }
      }
    }
  }

  return matches;
}

export function totalFormulaScore(matches: FormulaMatch[]): number {
  return matches.reduce((s, m) => s + m.result, 0);
}

/**
 * 本当に「どうやっても」消せないブロックか？
 * 一番下の行の演算子で、左右の少なくとも一方が
 * 「すでに演算子（数字になれない）」になっている場合のみ true
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

  // その側が「数字になれる」か？
  // null（空き）またはすでに数字 → なれる
  // 演算子 → なれない
  const leftOk = left === null || left.kind === "num";
  const rightOk = right === null || right.kind === "num";

  // 左右両方とも数字になれる場合だけ消せる可能性がある
  // どちらか一方でもなれない → 永久に消せない
  return !(leftOk && rightOk);
}
