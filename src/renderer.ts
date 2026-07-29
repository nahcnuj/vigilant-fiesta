// src/renderer.ts

import * as PIXI from "https://cdn.jsdelivr.net/npm/pixi.js@7.4.0/dist/pixi.min.mjs";

/** Simple PixiJS renderer for the Tetris board.
 *  It creates a Pixi Application, renders each cell as a square.
 */
export class Renderer {
  readonly app: PIXI.Application;
  private cellSize: number;
  private graphics: PIXI.Graphics;

  constructor(private width: number, private height: number) {
    // Determine cell size to fit a reasonable canvas size (e.g., 400x800)
    const canvasWidth = 400;
    const canvasHeight = 800;
    this.cellSize = Math.min(canvasWidth / this.width, canvasHeight / this.height);
    this.app = new PIXI.Application({
      width: this.cellSize * this.width,
      height: this.cellSize * this.height,
      backgroundAlpha: 0,
    });
    this.graphics = new PIXI.Graphics();
    this.app.stage.addChild(this.graphics);
  }

  /** Attach the Pixi canvas to a DOM element by its id. */
  attachTo(elementId: string) {
    const container = document.getElementById(elementId);
    if (container) {
      container.appendChild(this.app.view);
    } else {
      console.warn(`Renderer: element #${elementId} not found`);
    }
  }

  /** Render the board grid. `grid` is a 2‑D array of numbers or null. */
  render(grid: (number | null)[][]) {
    this.graphics.clear();
    for (let y = 0; y < grid.length; y++) {
      const row = grid[y];
      for (let x = 0; x < row.length; x++) {
        const cell = row[x];
        if (cell !== null) {
          // simple color based on value (just a hue rotation)
          const hue = (cell * 60) % 360;
          const color = PIXI.utils.hex2string(PIXI.utils.rgb2hex(PIXI.utils.hsl2rgb([hue / 360, 0.7, 0.6])));
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
}
