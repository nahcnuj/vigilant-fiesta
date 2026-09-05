/**
 * Structural checks that shipped modules keep CLEAN boundaries.
 * These read source text of the modules under test (not re-implementations).
 */
import {
  assert,
  assertEquals,
} from "https://deno.land/std@0.203.0/testing/asserts.ts";
import { paintList } from "./renderer/layout.ts";
import { op } from "./piece.ts";
import { spawnColumn } from "./spawn.ts";
import { Game } from "./game.ts";
import { FallingPair, num } from "./piece.ts";

const src = async (rel: string) =>
  await Deno.readTextFile(new URL(rel, import.meta.url));

Deno.test("layout.ts does not import formula domain", async () => {
  const text = await src("./renderer/layout.ts");
  assertEquals(/from\s+["'].*formula/.test(text), false);
});

Deno.test("renderer.ts does not use Reflect or as any", async () => {
  const text = await src("./renderer/renderer.ts");
  assertEquals(/Reflect\./.test(text), false);
  assertEquals(/\bas any\b/.test(text), false);
});

Deno.test("main.ts does not inline AdSense/gtag/carousel implementations", async () => {
  const text = await src("./main.ts");
  assert(/from\s+["']\.\/ads\.ts["']/.test(text));
  assert(/from\s+["']\.\/analytics\.ts["']/.test(text));
  assert(/from\s+["']\.\/controls-carousel\.ts["']/.test(text));
  assertEquals(/function\s+requestAdsIn\b/.test(text), false);
  assertEquals(/function\s+initControlsCarousel\b/.test(text), false);
  assertEquals(/gtag\?/.test(text), false);
});

Deno.test("Game does not expose public board field", async () => {
  const text = await src("./game.ts");
  assert(/#board/.test(text));
  assertEquals(/\breadonly board\b/.test(text), false);
  const game = new Game(8, 10, {
    current: new FallingPair(num(1), num(2)),
    next: new FallingPair(num(3), num(4)),
  });
  assertEquals(
    Object.prototype.hasOwnProperty.call(game, "board"),
    false,
  );
  assertEquals(typeof game.seedBlocks, "function");
  assertEquals(typeof game.isDeadCell, "function");
});

Deno.test("paintList dead marking uses injected predicate (shipped path)", () => {
  const grid = [[op("+")]];
  const cells = paintList(grid, 8, [], (x, y) => x === 0 && y === 0);
  assertEquals(cells[0].dead, true);
  assertEquals(paintList(grid, 8)[0].dead, false);
});

Deno.test("Game and Renderer share spawnColumn helper", async () => {
  const gameSrc = await src("./game.ts");
  const rendererSrc = await src("./renderer/renderer.ts");
  assert(
    /from\s+["']\.\/spawn\.ts["']/.test(gameSrc) ||
      /from\s+["']\.\.\/spawn\.ts["']/.test(gameSrc),
  );
  assert(/from\s+["']\.\.\/spawn\.ts["']/.test(rendererSrc));
  assertEquals(spawnColumn(8), 4);
});
