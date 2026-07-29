// tests/logic_test.ts
import { assertEquals, assertThrows } from "https://deno.land/std@0.224.0/testing/asserts.ts";
import { evalThreeTokenExpr, sumAllExpressions } from "../src/logic.ts";

Deno.test("evalThreeTokenExpr - addition", () => {
  assertEquals(evalThreeTokenExpr(["3", "+", "5"]), 8);
});

Deno.test("evalThreeTokenExpr - subtraction (negative result)", () => {
  assertEquals(evalThreeTokenExpr(["3", "-", "7"]), -4);
});

Deno.test("evalThreeTokenExpr - multiplication", () => {
  assertEquals(evalThreeTokenExpr(["2", "*", "4"]), 8);
});

Deno.test("evalThreeTokenExpr - integer division truncates", () => {
  assertEquals(evalThreeTokenExpr(["7", "/", "2"]), 3);
});

Deno.test("evalThreeTokenExpr - unsupported operator throws", () => {
  assertThrows(() => evalThreeTokenExpr(["1", "^", "2"]), Error);
});

Deno.test("sumAllExpressions - multiple matches", () => {
  const tokens = ["1", "+", "2", "3", "*", "4", "5", "-", "6"];
  // matches: 1+2 = 3, 3*4 = 12, 5-6 = -1 => sum = 14
  assertEquals(sumAllExpressions(tokens), 14);
});

Deno.test("sumAllExpressions - overlapping groups are skipped", () => {
  const tokens = ["1", "+", "2", "+", "3", "*", "4"];
  // first group 1+2 = 3, then skip next two tokens, next possible start is index 3 -> "+", "3", "*" not a match, so total = 3
  assertEquals(sumAllExpressions(tokens), 3);
});
