import { Board } from "./board.ts";
import { type Block, FallingPair, randomPair } from "./piece.ts";
import { findFormulas, totalFormulaScore } from "./formula.ts";

export interface Position {
  x: number;
  y: number;
}

export type GameEvent =
  | { type: "moved" }
  | { type: "rotated" }
  | { type: "locked" }
  | { type: "cleared"; scoreDelta: number }
  | { type: "levelup"; level: number }
  | { type: "gameover" };

export interface GameOptions {
  /** Deterministic current / next pairs (tests). */
  current?: FallingPair;
  next?: FallingPair;
  /** Initial pivot position (tests); defaults to spawn. */
  position?: Position;
  rng?: () => number;
  onEvent?: (ev: GameEvent) => void;
}

/** Mutable play session: falling pairs, placement, formulas, score. */
export class Game {
  readonly board: Board;
  private _current: FallingPair;
  private _next: FallingPair;
  private _position: Position;
  private _score = 0;
  private _level = 1;
  private _gameOver = false;
  private readonly rng: () => number;
  private readonly onEvent?: (ev: GameEvent) => void;

  constructor(
    public readonly width = 8,
    public readonly height = 10,
    options: GameOptions = {},
  ) {
    this.rng = options.rng ?? Math.random;
    this.onEvent = options.onEvent;
    this.board = new Board(width, height);
    this._current = options.current ?? randomPair(this.rng);
    this._next = options.next ?? randomPair(this.rng);
    this._position = options.position ?? this.spawnPosition();
    if (!this.board.canPlaceBlocks(this.cellsAt())) {
      this._gameOver = true;
      this.onEvent?.({ type: "gameover" });
    }
  }

  get current(): FallingPair {
    return this._current;
  }

  get next(): FallingPair {
    return this._next;
  }

  /** Snapshot of pivot position (reassignment / mutation of fields has no effect). */
  get position(): Position {
    return { ...this._position };
  }

  get score(): number {
    return this._score;
  }

  get level(): number {
    return this._level;
  }

  get isGameOver(): boolean {
    return this._gameOver;
  }

  private spawnPosition(): Position {
    return { x: Math.floor(this.width / 2), y: 0 };
  }

  private cellsAt(pos = this._position, pair = this._current) {
    return pair.blocksAt(pos.x, pos.y);
  }

  private emitGameOver(): void {
    if (this._gameOver) return;
    this._gameOver = true;
    this.onEvent?.({ type: "gameover" });
  }

  tick(): void {
    if (this._gameOver) return;
    if (!this.board.canPlaceBlocks(this.cellsAt())) {
      this.emitGameOver();
      return;
    }
    if (!this.tryMove(0, 1)) {
      this.lockAndResolve();
    }
  }

  tryMove(dx: number, dy: number): boolean {
    const nx = this._position.x + dx;
    const ny = this._position.y + dy;
    if (this.board.canPlaceBlocks(this.cellsAt({ x: nx, y: ny }))) {
      this._position = { x: nx, y: ny };
      if (dy === 0 && dx !== 0) this.onEvent?.({ type: "moved" });
      return true;
    }
    return false;
  }

  moveLeft(): void {
    this.tryMove(-1, 0);
  }
  moveRight(): void {
    this.tryMove(1, 0);
  }

  /** Requirements: ↓ rotates 90° clockwise. */
  rotateCW(): void {
    this._current.rotateCW();
    if (!this.board.canPlaceBlocks(this.cellsAt())) {
      this._current.rotateCCW();
      return;
    }
    this.onEvent?.({ type: "rotated" });
  }

  /** Requirements: ↑ hard drop. */
  hardDrop(): void {
    if (this._gameOver) return;
    while (this.tryMove(0, 1)) {
      /* drop */
    }
    this.lockAndResolve();
  }

  private lockAndResolve(): void {
    this.onEvent?.({ type: "locked" });
    this.board.placeBlocks(this.cellsAt());
    this.board.applyGravity();
    this.resolveFormulas();
    this.spawnNext();
  }

  /** Clear formulas, apply gravity, repeat until stable; update score/level. */
  private resolveFormulas(): void {
    for (let guard = 0; guard < 50; guard++) {
      const matches = findFormulas(this.board);
      if (matches.length === 0) break;
      const delta = totalFormulaScore(matches);
      this._score += delta;
      this.onEvent?.({ type: "cleared", scoreDelta: delta });
      const prevLevel = this._level;
      this._level = Math.floor(this._score / 250) + 1;
      if (this._level > prevLevel) {
        this.onEvent?.({ type: "levelup", level: this._level });
      }
      const cleared = new Map<string, { x: number; y: number }>();
      for (const m of matches) {
        for (const c of m.cells) cleared.set(`${c.x},${c.y}`, c);
      }
      this.board.clearCells([...cleared.values()]);
      this.board.applyGravity();
    }
  }

  private spawnNext(): void {
    this._current = this._next;
    this._next = randomPair(this.rng);
    this._position = this.spawnPosition();
    if (!this.board.canPlaceBlocks(this.cellsAt())) {
      this.emitGameOver();
    }
  }
}

export type { Block };
