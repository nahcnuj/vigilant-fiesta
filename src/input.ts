// src/input.ts

/** Simple keyboard input handler that forwards key events to the Game instance. */
export function setupInput(game: any) {
  document.addEventListener("keydown", (e) => {
    switch (e.key) {
      case "ArrowLeft":
        game.moveLeft();
        break;
      case "ArrowRight":
        game.moveRight();
        break;
      case "ArrowDown":
        game.moveDown();
        break;
      case "ArrowUp":
        game.rotateCW();
        break;
      case " " /* space */:
        // hard drop – move piece down until it collides
        while (game.tryMove(0, 1)) {}
        break;
    }
  });
}
