/** Shared fill look for board cells, Next HUD, and CSS rule examples. */
export const FILL_SATURATION = 70;
export const FILL_LIGHTNESS = 45;
export const FILL_DEAD_SATURATION = 35;
export const FILL_DEAD_LIGHTNESS = 22;

export function blockFillCss(hue: number): string {
  return `hsl(${hue} ${FILL_SATURATION}% ${FILL_LIGHTNESS}%)`;
}

/** Convert HSL (h 0–360, s/l 0–100) to a 0xRRGGBB integer for PIXI fills. */
export function hslToRgbInt(h: number, s: number, l: number): number {
  const ss = s / 100;
  const ll = l / 100;
  const c = (1 - Math.abs(2 * ll - 1)) * ss;
  const hp = ((h % 360) + 360) % 360 / 60;
  const x = c * (1 - Math.abs(hp % 2 - 1));
  let r = 0, g = 0, b = 0;
  if (hp < 1) [r, g, b] = [c, x, 0];
  else if (hp < 2) [r, g, b] = [x, c, 0];
  else if (hp < 3) [r, g, b] = [0, c, x];
  else if (hp < 4) [r, g, b] = [0, x, c];
  else if (hp < 5) [r, g, b] = [x, 0, c];
  else [r, g, b] = [c, 0, x];
  const m = ll - c / 2;
  const R = Math.round((r + m) * 255);
  const G = Math.round((g + m) * 255);
  const B = Math.round((b + m) * 255);
  return (R << 16) | (G << 8) | B;
}
