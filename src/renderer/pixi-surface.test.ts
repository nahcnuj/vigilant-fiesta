import { assertEquals } from "https://deno.land/std@0.203.0/testing/asserts.ts";
import { appTicker, setLineStyle, setXy } from "./pixi-surface.ts";

Deno.test("appTicker reads ticker from host object", () => {
  const calls: string[] = [];
  const ticker = {
    add(fn: () => void) {
      calls.push("add");
      fn();
    },
    remove(_fn: () => void) {
      calls.push("remove");
    },
    deltaMS: 16.5,
  };
  const host = { ticker };
  assertEquals(appTicker(host).deltaMS, 16.5);
  appTicker(host).add(() => calls.push("tick"));
  appTicker(host).remove(() => {});
  assertEquals(calls, ["add", "tick", "remove"]);
});

Deno.test("setLineStyle and setXy write through typed surface", () => {
  const g = {
    last: null as null | [number, number, number],
    lineStyle(w: number, c: number, a?: number) {
      this.last = [w, c, a ?? 1];
    },
  };
  setLineStyle(g, 2, 0xff0000, 0.5);
  assertEquals(g.last, [2, 0xff0000, 0.5]);

  const t = { x: 0, y: 0 };
  setXy(t, 12, 34);
  assertEquals(t, { x: 12, y: 34 });
});
