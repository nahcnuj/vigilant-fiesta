import { assertEquals } from "https://deno.land/std@0.203.0/testing/asserts.ts";
import { Piece, Tetrominos } from "../src/piece.ts";

Deno.test("Piece rotation clockwise", () => {
  const piece = new Piece("L");
  const original = piece.shape;
  piece.rotateCW();
  // expected rotation of L shape
  const expected = [
    [1, 1, 1],
    [1, 0, 0],
    [0, 0, 0],
  ];
  assertEquals(piece.shape, expected);
  // rotating three more times should return to original
  piece.rotateCW();
  piece.rotateCW();
  piece.rotateCW();
  assertEquals(piece.shape, original);
});

Deno.test("Piece rotation counter‑clockwise", () => {
  const piece = new Piece("J");
  const original = piece.shape;
  piece.rotateCCW();
  const expected = [
    [0, 0, 1],
    [1, 1, 1],
    [0, 0, 0],
  ];
  assertEquals(piece.shape, expected);
  // back to original after 4 CCW rotations
  piece.rotateCCW();
  piece.rotateCCW();
  piece.rotateCCW();
  assertEquals(piece.shape, original);
});
