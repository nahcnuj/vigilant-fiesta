import * as PIXI from "https://cdn.jsdelivr.net/npm/pixi.js@7.4.0/dist/pixi.min.mjs";
import type { Cell } from "../board.ts";
import type { Block } from "../piece.ts";
import { canvasCellSize, paintList } from "./layout.ts";

export class Renderer {
  readonly app: PIXI.Application;
  private cellSize: number;
  private graphics: PIXI.Graphics;
  private labels: PIXI.Container;

  constructor(private width: number, private height: number) {
    this.cellSize = canvasCellSize(this.width, this.height);
    this.app = new PIXI.Application({
      width: this.cellSize * this.width,
      height: this.cellSize * this.height,
      backgroundColor: 0x1a222c,
      antialias: true,
    });
    this.graphics = new PIXI.Graphics();
    this.labels = new PIXI.Container();
    this.app.stage.addChild(this.graphics);
    this.app.stage.addChild(this.labels);
  }

  attachTo(elementId: string) {
    const container = document.getElementById(elementId);
    if (container) container.appendChild(this.app.view as HTMLCanvasElement);
    else console.warn(`Renderer: element #${elementId} not found`);
  }

  render(grid: Cell[][], active: { x: number; y: number; block: Block }[] = []) {
    this.graphics.clear();
    this.labels.removeChildren();
    const fontSize = Math.max(12, Math.floor(this.cellSize * 0.45));
    for (const r of paintList(grid, this.cellSize, active)) {
      this.graphics.beginFill(new PIXI.Color({ h: r.hue, s: 70, l: 45 }));
      this.graphics.drawRoundedRect(r.x, r.y, r.w, r.h, 4);
      this.graphics.endFill();
      const text = new PIXI.Text(r.label, {
        fontFamily: "system-ui, sans-serif",
        fontSize,
        fontWeight: "700",
        fill: 0xffffff,
        align: "center",
      });
      text.anchor.set(0.5);
      text.x = r.x + r.w / 2;
      text.y = r.y + r.h / 2;
      this.labels.addChild(text);
    }
  }
}
