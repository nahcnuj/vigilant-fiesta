// src/main.ts

import { Game } from "./game.ts";
import { Renderer } from "./renderer.ts";
import { setupInput } from "./input.ts";

const WIDTH = 10;
const HEIGHT = 20;

const game = new Game(WIDTH, HEIGHT);
const renderer = new Renderer(WIDTH, HEIGHT);

// Attach renderer to DOM (assumes index.html has <div id="game-container"></div>)
renderer.attachTo("game-container");

// Hook Pixi ticker to game loop
renderer.app.ticker.add(() => {
  if (!game.isGameOver) {
    game.tick();
    renderer.render(game.board.getGrid());
    // Update UI overlay if present (score, level) – simple example
    const scoreEl = document.getElementById("score");
    const levelEl = document.getElementById("level");
    if (scoreEl) scoreEl.textContent = `Score: ${game.score}`;
    if (levelEl) levelEl.textContent = `Level: ${game.level}`;
  }
});

// Setup keyboard input
setupInput(game);
