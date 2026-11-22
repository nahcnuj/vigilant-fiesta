import { assertEquals } from "https://deno.land/std@0.203.0/testing/asserts.ts";
import { createPixiApplication } from "./renderer.ts";

Deno.test("createPixiApplication uses auto-detected renderer when construction succeeds", () => {
  const sentinel = { kind: "auto" };
  const calls: Array<Record<string, unknown>> = [];
  const result = createPixiApplication({ width: 10, height: 20 }, (options) => {
    calls.push(options);
    return sentinel;
  });
  assertEquals(result, sentinel);
  assertEquals(calls.length, 1);
  assertEquals(Object.prototype.hasOwnProperty.call(calls[0], "forceCanvas"), false);
});

Deno.test("createPixiApplication falls back to canvas renderer when auto-detect throws", () => {
  const sentinel = { kind: "canvas" };
  const calls: Array<Record<string, unknown>> = [];
  const result = createPixiApplication({ width: 10, height: 20 }, (options) => {
    calls.push(options);
    if (calls.length === 1) {
      throw new Error("Unable to auto-detect a suitable renderer.");
    }
    return sentinel;
  });
  assertEquals(result, sentinel);
  assertEquals(calls.length, 2);
  assertEquals(calls[1].forceCanvas, true);
});

Deno.test("renderer.ts prefers pixi.js-legacy and guards auto-detect with try/catch", async () => {
  const text = await Deno.readTextFile(new URL("./renderer.ts", import.meta.url));
  assertEquals(/pixi\.js-legacy/.test(text), true);
  assertEquals(/try\s*\{/.test(text), true);
  assertEquals(/forceCanvas:\s*true/.test(text), true);
  assertEquals(/as any/.test(text), false);
});
