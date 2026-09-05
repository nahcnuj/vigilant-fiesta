import * as PIXI from "https://cdn.jsdelivr.net/npm/pixi.js@7.4.0/dist/pixi.min.mjs";
import type { Board } from "../board.ts";
import type { Block } from "../piece.ts";
import { canvasCellSize, paintList } from "./layout.ts";

/** Rows reserved for spawn (vertical pair at y=0,1). Blocks stuck above the danger line risk game over. */
const SPAWN_ROWS = 2;
const DANGER_LINE_ROW = 1;

export type TickerFn = () => void;

export class Renderer {
  private readonly app: InstanceType<typeof PIXI.Application>;
  private cellSize: number;
  private guides: InstanceType<typeof PIXI.Graphics>;
  private graphics: InstanceType<typeof PIXI.Graphics>;
  private labels: InstanceType<typeof PIXI.Container>;

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
    Reflect.apply(g.lineStyle, g, [2, 0x5ec8ff, 0.85]);
    g.beginFill(0x5ec8ff, 0.08);
    g.drawRoundedRect(sx + 1, sy + 1, sw - 2, sh - 2, 4);
    g.endFill();

    // --- Danger line: below spawn zone (y == SPAWN_ROWS) ---
    const ly = DANGER_LINE_ROW * cs;
    Reflect.apply(g.lineStyle, g, [2, 0xff5a5a, 0.9]);
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

  /** PIXI Application typings from the CDN build omit ticker; access via Reflect. */
  private ticker(): { add(fn: TickerFn): void; remove(fn: TickerFn): void; deltaMS: number } {
    return Reflect.get(this.app, "ticker") as {
      add(fn: TickerFn): void;
      remove(fn: TickerFn): void;
      deltaMS: number;
    };
  }

  addTicker(fn: TickerFn): void {
    this.ticker().add(fn);
  }

  removeTicker(fn: TickerFn): void {
    this.ticker().remove(fn);
  }

  /** Milliseconds since last ticker frame (PIXI ticker). */
  get deltaMS(): number {
    return this.ticker().deltaMS;
  }

  /** Detach canvas from DOM and destroy the PIXI application. */
  destroy(): void {
    const view = this.app.view as HTMLElement | null;
    view?.parentElement?.removeChild(view);
    this.app.destroy(true);
  }

  /**
   * Capture the current board view as a PNG data URL (result thumbnail).
   * Returns null if the canvas is unavailable or tainted.
   */
  snapshotDataURL(maxWidth = 160): string | null {
    this.app.renderer.render(this.app.stage);
    const src = this.app.view as HTMLCanvasElement;
    if (!src || src.width < 1) return null;
    const scale = Math.min(1, maxWidth / src.width);
    const w = Math.max(1, Math.round(src.width * scale));
    const h = Math.max(1, Math.round(src.height * scale));
    const tmp = document.createElement("canvas");
    tmp.width = w;
    tmp.height = h;
    const ctx = tmp.getContext("2d");
    if (!ctx) return null;
    ctx.imageSmoothingEnabled = false;
    ctx.drawImage(src, 0, 0, w, h);
    try {
      return tmp.toDataURL("image/png");
    } catch {
      return null;
    }
  }

  render(
    board: Board,
    active: { x: number; y: number; block: Block }[] = [],
  ) {
    this.graphics.clear();
    this.labels.removeChildren();
    const fontSize = Math.max(12, Math.floor(this.cellSize * 0.45));
    const grid = board.getGrid();
    for (const r of paintList(grid, this.cellSize, active, board)) {
      // Permanently unerasable blocks are drawn darker
      const lightness = r.dead ? 22 : 45;
      const saturation = r.dead ? 35 : 70;
      this.graphics.beginFill(new (PIXI.Color as any)({ h: r.hue, s: saturation, l: lightness }) as any);
      this.graphics.drawRoundedRect(r.x, r.y, r.w, r.h, 4);
      this.graphics.endFill();
      const text = new PIXI.Text(r.label, {
        fontFamily: "system-ui, sans-serif",
        fontSize,
        fontWeight: "700",
        fill: r.dead ? 0x888888 : 0xffffff,
        align: "center",
      });
      text.anchor.set(0.5);
      Reflect.set(text, "x", r.x + r.w / 2);
      Reflect.set(text, "y", r.y + r.h / 2);
      this.labels.addChild(text);
    }
  }
}
