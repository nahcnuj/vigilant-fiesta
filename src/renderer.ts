import * as PIXI from "https://cdn.jsdelivr.net/npm/pixi.js@7.4.0/dist/pixi.min.mjs";
import type { Cell } from "./board.ts";
import { canvasCellSize, paintList } from "./render_layout.ts";

/** PixiJS shell: DOM attach + draw. Layout/color rules live in render_layout.ts. */
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
      const color = PIXI.utils.hex2string(
        PIXI.utils.rgb2hex(PIXI.utils.hsl2rgb([r.hue / 360, 0.7, 0.55])),
      );
      this.graphics.beginFill(parseInt(color.slice(1), 16));
      this.graphics.drawRect(r.x, r.y, r.w, r.h);
      this.graphics.endFill();
    }
  }
}
