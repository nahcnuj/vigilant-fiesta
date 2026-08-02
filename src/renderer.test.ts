import { assertEquals } from "https://deno.land/std@0.203.0/testing/asserts.ts";
import { blockHue, canvasCellSize, paintList } from "./render_layout.ts";
import { num, op } from "./piece.ts";

Deno.test("盤面サイズからセル一辺が max 内に収まる", () => {
  const size = canvasCellSize(8, 10, 320, 400);
  assertEquals(size, Math.min(320 / 8, 400 / 10));
  assertEquals(size * 8 <= 320, true);
  assertEquals(size * 10 <= 400, true);
});

Deno.test("数字と演算子で色相が分かれる", () => {
  assertEquals(blockHue(num(0)), 0);
  assertEquals(blockHue(num(5)), 180);
  assertEquals(blockHue(op("+")), 200);
});

Deno.test("paintList は非 null セルだけ矩形リストにする", () => {
  const grid = [
    [num(1), null],
    [null, op("*")],
  ];
  const rects = paintList(grid, 10);
  assertEquals(rects.length, 2);
  assertEquals(rects[0], { x: 0, y: 0, w: 9, h: 9, hue: 36 });
  assertEquals(rects[1], { x: 10, y: 10, w: 9, h: 9, hue: 200 });
});
