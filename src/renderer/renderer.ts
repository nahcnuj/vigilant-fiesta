import * as PIXI from "https://cdn.jsdelivr.net/npm/pixi.js@7.4.0/dist/pixi.min.mjs";
import type { Cell } from "../board.ts";
import { canvasCellSize, paintList } from "./layout.ts";

/** Pixi view: Application, canvas, and draw. */
export class Renderer {
  readonly app: PIXI.Application;
  private cellSize: number;
  private graphics: PIXI.Graphics;

  constructor(private width: number, private height: number) {
    this.cellSize = canvasCellSize(this.width, this.height);
    this.app = new PIXI.Application({
      width: this.cellSize * this.width,
      height: this.cellSize * this.height,
      backgroundAlpha: 0,
    });
    this.graphics = new PIXI.Graphics();
    this.app.stage.addChild(this.graphics);
  }

  attachTo(elementId: string) {
    const container = document.getElementById(elementId);
    if (container) {
      container.appendChild(this.app.view);
    } else {
      console.warn(`Renderer: element #${elementId} not found`);
    }
  }

  render(grid: Cell[][]) {
    this.graphics.clear();
    for (const r of paintList(grid, this.cellSize)) {
      // ColorSource HSL object — PIXI.Color (since 7.2)
      // https://pixijs.download/v7.4.0/docs/PIXI.Color.html
      this.graphics.beginFill(
        new PIXI.Color({ h: r.hue, s: 70, l: 55 }),
      );
      this.graphics.drawRect(r.x, r.y, r.w, r.h);
      this.graphics.endFill();
    }
  }
}
