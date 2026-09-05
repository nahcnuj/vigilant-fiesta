/**
 * Input package: map any device to GameAction, then to Game.
 */
export type { GameAction } from "./action.ts";

export type { ActionHandler } from "./controller.ts";
export { createGameController } from "./controller.ts";

export type { InputSource } from "./source.ts";
export { attachSources } from "./source.ts";

export {
  createKeyboardSource,
  DEFAULT_KEY_MAP,
  type KeyboardSourceOptions,
} from "./keyboard.ts";

export {
  createTouchPadSource,
  type TouchPadOptions,
} from "./touch.ts";

import type { Game } from "../game.ts";
import { createGameController } from "./controller.ts";
import { createKeyboardSource } from "./keyboard.ts";
import { createTouchPadSource } from "./touch.ts";
import { attachSources } from "./source.ts";

/** Keyboard + board gestures → Game. Returns detach. */
export function setupInput(game: Game): () => void {
  return attachSources(createGameController(game), [
    createKeyboardSource(),
    createTouchPadSource(),
  ]);
}
