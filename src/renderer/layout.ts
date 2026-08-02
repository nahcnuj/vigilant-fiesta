import type { Cell } from "../board.ts";
import type { Block } from "../piece.ts";

/** Canvas cell size so the field fits within maxW×maxH. */
export function canvasCellSize(
  cols: number,
  rows: number,
  maxW = 320,
  maxH = 400,
): number {
  return Math.min(maxW / cols, maxH / rows);
}

/** Hue for a block (numbers vary; operators share one hue). */
export function blockHue(block: Block): number {
  return block.kind === "num" ? (block.value * 36) % 360 : 200;
}

export type PaintRect = {
  x: number;
  y: number;
  w: number;
  h: number;
  hue: number;
};

/** Non-null cells as axis-aligned rects for the renderer. */
export function paintList(grid: Cell[][], cellSize: number): PaintRect[] {
  const out: PaintRect[] = [];
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
      });
    }
  }
  return out;
}
