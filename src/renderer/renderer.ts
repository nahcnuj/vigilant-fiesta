import * as PIXI from "https://esm.sh/pixi.js@7.4.0";

interface PixiText {
  x: number;
  y: number;
  anchor: { set(x: number, y?: number): void };
}
import type { Cell } from "../board.ts";
import type { Block } from "../piece.ts";
import { canvasCellSize, paintList } from "./layout.ts";

/** Rows reserved for spawn (vertical pair at y=0,1). Blocks stuck above the line 竊・risk of game over. */
const SPAWN_ROWS = 2;
const DANGER_LINE_ROW = 1;

export class Renderer {
  readonly app: any;
  private cellSize: number;
  private guides: any;
  private graphics: any;
  private labels: any;

  constructor(private width: number, private height: number) {
    this.cellSize = canvasCellSize(this.width, this.height);
    this.app = new PIXI.Application({
      width: this.cellSize * this.width,
      height: this.cellSize * this.height,
      backgroundColor: 0x1a222c,
      antialias: true,
      preserveDrawingBuffer: true,
    });
    this.guides = new PIXI.Graphics();
    this.graphics = new PIXI.Graphics();
    this.labels = new PIXI.Container();
    this.app.stage.addChild(this.guides);
    this.app.stage.addChild(this.graphics);
    this.app.stage.addChild(this.labels);
    this.drawGuides();
  }

  private spawnOriginX(): number {
    return Math.floor(this.width / 2);
  }

  /** Danger line + spawn frame (static; redrawn if cellSize ever changes). */
  private drawGuides(): void {
    const cs = this.cellSize;
    const w = this.width * cs;
    const g = this.guides;
    g.clear();

    // --- Spawn frame: where the next pair appears (pivot column, 2 rows) ---
    const sx = this.spawnOriginX() * cs;
    const sy = 0;
    const sw = cs;
    const sh = SPAWN_ROWS * cs;
    g.lineStyle(2, 0x5ec8ff, 0.85);
    g.beginFill(0x5ec8ff, 0.08);
    g.drawRoundedRect(sx + 1, sy + 1, sw - 2, sh - 2, 4);
    g.endFill();

    // --- Danger line: below spawn zone (y == SPAWN_ROWS) ---
    const ly = DANGER_LINE_ROW * cs;
    g.lineStyle(2, 0xff5a5a, 0.9);
    // dashed horizontal line
    const dash = 8;
    const gap = 6;
    let x = 0;
    while (x < w) {
      const x2 = Math.min(x + dash, w);
      g.moveTo(x, ly);
      g.lineTo(x2, ly);
      x += dash + gap;
    }
  }

  attachTo(elementId: string) {
    const container = document.getElementById(elementId);
    if (container) container.appendChild(this.app.view as HTMLCanvasElement);
    else console.warn(`Renderer: element #${elementId} not found`);
  }

  render(
    grid: Cell[][],
    active: { x: number; y: number; block: Block }[] = [],
    board?: import("../board.ts").Board,
  ) {
    this.graphics.clear();
    this.labels.removeChildren();
    const fontSize = Math.max(12, Math.floor(this.cellSize * 0.45));
    for (const r of paintList(grid, this.cellSize, active, board)) {
      // Permanently unerasable blocks are drawn darker
      const lightness = r.dead ? 22 : 45;
      const saturation = r.dead ? 35 : 70;
      this.graphics.beginFill(new (PIXI.Color as any)({ h: r.hue, s: saturation, l: lightness }) as any);
      this.graphics.drawRoundedRect(r.x, r.y, r.w, r.h, 4);
      this.graphics.endFill();
      const text: PixiText = new PIXI.Text(r.label, {
        fontFamily: "system-ui, sans-serif",
        fontSize,
        fontWeight: "700",
        fill: r.dead ? 0x888888 : 0xffffff,
        align: "center",
      });
      text.anchor.set(0.5);
      (text as PixiText).x = r.x + r.w / 2;
      (text as PixiText).y = r.y + r.h / 2;
      this.labels.addChild(text);
    }
  }
}










