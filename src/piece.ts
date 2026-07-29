export type Matrix = number[][];

/** Tetromino shapes represented as 4x4 matrices (0 = empty, 1 = filled). */
export const Tetrominos: Record<string, Matrix> = {
  I: [
    [0, 0, 0, 0],
    [1, 1, 1, 1],
    [0, 0, 0, 0],
    [0, 0, 0, 0],
  ],
  O: [
    [1, 1],
    [1, 1],
  ],
  T: [
    [0, 1, 0],
    [1, 1, 1],
    [0, 0, 0],
  ],
  S: [
    [0, 1, 1],
    [1, 1, 0],
    [0, 0, 0],
  ],
  Z: [
    [1, 1, 0],
    [0, 1, 1],
    [0, 0, 0],
  ],
  J: [
    [1, 0, 0],
    [1, 1, 1],
    [0, 0, 0],
  ],
  L: [
    [0, 0, 1],
    [1, 1, 1],
    [0, 0, 0],
  ],
};

/** Rotates a matrix clockwise.
 *  Works for non‑square matrices as well by treating the matrix as rows.
 */
export function rotateClockwise(matrix: Matrix): Matrix {
  const rows = matrix.length;
  const cols = matrix[0].length;
  // Resulting matrix has dimensions cols x rows
  const rotated: Matrix = Array.from({ length: cols }, () => Array<number>(rows).fill(0));
  for (let i = 0; i < cols; i++) {
    for (let j = 0; j < rows; j++) {
      // Map original (rows-1-j, i) to rotated (i, j)
      rotated[i][j] = matrix[rows - 1 - j][i];
    }
  }
  return rotated;
}

/** Rotates a matrix counter‑clockwise. */
export function rotateCounterClockwise(matrix: Matrix): Matrix {
  // Counter‑clockwise rotation can be achieved by rotating clockwise three times.
  return rotateClockwise(rotateClockwise(rotateClockwise(matrix)));
}

/** Simple Piece class holding a shape matrix and providing rotation helpers. */
export const TetrominoRotations: Record<keyof typeof Tetrominos, Matrix[]> = {
  I: [
    [
      [0,0,0,0],
      [1,1,1,1],
      [0,0,0,0],
      [0,0,0,0],
    ],
    [
      [0,0,1,0],
      [0,0,1,0],
      [0,0,1,0],
      [0,0,1,0],
    ],
    [
      [0,0,0,0],
      [0,0,0,0],
      [1,1,1,1],
      [0,0,0,0],
    ],
    [
      [0,1,0,0],
      [0,1,0,0],
      [0,1,0,0],
      [0,1,0,0],
    ],
  ],
  O: [
    [
      [1,1],
      [1,1],
    ],
    [
      [1,1],
      [1,1],
    ],
    [
      [1,1],
      [1,1],
    ],
    [
      [1,1],
      [1,1],
    ],
  ],
  T: [
    [
      [0,1,0],
      [1,1,1],
      [0,0,0],
    ],
    [
      [0,1,0],
      [0,1,1],
      [0,1,0],
    ],
    [
      [0,0,0],
      [1,1,1],
      [0,1,0],
    ],
    [
      [0,1,0],
      [1,1,0],
      [0,1,0],
    ],
  ],
  S: [
    [
      [0,1,1],
      [1,1,0],
      [0,0,0],
    ],
    [
      [0,1,0],
      [0,1,1],
      [0,0,1],
    ],
    [
      [0,0,0],
      [0,1,1],
      [1,1,0],
    ],
    [
      [1,0,0],
      [1,1,0],
      [0,1,0],
    ],
  ],
  Z: [
    [
      [1,1,0],
      [0,1,1],
      [0,0,0],
    ],
    [
      [0,0,1],
      [0,1,1],
      [0,1,0],
    ],
    [
      [0,0,0],
      [1,1,0],
      [0,1,1],
    ],
    [
      [0,1,0],
      [1,1,0],
      [1,0,0],
    ],
  ],
  L: [
    [
      [0,0,1],
      [1,1,1],
      [0,0,0],
    ],
    [
      [1,1,1],
      [1,0,0],
      [0,0,0],
    ],
    [
      [0,0,0],
      [1,1,1],
      [0,0,1],
    ],
    [
      [0,0,1],
      [0,0,1],
      [0,1,1],
    ],
  ],
  J: [
    [
      [1,0,0],
      [1,1,1],
      [0,0,0],
    ],
    [
      [0,0,0],
      [1,1,1],
      [0,0,1],
    ],
    [
      [0,0,0],
      [1,1,1],
      [1,0,0],
    ],
    [
      [0,0,1],
      [1,1,1],
      [0,0,0],
    ],
  ],
};

export class Piece {
  private rotationIdx = 0;
  private rotations: Matrix[];
  constructor(public type: keyof typeof Tetrominos) {
    this.rotations = TetrominoRotations[type];
  }
  get shape(): Matrix {
    // Return a deep copy to avoid external mutation
    return this.rotations[this.rotationIdx].map(row => row.slice());
  }
  set shape(matrix: Matrix) {
    // Directly replace current rotation matrix (used in tests)
    this.rotations[this.rotationIdx] = matrix.map(row => row.slice());
  }
  rotateCW(): void {
    this.rotationIdx = (this.rotationIdx + 1) % this.rotations.length;
  }
  rotateCCW(): void {
    this.rotationIdx = (this.rotationIdx - 1 + this.rotations.length) % this.rotations.length;
  }
}
