import type { Game } from "./game.ts";

/**
 * Keyboard map from requirements 3.3:
 * ← → move, ↓ rotate CW, ↑ hard drop
 */
export function setupInput(game: Game): void {
  document.addEventListener("keydown", (e) => {
    switch (e.key) {
      case "ArrowLeft":
        game.moveLeft();
        break;
      case "ArrowRight":
        game.moveRight();
        break;
      case "ArrowDown":
        game.rotateCW();
        break;
      case "ArrowUp":
        game.hardDrop();
        break;
    }
  });
}
