/** Arithmetic operator on the field. */
export type Operator = "+" | "-" | "*" | "/";

/** Digits used on the board (original: 1–9 only). */
export type Digit = 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9;

export type Block =
  | { kind: "num"; value: Digit }
  | { kind: "op"; value: Operator };

export function num(value: number): Block {
  if (!Number.isInteger(value) || value < 1 || value > 9) {
    throw new RangeError(`digit must be 1–9, got ${value}`);
  }
  return { kind: "num", value: value as Digit };
}

export function op(value: Operator): Block {
  return { kind: "op", value };
}

export function randomBlock(rng: () => number = Math.random): Block {
  if (rng() < 0.7) return num(1 + Math.floor(rng() * 9));
  const ops: Operator[] = ["+", "-", "*", "/"];
  return op(ops[Math.floor(rng() * ops.length)]);
}
export class FallingPair {
  orientation = 0;

  constructor(
    public readonly pivot: Block,
    public readonly secondary: Block,
  ) {}

  /** Cell offsets of [pivot, secondary] relative to pair origin. */
  offsets(): [{ dx: number; dy: number }, { dx: number; dy: number }] {
    const o = this.orientation & 3;
    if (o === 0) return [{ dx: 0, dy: 0 }, { dx: 0, dy: 1 }];
    if (o === 1) return [{ dx: 0, dy: 0 }, { dx: -1, dy: 0 }];
    if (o === 2) return [{ dx: 0, dy: 0 }, { dx: 0, dy: -1 }];
    return [{ dx: 0, dy: 0 }, { dx: 1, dy: 0 }];
  }

  blocksAt(x: number, y: number): { x: number; y: number; block: Block }[] {
    const [a, b] = this.offsets();
    return [
      { x: x + a.dx, y: y + a.dy, block: this.pivot },
      { x: x + b.dx, y: y + b.dy, block: this.secondary },
    ];
  }

  /** Rotate 90° clockwise (requirements: ↓ key). */
  rotateCW(): void {
    this.orientation = (this.orientation + 1) & 3;
  }

  rotateCCW(): void {
    this.orientation = (this.orientation + 3) & 3;
  }
}

export function randomPair(rng: () => number = Math.random): FallingPair {
  return new FallingPair(randomBlock(rng), randomBlock(rng));
}
