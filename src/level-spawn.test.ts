import { assertEquals } from "https://deno.land/std@0.203.0/testing/asserts.ts";
import { designForLevel } from "./level-design.ts";
import { randomPair } from "./piece.ts";

function sequence(values: number[]): () => number {
  let index = 0;
  return () => values[Math.min(index++, values.length - 1)];
}

Deno.test("レベル0〜5のペアは数字と記号の組み合わせになる", () => {
  for (let level = 0; level <= 5; level++) {
    const design = designForLevel(level);
    for (const first of [0.25, 0.75]) {
      const pair = randomPair(sequence([first, 0.4, 0.4]), design);
      const kinds = [pair.pivot.kind, pair.secondary.kind].sort();
      assertEquals(kinds, ["num", "op"]);
    }
  }
});

Deno.test("レベル6以降のペアは同種ブロックに偏る", () => {
  const design = designForLevel(6);

  const numberPair = randomPair(sequence([0.25, 0.4, 0.4]), design);
  assertEquals(
    [numberPair.pivot.kind, numberPair.secondary.kind],
    ["num", "num"],
  );

  const operatorPair = randomPair(sequence([0.75, 0.4, 0.4]), design);
  assertEquals(
    [operatorPair.pivot.kind, operatorPair.secondary.kind],
    ["op", "op"],
  );
});
