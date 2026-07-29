export type Cell = number | null;

export class Board {
  readonly width: number;
  readonly height: number;
  private grid: Cell[][];

  constructor(width = 10, height = 20) {
    this.width = width;
    this.height = height;
    this.grid = Array.from({ length: height }, () => Array<Cell>(width).fill(null));
  }

  /** Returns a copy of the grid (read‑only). */
  getGrid(): Cell[][] {
    // deep copy to avoid external mutation
    return this.grid.map(row => row.slice());
  }

  /** Checks if a piece matrix can be placed at the given coordinates without collision. */
  canPlace(matrix: number[][], x: number, y: number): boolean {
    for (let dy = 0; dy < matrix.length; dy++) {
      for (let dx = 0; dx < matrix[dy].length; dx++) {
        const value = matrix[dy][dx];
        if (value === 0) continue; // empty cell in piece
        const gx = x + dx;
        const gy = y + dy;
        if (gx < 0 || gx >= this.width || gy < 0 || gy >= this.height) return false;
        if (this.grid[gy][gx] !== null) return false;
      }
    }
    return true;
  }

  /** Places a piece matrix onto the board at the given coordinates. Assumes canPlace was true. */
  place(matrix: number[][], x: number, y: number): void {
    for (let dy = 0; dy < matrix.length; dy++) {
      for (let dx = 0; dx < matrix[dy].length; dx++) {
        const value = matrix[dy][dx];
        if (value === 0) continue;
        const gx = x + dx;
        const gy = y + dy;
        this.grid[gy][gx] = value;
      }
    }
  }

  /** Clears all full rows and returns the number of cleared lines. */
  clearLines(): number {
    let cleared = 0;
    const newGrid: Cell[][] = [];
    for (let y = 0; y < this.height; y++) {
      const rowFull = this.grid[y].every(cell => cell !== null);
      if (rowFull) {
        cleared++;
      } else {
        newGrid.push(this.grid[y]);
      }
    }
    // prepend empty rows at the top for each cleared line
    while (newGrid.length < this.height) {
      newGrid.unshift(Array<Cell>(this.width).fill(null));
    }
    this.grid = newGrid;
    return cleared;
  }
}
