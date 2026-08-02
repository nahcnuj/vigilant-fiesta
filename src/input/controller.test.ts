import { assertEquals } from "https://deno.land/std@0.203.0/testing/asserts.ts";
import { Game } from "../game.ts";
import { FallingPair, num, op } from "../piece.ts";
import { createGameController } from "./controller.ts";
import type { GameAction } from "./action.ts";

Deno.test("createGameController は各 GameAction を Game に渡す", () => {
  const game = new Game(8, 10, {
    current: new FallingPair(num(1), num(2)),
    next: new FallingPair(num(3), op("+")),
  });
  const handle = createGameController(game);
  const x0 = game.position.x;

  handle("moveRight");
  assertEquals(game.position.x, x0 + 1);
  handle("moveLeft");
  assertEquals(game.position.x, x0);
  handle("rotateCW");
  assertEquals(game.current.orientation, 1);
  handle("hardDrop");
  assertEquals(game.current.pivot, num(3)); // next became current after lock
});

Deno.test("ゲームオーバー中は Action を無視する", () => {
  const game = new Game(8, 1, {
    current: new FallingPair(num(1), num(2)),
    next: new FallingPair(num(3), num(4)),
  });
  assertEquals(game.isGameOver, true);
  const handle = createGameController(game);
  const actions: GameAction[] = [
    "moveLeft",
    "moveRight",
    "rotateCW",
    "hardDrop",
  ];
  for (const a of actions) handle(a);
  assertEquals(game.score, 0);
});
