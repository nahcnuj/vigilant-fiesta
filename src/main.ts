import { Game } from "./game.ts";
import { Renderer } from "./renderer/index.ts";
import { setupInput } from "./input/index.ts";

// requirements: 8 columns × 10 rows
const WIDTH = 8;
const HEIGHT = 10;

const game = new Game(WIDTH, HEIGHT);
const renderer = new Renderer(WIDTH, HEIGHT);

renderer.attachTo("game-container");

renderer.app.ticker.add(() => {
  if (!game.isGameOver) {
    game.tick();
    renderer.render(game.board.getGrid());
    const scoreEl = document.getElementById("score");
    const levelEl = document.getElementById("level");
    if (scoreEl) scoreEl.textContent = `Score: ${game.score}`;
    if (levelEl) levelEl.textContent = `Level: ${game.level}`;
  }
});

setupInput(game);
