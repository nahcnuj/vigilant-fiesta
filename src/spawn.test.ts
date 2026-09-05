import { assertEquals } from "https://deno.land/std@0.203.0/testing/asserts.ts";
import { spawnColumn } from "./spawn.ts";

Deno.test("spawnColumn is field center", () => {
  assertEquals(spawnColumn(8), 4);
  assertEquals(spawnColumn(4), 2);
  assertEquals(spawnColumn(5), 2);
});
