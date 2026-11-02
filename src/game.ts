import { Board, type Cell } from "./board.ts";
import {
  designForScore,
  type LevelDesign,
} from "./level-design.ts";
import { type Block, FallingPair, type PairView, randomPair } from "./piece.ts";
import {
  findFormulas,
  hasDivisionByZero,
  isPermanentlyUnclearable,
  totalFormulaScore,
} from "./formula.ts";
import { spawnColumn } from "./spawn.ts";

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
  design?: LevelDesign;
  onEvent?: (ev: GameEvent) => void;
}

/** Mutable play session: falling pairs, placement, formulas, score. */
export class Game {
  readonly #board: Board;
  #current: FallingPair;
  #next: FallingPair;
  #position: Position;
  #score = 0;
  #design: LevelDesign;
  #level = 0;
  #gameOver = false;
  readonly #rng: () => number;
  readonly #onEvent?: (ev: GameEvent) => void;

  constructor(
    public readonly width = 8,
    public readonly height = 10,
    options: GameOptions = {},
  ) {
    this.#rng = options.rng ?? Math.random;
    this.#onEvent = options.onEvent;
    this.#design = options.design ?? designForScore(0);
    this.#level = this.#design.level;
    this.#board = new Board(width, height);
    // Clone option pairs so external rotateCW cannot mutate session orientation.
    this.#current = options.current?.clone() ?? randomPair(this.#rng, this.#design);
    this.#next = options.next?.clone() ?? randomPair(this.#rng, this.#design);
    this.#position = options.position
      ? { ...options.position }
      : this.spawnPosition();
    if (!this.#board.canPlaceBlocks(this.cellsAt())) {
      this.#gameOver = true;
      this.#onEvent?.({ type: "gameover" });
    }
  }

  /** Read-only pair view (no rotate mutators). */
  get current(): PairView {
    return this.#current.asView();
  }

  get next(): PairView {
    return this.#next.asView();
  }

  /** Snapshot of pivot position (reassignment / mutation of fields has no effect). */
  get position(): Position {
    return { ...this.#position };
  }

  get score(): number {
    return this.#score;
  }

  get level(): number {
    return this.#level;
  }

  get isGameOver(): boolean {
    return this.#gameOver;
  }

  getGrid(): Cell[][] {
    return this.#board.getGrid();
  }

  getCell(x: number, y: number): Cell {
    return this.#board.get(x, y);
  }

  /** Domain rule for permanently unclearable cells (for paint styling). */
  isDeadCell(x: number, y: number): boolean {
    return isPermanentlyUnclearable(this.#board, x, y);
  }

  /**
   * Seed the field for tests / fixtures. Enforces placement invariants.
   * Does not affect the falling pair.
   */
  seedBlocks(cells: { x: number; y: number; block: Block }[]): void {
    this.#board.placeBlocks(cells);
  }

  private spawnPosition(): Position {
    return { x: spawnColumn(this.width), y: 0 };
  }

  private cellsAt(pos = this.#position, pair = this.#current) {
    return pair.blocksAt(pos.x, pos.y);
  }

  private emitGameOver(): void {
    if (this.#gameOver) return;
    this.#gameOver = true;
    this.#onEvent?.({ type: "gameover" });
  }

  private refreshDesign(): void {
    const next = designForScore(this.#score);
    if (next.level <= this.#design.level) return;
    this.#design = next;
    const prevLevel = this.#level;
    this.#level = next.level;
    if (this.#level > prevLevel) {
      this.#onEvent?.({ type: "levelup", level: this.#level });
    }
  }

  tick(): void {
    if (this.#gameOver) return;
    if (!this.#board.canPlaceBlocks(this.cellsAt())) {
      this.emitGameOver();
      return;
    }
    if (!this.tryMove(0, 1)) {
      this.lockAndResolve();
    }
  }

  tryMove(dx: number, dy: number): boolean {
    const nx = this.#position.x + dx;
    const ny = this.#position.y + dy;
    if (this.#board.canPlaceBlocks(this.cellsAt({ x: nx, y: ny }))) {
      this.#position = { x: nx, y: ny };
      if (dy === 0 && dx !== 0) this.#onEvent?.({ type: "moved" });
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
    this.#current.rotateCW();
    if (!this.#board.canPlaceBlocks(this.cellsAt())) {
      this.#current.rotateCCW();
      return;
    }
    this.#onEvent?.({ type: "rotated" });
  }

  /** Requirements: ↑ hard drop. */
  hardDrop(): void {
    if (this.#gameOver) return;
    if (!this.#board.canPlaceBlocks(this.cellsAt())) {
      this.emitGameOver();
      return;
    }
    let dropGuard = 0;
    while (dropGuard < this.height + 2 && this.tryMove(0, 1)) {
      dropGuard++;
    }
    this.lockAndResolve();
  }

  private lockAndResolve(): void {
    this.#onEvent?.({ type: "locked" });
    this.#board.placeBlocks(this.cellsAt());
    this.#board.applyGravity();
    this.resolveFormulas();
    this.spawnNext();
  }

  /** Clear formulas, apply gravity, repeat until stable; update score/level. */
  private resolveFormulas(): void {
    const maxTimeMs = 200;
    const startTime = performance.now();
    for (let guard = 0; guard < 50; guard++) {
      const elapsed = performance.now() - startTime;
      if (elapsed > maxTimeMs) break;
      const matches = findFormulas(this.#board);
      if (this.#design.forcedGameOver.divisionByZero && hasDivisionByZero(this.#board)) {
        this.emitGameOver();
        return;
      }
      if (matches.length === 0) break;
      const delta = totalFormulaScore(matches);
      this.#score += delta;
      this.#onEvent?.({ type: "cleared", scoreDelta: delta });
      this.refreshDesign();
      if (this.#design.forcedGameOver.negativeScore && this.#score < 0) {
        this.emitGameOver();
        return;
      }
      const cleared = new Map<string, { x: number; y: number }>();
      for (const m of matches) {
        for (const c of m.cells) cleared.set(`${c.x},${c.y}`, c);
      }
      if (cleared.size === 0) break;
      this.#board.clearCells([...cleared.values()]);
      this.#board.applyGravity();
    }
  }

  private spawnNext(): void {
    this.#current = this.#next;
    this.#next = randomPair(this.#rng, this.#design);
    this.#position = this.spawnPosition();
    if (!this.#board.canPlaceBlocks(this.cellsAt())) {
      this.emitGameOver();
    }
  }
}

export type { Block };
