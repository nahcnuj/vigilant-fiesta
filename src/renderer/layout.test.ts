import { assertEquals } from "https://deno.land/std@0.203.0/testing/asserts.ts";
import {
  blockHue,
  blockLabel,
  canvasCellSize,
  nextPreview,
  paintList,
} from "./layout.ts";
import { FallingPair, num, op } from "../piece.ts";

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

Deno.test("数字は青系・演算子は赤系（オリジナル2色）", () => {
  assertEquals(blockHue(num(1)), 230);
  assertEquals(blockHue(num(5)), 230);
  assertEquals(blockHue(op("+")), 5);
  assertEquals(blockHue(op("*")), 5);
});

Deno.test("blockLabel は数字と全演算子の表示文字", () => {
  assertEquals(blockLabel(num(7)), "7");
  assertEquals(blockLabel(op("+")), "+");
  assertEquals(blockLabel(op("-")), "−");
  assertEquals(blockLabel(op("*")), "×");
  assertEquals(blockLabel(op("/")), "÷");
});

Deno.test("paintList は置いてあるセルだけを矩形にする", () => {
  const grid = [
    [num(1), null],
    [null, op("*")],
  ];
  assertEquals(paintList(grid, 10), [
    { x: 0, y: 0, w: 9, h: 9, hue: 230, label: "1" },
    { x: 10, y: 10, w: 9, h: 9, hue: 5, label: "×" },
  ]);
});

Deno.test("paintList は落下中セルを含め、y<0 は除く", () => {
  assertEquals(
    paintList([[null, null]], 10, [
      { x: 1, y: 0, block: num(3) },
      { x: 0, y: -1, block: op("+") },
    ]),
    [{ x: 10, y: 0, w: 9, h: 9, hue: 230, label: "3" }],
  );
});

Deno.test("nextPreview は次ペア専用（pivot/secondary の表示情報）", () => {
  const pair = new FallingPair(num(2), op("+"));
  assertEquals(nextPreview(pair), {
    pivot: { label: "2", hue: 230 },
    secondary: { label: "+", hue: 5 },
  });
});
