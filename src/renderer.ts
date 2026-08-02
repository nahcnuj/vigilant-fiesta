import * as PIXI from "https://cdn.jsdelivr.net/npm/pixi.js@7.4.0/dist/pixi.min.mjs";
import type { Cell } from "./board.ts";

/** PixiJS renderer for the number/operator field. */
export class Renderer {
  readonly app: PIXI.Application;
  private cellSize: number;
  private graphics: PIXI.Graphics;

  constructor(private width: number, private height: number) {
    const canvasWidth = 320;
    const canvasHeight = 400;
    this.cellSize = Math.min(canvasWidth / this.width, canvasHeight / this.height);
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
    for (let y = 0; y < grid.length; y++) {
      for (let x = 0; x < grid[y].length; x++) {
        const cell = grid[y][x];
        if (cell === null) continue;
        const hue = cell.kind === "num" ? (cell.value * 36) % 360 : 200;
        const color = PIXI.utils.hex2string(
          PIXI.utils.rgb2hex(PIXI.utils.hsl2rgb([hue / 360, 0.7, 0.55])),
        );
        this.graphics.beginFill(parseInt(color.slice(1), 16));
        this.graphics.drawRect(
          x * this.cellSize,
          y * this.cellSize,
          this.cellSize - 1,
          this.cellSize - 1,
        );
        this.graphics.endFill();
      }
    }
  }
}
