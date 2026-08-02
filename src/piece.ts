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

/** Rotation state tables for each tetromino type. */
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
  rotateCW(): void {
    this.rotationIdx = (this.rotationIdx + 1) % this.rotations.length;
  }
  rotateCCW(): void {
    this.rotationIdx = (this.rotationIdx - 1 + this.rotations.length) % this.rotations.length;
  }
}
