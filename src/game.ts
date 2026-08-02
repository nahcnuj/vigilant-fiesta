import { Board } from "./board.ts";
import { Piece, Tetrominos } from "./piece.ts";

export type TetrominoType = keyof typeof Tetrominos;

/** Simple utility to pick a random key from an object */
function randomKey<T>(obj: Record<string, T>): string {
  const keys = Object.keys(obj);
  return keys[Math.floor(Math.random() * keys.length)];
}

/** Position of a piece on the board */
export interface Position {
  x: number; // column (0‑based)
  y: number; // row (0‑based, increasing downwards)
}

/** Initial piece types (deterministic setup for tests or seeded play). */
export interface GameOptions {
  currentPiece?: TetrominoType;
  nextPiece?: TetrominoType;
}

/** Mutable session: Board + Piece orchestration (tick, input, score, game-over). */
export class Game {
  board: Board;
  currentPiece: Piece;
  nextPiece: Piece;
  position: Position; // top‑left corner of current piece on the board
  score: number = 0;
  level: number = 1;
  linesCleared: number = 0;
  private _gameOver: boolean = false;

  constructor(
    public width: number = 10,
    public height: number = 20,
    options: GameOptions = {},
  ) {
    this.board = new Board(width, height);
    const currentType = options.currentPiece ??
      (randomKey(Tetrominos) as TetrominoType);
    const nextType = options.nextPiece ??
      (randomKey(Tetrominos) as TetrominoType);
    this.currentPiece = new Piece(currentType);
    this.nextPiece = new Piece(nextType);
    // spawn in the middle top
    this.position = { x: Math.floor(width / 2) - 2, y: 0 };
    // if initial placement collides, game over immediately
    if (!this.board.canPlace(this.currentPiece.shape, this.position.x, this.position.y)) {
      this._gameOver = true;
    }
  }

  /** Returns true if the game has ended */
  get isGameOver(): boolean {
    return this._gameOver;
  }

  /** Main tick – move piece down by one cell */
  tick(): void {
    if (this._gameOver) return;
    // If current position is already invalid (e.g., spawn collides), end game
    if (!this.board.canPlace(this.currentPiece.shape, this.position.x, this.position.y)) {
      this._gameOver = true;
      return;
    }
    // Try to move down
    const moved = this.tryMove(0, 1);
    if (!moved) {
      // cannot move down – clear lines first, then lock piece
      this.clearCompletedLines();
      this.lockCurrentPiece();
      this.spawnNextPiece();
    } else {
      // After a successful move, check if piece is now at the bottom or blocked below
      if (!this.board.canPlace(this.currentPiece.shape, this.position.x, this.position.y + 1)) {
        // lock piece immediately after move
        this.clearCompletedLines();
        this.lockCurrentPiece();
        this.spawnNextPiece();
      }
    }
  }

  /** Attempt to move piece by (dx, dy). Returns true if moved */
  tryMove(dx: number, dy: number): boolean {
    const newX = this.position.x + dx;
    const newY = this.position.y + dy;
    if (this.board.canPlace(this.currentPiece.shape, newX, newY)) {
      this.position = { x: newX, y: newY };
      return true;
    }
    return false;
  }

  moveLeft() { this.tryMove(-1, 0); }
  moveRight() { this.tryMove(1, 0); }
  moveDown() { this.tryMove(0, 1); }

  rotateCW() {
    this.currentPiece.rotateCW();
    // if rotation causes collision, revert
    if (!this.board.canPlace(this.currentPiece.shape, this.position.x, this.position.y)) {
      this.currentPiece.rotateCCW();
    }
  }

  rotateCCW() {
    this.currentPiece.rotateCCW();
    if (!this.board.canPlace(this.currentPiece.shape, this.position.x, this.position.y)) {
      this.currentPiece.rotateCW();
    }
  }

  /** Place the locked piece onto the board */
  private lockCurrentPiece() {
    this.board.place(this.currentPiece.shape, this.position.x, this.position.y);
  }

  /** Remove full lines and update score/level */
  private clearCompletedLines() {
    const lines = this.board.clearLines();
    if (lines > 0) {
      this.linesCleared += lines;
      this.score += lines * 100; // simple scoring
      // increase level every 10 cleared lines
      this.level = Math.floor(this.linesCleared / 10) + 1;
    }
  }

  /** Spawn the next piece; set a new upcoming piece */
  private spawnNextPiece() {
    this.currentPiece = this.nextPiece;
    this.nextPiece = new Piece(randomKey(Tetrominos) as keyof typeof Tetrominos);
    this.position = { x: Math.floor(this.width / 2) - 2, y: 0 };
    if (!this.board.canPlace(this.currentPiece.shape, this.position.x, this.position.y)) {
      this._gameOver = true;
    }
  }
}
