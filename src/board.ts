import type { Block } from "./piece.ts";

export type Cell = Block | null;

export class Board {
  readonly width: number;
  readonly height: number;
  private grid: Cell[][];

  constructor(width = 8, height = 10) {
    this.width = width;
    this.height = height;
    this.grid = Array.from({ length: height }, () =>
      Array<Cell>(width).fill(null)
    );
  }

  getGrid(): Cell[][] {
    return this.grid.map((row) => row.slice());
  }

  get(x: number, y: number): Cell {
    if (x < 0 || x >= this.width || y < 0 || y >= this.height) return null;
    return this.grid[y][x];
  }

  /** True if every occupied cell of the pair fits and is empty. */
  canPlaceBlocks(
    cells: { x: number; y: number; block: Block }[],
  ): boolean {
    for (const { x, y } of cells) {
      if (x < 0 || x >= this.width || y < 0 || y >= this.height) return false;
      if (this.grid[y][x] !== null) return false;
    }
    return true;
  }

  placeBlocks(cells: { x: number; y: number; block: Block }[]): void {
    for (const { x, y, block } of cells) {
      this.grid[y][x] = block;
    }
  }

  clearCells(coords: { x: number; y: number }[]): void {
    for (const { x, y } of coords) {
      if (x >= 0 && x < this.width && y >= 0 && y < this.height) {
        this.grid[y][x] = null;
      }
    }
  }

  /** After clears, gravity: each column packs blocks downward. */
  applyGravity(): void {
    for (let x = 0; x < this.width; x++) {
      const stack: Block[] = [];
      for (let y = this.height - 1; y >= 0; y--) {
        const c = this.grid[y][x];
        if (c !== null) stack.push(c);
      }
      for (let y = this.height - 1; y >= 0; y--) {
        this.grid[y][x] = stack[this.height - 1 - y] ?? null;
      }
    }
  }
}
