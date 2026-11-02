import { assertEquals } from "https://deno.land/std@0.203.0/testing/asserts.ts";
import { advanceDrop, dropIntervalMs } from "./loop.ts";

Deno.test("dropIntervalMs speeds up with level and stops at 120ms", () => {
  assertEquals(dropIntervalMs(1), 700);
  assertEquals(dropIntervalMs(2), 650);
  assertEquals(dropIntervalMs(13), 120);
  assertEquals(dropIntervalMs(100), 120);
});

Deno.test("advanceDrop runs no tick before the interval elapses", () => {
  assertEquals(advanceDrop(0, 16, 700), { ticks: 0, remainderMs: 16 });
});

Deno.test("advanceDrop runs one tick and keeps the remainder", () => {
  assertEquals(advanceDrop(690, 16, 700), { ticks: 1, remainderMs: 6 });
});

Deno.test("advanceDrop discards excess backlog beyond the tick cap", () => {
  assertEquals(advanceDrop(0, 600_000, 120), { ticks: 10, remainderMs: 0 });
});

Deno.test("advanceDrop respects the tick cap on ordinary frames and keeps sub-interval remainder", () => {
  assertEquals(advanceDrop(0, 1000, 120, 3), { ticks: 3, remainderMs: 40 });
});
