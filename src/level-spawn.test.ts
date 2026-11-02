import { assertEquals } from "https://deno.land/std@0.203.0/testing/asserts.ts";
import { designForLevel } from "./level-design.ts";
import { randomPair } from "./piece.ts";

function sequence(values: number[]): () => number {
  let index = 0;
  return () => values[Math.min(index++, values.length - 1)];
}

Deno.test("レベル0〜5のペアは数字2個または数字と記号の組み合わせになる", () => {
  for (let level = 0; level <= 5; level++) {
    const design = designForLevel(level);

    const numberPair = randomPair(sequence([0.1, 0.4, 0.4]), design);
    assertEquals(
      [numberPair.pivot.kind, numberPair.secondary.kind],
      ["num", "num"],
    );

    const mixedPair = randomPair(sequence([0.5, 0.4, 0.4, 0.4]), design);
    assertEquals(
      [mixedPair.pivot.kind, mixedPair.secondary.kind].sort(),
      ["num", "op"],
    );
  }
});

Deno.test("レベル0〜5は数字と記号が2:1の割合で出現する", () => {
  for (let level = 0; level <= 5; level++) {
    const design = designForLevel(level);
    let numbers = 0;
    let operators = 0;

    for (let i = 0; i < 300; i++) {
      const composition = i % 3 === 0 ? 0.1 : 0.5;
      const pair = randomPair(sequence([composition, 0.4, 0.4, 0.4]), design);
      for (const block of [pair.pivot, pair.secondary]) {
        if (block.kind === "num") numbers++;
        else operators++;
      }
    }

    assertEquals(numbers, 400);
    assertEquals(operators, 200);
    assertEquals(numbers, operators * 2);
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
