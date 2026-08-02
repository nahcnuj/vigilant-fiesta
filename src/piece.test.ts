import { assertEquals } from "https://deno.land/std@0.203.0/testing/asserts.ts";
import { Piece } from "./piece.ts";

Deno.test("時計回りに4回回すと元の形に戻る", () => {
  const piece = new Piece("L");
  const original = piece.shape;
  piece.rotateCW();
  assertEquals(piece.shape, [
    [1, 1, 1],
    [1, 0, 0],
    [0, 0, 0],
  ]);
  piece.rotateCW();
  piece.rotateCW();
  piece.rotateCW();
  assertEquals(piece.shape, original);
});

Deno.test("反時計回りに4回回すと元の形に戻る", () => {
  const piece = new Piece("J");
  const original = piece.shape;
  piece.rotateCCW();
  assertEquals(piece.shape, [
    [0, 0, 1],
    [1, 1, 1],
    [0, 0, 0],
  ]);
  piece.rotateCCW();
  piece.rotateCCW();
  piece.rotateCCW();
  assertEquals(piece.shape, original);
});
