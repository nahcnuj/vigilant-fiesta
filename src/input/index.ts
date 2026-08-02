/**
 * Input package: map any device to {@link GameAction}, then to {@link Game}.
 *
 * ```
 * createKeyboardSource  ─┐
 * (other InputSources)  ─┼→ ActionHandler (createGameController)
 *                       ─┘
 * ```
 */
export type { GameAction } from "./action.ts";
export { ALL_GAME_ACTIONS, GAME_ACTION_LABELS } from "./action.ts";

export type { ActionHandler } from "./controller.ts";
export { createGameController } from "./controller.ts";

export type { InputSource } from "./source.ts";
export { attachSources } from "./source.ts";

export {
  createKeyboardSource,
  DEFAULT_KEY_MAP,
  type KeyboardSourceOptions,
} from "./keyboard.ts";

import type { Game } from "../game.ts";
import { createGameController } from "./controller.ts";
import { createKeyboardSource } from "./keyboard.ts";
import { attachSources } from "./source.ts";

/** Wire the default desktop input (keyboard) to a Game. Returns detach. */
export function setupInput(game: Game): () => void {
  return attachSources(createGameController(game), [
    createKeyboardSource(),
  ]);
}
