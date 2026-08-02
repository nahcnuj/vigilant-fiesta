import type { Game } from "../game.ts";
import type { GameAction } from "./action.ts";

/** Applies a {@link GameAction} to the play session. */
export type ActionHandler = (action: GameAction) => void;

/** Bind Game public methods to the action vocabulary. */
export function createGameController(game: Game): ActionHandler {
  return (action) => {
    if (game.isGameOver) return;
    switch (action) {
      case "moveLeft":
        game.moveLeft();
        break;
      case "moveRight":
        game.moveRight();
        break;
      case "rotateCW":
        game.rotateCW();
        break;
      case "hardDrop":
        game.hardDrop();
        break;
    }
  };
}
