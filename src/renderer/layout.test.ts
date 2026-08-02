import { assertEquals } from "https://deno.land/std@0.203.0/testing/asserts.ts";
import { blockHue, canvasCellSize, paintList } from "./layout.ts";
import { num, op } from "../piece.ts";

Deno.test("セル一辺は max 幅・高さの制約内に収まる", () => {
  const size = canvasCellSize(8, 10, 320, 400);
  assertEquals(size, 40);
  assertEquals(size * 8, 320);
  assertEquals(size * 10, 400);
});

Deno.test("狭い方の制約がセル一辺を決める", () => {
  assertEquals(canvasCellSize(8, 10, 160, 400), 20);
  assertEquals(canvasCellSize(8, 10, 320, 200), 20);
});

Deno.test("数字は値に応じた色相、演算子は固定色相", () => {
  assertEquals(blockHue(num(0)), 0);
  assertEquals(blockHue(num(5)), 180);
  assertEquals(blockHue(op("+")), 200);
  assertEquals(blockHue(op("*")), 200);
});

Deno.test("paintList は置いてあるセルだけを矩形にする", () => {
  const grid = [
    [num(1), null],
    [null, op("*")],
  ];
  const rects = paintList(grid, 10);
  assertEquals(rects, [
    { x: 0, y: 0, w: 9, h: 9, hue: 36 },
    { x: 10, y: 10, w: 9, h: 9, hue: 200 },
  ]);
});
