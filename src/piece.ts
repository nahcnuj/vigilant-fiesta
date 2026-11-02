import { LEVEL_DESIGNS, type LevelDesign } from "./level-design.ts";

/** Arithmetic operator on the field. */
export type Operator = "+" | "-" | "*" | "/";

/** Digits used on the board (original: 1–9, later levels add 0). */
export type Digit = 0 | 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9;

export type Block =
  | { kind: "num"; value: Digit }
  | { kind: "op"; value: Operator };

export function num(value: number): Block {
  if (!Number.isInteger(value) || value < 0 || value > 9) {
    throw new RangeError(`digit must be 0–9, got ${value}`);
  }
  return { kind: "num", value: value as Digit };
}

export function op(value: Operator): Block {
  return { kind: "op", value };
}

export function randomBlock(
  rng: () => number = Math.random,
  design: LevelDesign = LEVEL_DESIGNS[0],
): Block {
  if (design.distribution === "biased") {
    const useNumbers = rng() < 0.5;
    if (useNumbers) {
      const idx = Math.floor(rng() * design.digits.length);
      const value = design.digits[Math.min(idx, design.digits.length - 1)];
      return num(value);
    }
    const idx = Math.floor(rng() * design.operators.length);
    const value = design.operators[Math.min(idx, design.operators.length - 1)];
    return op(value);
  }

  const blocks: Block[] = [
    ...design.digits.map((value) => num(value)),
    ...design.operators.map((value) => op(value)),
  ];
  const index = Math.min(Math.floor(rng() * blocks.length), blocks.length - 1);
  return blocks[index];
}

export function randomPair(
  rng: () => number = Math.random,
  design: LevelDesign = LEVEL_DESIGNS[0],
): FallingPair {
  if (design.distribution !== "biased") {
    return new FallingPair(randomBlock(rng, design), randomBlock(rng, design));
  }

  const useNumbers = rng() < 0.5;
  if (useNumbers) {
    const firstIdx = Math.min(
      Math.floor(rng() * design.digits.length),
      design.digits.length - 1,
    );
    const secondIdx = Math.min(
      Math.floor(rng() * design.digits.length),
      design.digits.length - 1,
    );
    return new FallingPair(
      num(design.digits[firstIdx]),
      num(design.digits[secondIdx]),
    );
  }
  const firstIdx = Math.min(
    Math.floor(rng() * design.operators.length),
    design.operators.length - 1,
  );
  const secondIdx = Math.min(
    Math.floor(rng() * design.operators.length),
    design.operators.length - 1,
  );
  return new FallingPair(
    op(design.operators[firstIdx]),
    op(design.operators[secondIdx]),
  );
}

/** Read-only view of a falling / next pair (no rotate mutators). */
export type PairView = {
  readonly pivot: Block;
  readonly secondary: Block;
  readonly orientation: number;
  blocksAt(x: number, y: number): { x: number; y: number; block: Block }[];
};

export class FallingPair {
  private _orientation = 0;

  constructor(
    public readonly pivot: Block,
    public readonly secondary: Block,
  ) {}

  get orientation(): number {
    return this._orientation;
  }

  /** Cell offsets of [pivot, secondary] relative to pair origin. */
  offsets(): [{ dx: number; dy: number }, { dx: number; dy: number }] {
    const o = this._orientation & 3;
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
    this._orientation = (this._orientation + 1) & 3;
  }

  rotateCCW(): void {
    this._orientation = (this._orientation + 3) & 3;
  }

  /** Independent copy (pivot/secondary/orientation) so callers cannot alias-mutate. */
  clone(): FallingPair {
    const copy = new FallingPair(this.pivot, this.secondary);
    copy._orientation = this._orientation;
    return copy;
  }

  /** Snapshot without rotate methods (safe to hand to UI/tests). */
  asView(): PairView {
    const self = this;
    return {
      get pivot() {
        return self.pivot;
      },
      get secondary() {
        return self.secondary;
      },
      get orientation() {
        return self._orientation;
      },
      blocksAt(x: number, y: number) {
        return self.blocksAt(x, y);
      },
    };
  }
}
