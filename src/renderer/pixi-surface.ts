/**
 * Narrow typed surface over the CDN PIXI build (minified typings omit these).
 * Call sites use this adapter instead of Reflect / `as any`.
 */

export type PixiTicker = {
  add(fn: () => void): void;
  remove(fn: () => void): void;
  deltaMS: number;
};

export type PixiLineGraphics = {
  lineStyle(width: number, color: number, alpha?: number): void;
};

export type PixiXy = {
  x: number;
  y: number;
};

export type PixiAppTickerHost = {
  ticker: PixiTicker;
};

export function appTicker(app: object): PixiTicker {
  return (app as PixiAppTickerHost).ticker;
}

export function setLineStyle(
  g: object,
  width: number,
  color: number,
  alpha: number,
): void {
  (g as PixiLineGraphics).lineStyle(width, color, alpha);
}

export function setXy(target: object, x: number, y: number): void {
  const t = target as PixiXy;
  t.x = x;
  t.y = y;
}
