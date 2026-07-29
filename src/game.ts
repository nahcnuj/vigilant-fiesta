// src/game.ts

import { Board } from "./board.ts";
import { Piece, Tetrominos } from "./piece.ts";

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

export class Game {
  board: Board;
  currentPiece: Piece;
  nextPiece: Piece;
  position: Position; // top‑left corner of current piece on the board
  score: number = 0;
  level: number = 1;
  linesCleared: number = 0;
  private _gameOver: boolean = false;

  constructor(public width: number = 10, public height: number = 20) {
    this.board = new Board(width, height);
    this.currentPiece = new Piece(randomKey(Tetrominos) as keyof typeof Tetrominos);
    this.nextPiece = new Piece(randomKey(Tetrominos) as keyof typeof Tetrominos);
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
    if (!this.tryMove(0, 1)) {
      // cannot move down – lock piece
      this.lockCurrentPiece();
      this.clearCompletedLines();
      this.spawnNextPiece();
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
    this.board.placePiece(this.currentPiece.shape, this.position.x, this.position.y);
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
