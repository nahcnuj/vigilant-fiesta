import type { Cell } from "../board.ts";
import type { Block } from "../piece.ts";

export function canvasCellSize(
  cols: number,
  rows: number,
  maxW = 320,
  maxH = 400,
): number {
  return Math.min(maxW / cols, maxH / rows);
}

export function blockHue(block: Block): number {
  // original block.png: numbers blue-violet, operators coral-red
  return block.kind === "num" ? 230 : 5;
}

export function blockLabel(block: Block): string {
  if (block.kind === "num") return String(block.value);
  switch (block.value) {
    case "+":
      return "+";
    case "-":
      return "−";
    case "*":
      return "×";
    case "/":
      return "÷";
  }
}

export type PaintCell = {
  x: number;
  y: number;
  w: number;
  h: number;
  hue: number;
  label: string;
  dead: boolean;
};

export type DeadCellFn = (x: number, y: number) => boolean;

/**
 * Pure presentation layout: rectangles for grid + active cells.
 * `isDead` is injected by the caller (domain decides permanence).
 */
export function paintList(
  grid: Cell[][],
  cellSize: number,
  active: { x: number; y: number; block: Block }[] = [],
  isDead: DeadCellFn = () => false,
): PaintCell[] {
  const out: PaintCell[] = [];
  for (let y = 0; y < grid.length; y++) {
    for (let x = 0; x < grid[y].length; x++) {
      const cell = grid[y][x];
      if (cell === null) continue;
      out.push({
        x: x * cellSize,
        y: y * cellSize,
        w: cellSize - 1,
        h: cellSize - 1,
        hue: blockHue(cell),
        label: blockLabel(cell),
        dead: isDead(x, y),
      });
    }
  }
  for (const a of active) {
    if (a.y < 0) continue;
    out.push({
      x: a.x * cellSize,
      y: a.y * cellSize,
      w: cellSize - 1,
      h: cellSize - 1,
      hue: blockHue(a.block),
      label: blockLabel(a.block),
      dead: false,
    });
  }
  return out;
}

/** Labels/hues for the Next panel (`game.next` only — not the falling pair). */
export function nextPreview(pair: { pivot: Block; secondary: Block }): {
  pivot: { label: string; hue: number };
  secondary: { label: string; hue: number };
} {
  return {
    pivot: { label: blockLabel(pair.pivot), hue: blockHue(pair.pivot) },
    secondary: {
      label: blockLabel(pair.secondary),
      hue: blockHue(pair.secondary),
    },
  };
}
