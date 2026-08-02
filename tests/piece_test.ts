import { assertEquals } from "https://deno.land/std@0.203.0/testing/asserts.ts";
import {
  Piece,
  rotateClockwise,
  rotateCounterClockwise,
} from "../src/piece.ts";

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

Deno.test("rotateClockwise matrix helper", () => {
  const m = [
    [1, 2],
    [3, 4],
    [5, 6],
  ];
  assertEquals(rotateClockwise(m), [
    [5, 3, 1],
    [6, 4, 2],
  ]);
});

Deno.test("rotateCounterClockwise matrix helper", () => {
  const m = [
    [1, 2, 3],
    [4, 5, 6],
  ];
  assertEquals(rotateCounterClockwise(m), [
    [3, 6],
    [2, 5],
    [1, 4],
  ]);
  // four CCW rotations restore original
  let r = m;
  for (let i = 0; i < 4; i++) r = rotateCounterClockwise(r);
  assertEquals(r, m);
});

Deno.test("Piece shape setter replaces current rotation", () => {
  const piece = new Piece("O");
  piece.shape = [[1, 0], [0, 1]];
  assertEquals(piece.shape, [[1, 0], [0, 1]]);
});
