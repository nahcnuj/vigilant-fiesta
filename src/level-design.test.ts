import { assertEquals } from "https://deno.land/std@0.203.0/testing/asserts.ts";
import {
  designForLevel,
  designForScore,
  LEVEL_DESIGNS,
  levelForScore,
} from "./level-design.ts";
import { op } from "./piece.ts";

Deno.test("designForScore はスコア帯ごとにレベルデザインを返す", () => {
  assertEquals(designForScore(0), LEVEL_DESIGNS[0]);
  assertEquals(designForScore(1), LEVEL_DESIGNS[1]);
  assertEquals(designForScore(9), LEVEL_DESIGNS[1]);
  assertEquals(designForScore(10), LEVEL_DESIGNS[2]);
  assertEquals(designForScore(49), LEVEL_DESIGNS[2]);
  assertEquals(designForScore(50), LEVEL_DESIGNS[3]);
  assertEquals(designForScore(249), LEVEL_DESIGNS[3]);
  assertEquals(designForScore(250), LEVEL_DESIGNS[4]);
  assertEquals(designForScore(999), LEVEL_DESIGNS[4]);
  assertEquals(designForScore(1_000), LEVEL_DESIGNS[5]);
  assertEquals(designForScore(4_999), LEVEL_DESIGNS[5]);
  assertEquals(designForScore(5_000), LEVEL_DESIGNS[6]);
  assertEquals(designForScore(9_999), LEVEL_DESIGNS[6]);
  assertEquals(designForScore(10_000), designForLevel(7));
  assertEquals(designForScore(99_999), designForLevel(7));
  assertEquals(designForScore(100_000), designForLevel(8));
});

Deno.test("designForLevel は7番以降でスコア桁数に応じてレベルアップする", () => {
  const level7 = designForLevel(7);
  assertEquals(level7.level, 7);
  assertEquals(level7.scoreThreshold, 10_000);
  assertEquals(level7.distribution, "biased");
  assertEquals(level7.forcedGameOver.negativeScore, true);
  assertEquals(level7.forcedGameOver.divisionByZero, true);

  const level8 = designForLevel(8);
  assertEquals(level8.level, 8);
  assertEquals(level8.scoreThreshold, 100_000);
  assertEquals(level8.distribution, "biased");
});

Deno.test("levelForScore は設計レベルを返す", () => {
  assertEquals(levelForScore(0), 0);
  assertEquals(levelForScore(10), 2);
  assertEquals(levelForScore(250), 4);
  assertEquals(levelForScore(1_000), 5);
  assertEquals(levelForScore(5_000), 6);
  assertEquals(levelForScore(10_000), 7);
});

Deno.test("各レベル設計のブロックと強制終了条件を検証する", () => {
  assertEquals(LEVEL_DESIGNS[0].digits, [1, 2, 3, 4, 5, 6, 7, 8, 9]);
  assertEquals(LEVEL_DESIGNS[0].operators, ["+"]);
  assertEquals(LEVEL_DESIGNS[0].distribution, "mixed");
  assertEquals(LEVEL_DESIGNS[0].forcedGameOver.negativeScore, false);
  assertEquals(LEVEL_DESIGNS[0].forcedGameOver.divisionByZero, false);

  assertEquals(LEVEL_DESIGNS[1].digits, [1, 2, 3, 4, 5, 6, 7, 8, 9]);
  assertEquals(LEVEL_DESIGNS[1].operators, ["+"]);
  assertEquals(LEVEL_DESIGNS[1].distribution, "mixed");
  assertEquals(LEVEL_DESIGNS[1].forcedGameOver.negativeScore, false);
  assertEquals(LEVEL_DESIGNS[1].forcedGameOver.divisionByZero, false);

  assertEquals(LEVEL_DESIGNS[2].digits, [1, 2, 3, 4, 5, 6, 7, 8, 9]);
  assertEquals(LEVEL_DESIGNS[2].operators, ["+", "-"]);
  assertEquals(LEVEL_DESIGNS[2].distribution, "mixed");
  assertEquals(LEVEL_DESIGNS[2].forcedGameOver.negativeScore, true);
  assertEquals(LEVEL_DESIGNS[2].forcedGameOver.divisionByZero, false);

  assertEquals(LEVEL_DESIGNS[3].digits, [1, 2, 3, 4, 5, 6, 7, 8, 9]);
  assertEquals(LEVEL_DESIGNS[3].operators, ["+", "-", "*"]);
  assertEquals(LEVEL_DESIGNS[3].distribution, "mixed");
  assertEquals(LEVEL_DESIGNS[3].forcedGameOver.negativeScore, true);
  assertEquals(LEVEL_DESIGNS[3].forcedGameOver.divisionByZero, false);

  assertEquals(LEVEL_DESIGNS[4].digits, [1, 2, 3, 4, 5, 6, 7, 8, 9]);
  assertEquals(LEVEL_DESIGNS[4].operators, ["+", "-", "*", "/"]);
  assertEquals(LEVEL_DESIGNS[4].distribution, "mixed");
  assertEquals(LEVEL_DESIGNS[4].forcedGameOver.negativeScore, true);
  assertEquals(LEVEL_DESIGNS[4].forcedGameOver.divisionByZero, false);

  assertEquals(LEVEL_DESIGNS[5].digits, [0, 1, 2, 3, 4, 5, 6, 7, 8, 9]);
  assertEquals(LEVEL_DESIGNS[5].operators, ["+", "-", "*", "/"]);
  assertEquals(LEVEL_DESIGNS[5].distribution, "mixed");
  assertEquals(LEVEL_DESIGNS[5].forcedGameOver.negativeScore, true);
  assertEquals(LEVEL_DESIGNS[5].forcedGameOver.divisionByZero, true);

  assertEquals(LEVEL_DESIGNS[6].digits, [0, 1, 2, 3, 4, 5, 6, 7, 8, 9]);
  assertEquals(LEVEL_DESIGNS[6].operators, ["+", "-", "*", "/"]);
  assertEquals(LEVEL_DESIGNS[6].distribution, "biased");
  assertEquals(LEVEL_DESIGNS[6].forcedGameOver.negativeScore, true);
  assertEquals(LEVEL_DESIGNS[6].forcedGameOver.divisionByZero, true);
});
