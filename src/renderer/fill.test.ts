import { assertEquals } from "https://deno.land/std@0.203.0/testing/asserts.ts";
import {
  blockFillCss,
  FILL_LIGHTNESS,
  FILL_SATURATION,
  hslToRgbInt,
} from "./fill.ts";

Deno.test("blockFillCss uses shared saturation and lightness", () => {
  assertEquals(
    blockFillCss(230),
    `hsl(230 ${FILL_SATURATION}% ${FILL_LIGHTNESS}%)`,
  );
});

Deno.test("hslToRgbInt maps known hues to stable RGB ints", () => {
  // Pure red-ish at hue 0, s=100, l=50 → 0xff0000
  assertEquals(hslToRgbInt(0, 100, 50), 0xff0000);
  // Pure blue at hue 240
  assertEquals(hslToRgbInt(240, 100, 50), 0x0000ff);
});
