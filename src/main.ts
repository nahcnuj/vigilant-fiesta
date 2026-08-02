import { Game, type GameOptions } from "./game.ts";
import { Renderer } from "./renderer/index.ts";
import { setupInput } from "./input/index.ts";

const WIDTH = 8;
const HEIGHT = 10;

type ScreenId = "title" | "playing" | "result";

const screens = {
  title: document.getElementById("screen-title")!,
  playing: document.getElementById("screen-playing")!,
  result: document.getElementById("screen-result")!,
};

const scoreEl = document.getElementById("score")!;
const levelEl = document.getElementById("level")!;
const resultScoreEl = document.getElementById("result-score")!;
const btnStart = document.getElementById("btn-start")!;
const btnRetry = document.getElementById("btn-retry")!;

let game: Game | null = null;
let renderer: Renderer | null = null;
let detachInput: (() => void) | null = null;
let tickerFn: (() => void) | null = null;

/** Deterministic digits-only RNG for reliable E2E fill-to-game-over (`?e2e=1`). */
function e2eRng(): number {
  return 0.5;
}

function gameOptionsFromUrl(): GameOptions {
  const params = new URLSearchParams(globalThis.location?.search ?? "");
  if (params.get("e2e") === "1") {
    return { rng: e2eRng };
  }
  return {};
}

function showScreen(id: ScreenId): void {
  for (const [key, el] of Object.entries(screens)) {
    const active = key === id;
    el.hidden = !active;
    el.classList.toggle("hidden", !active);
  }
}

function updateHud(): void {
  if (!game) return;
  scoreEl.textContent = `Score: ${game.score}`;
  levelEl.textContent = `Level: ${game.level}`;
}

function teardownPlay(): void {
  if (detachInput) {
    detachInput();
    detachInput = null;
  }
  if (renderer && tickerFn) {
    renderer.app.ticker.remove(tickerFn);
    tickerFn = null;
  }
  if (renderer) {
    const view = renderer.app.view as HTMLElement | null;
    view?.parentElement?.removeChild(view);
    renderer.app.destroy(true);
    renderer = null;
  }
  game = null;
}

function startPlay(): void {
  teardownPlay();
  showScreen("playing");

  game = new Game(WIDTH, HEIGHT, gameOptionsFromUrl());
  renderer = new Renderer(WIDTH, HEIGHT);
  renderer.attachTo("game-container");
  detachInput = setupInput(game);
  updateHud();

  // Already over (e.g. tiny board) → result immediately
  if (game.isGameOver) {
    endPlay();
    return;
  }

  tickerFn = () => {
    if (!game || !renderer) return;
    if (game.isGameOver) {
      endPlay();
      return;
    }
    game.tick();
    renderer.render(game.board.getGrid());
    updateHud();
    if (game.isGameOver) {
      endPlay();
    }
  };
  renderer.app.ticker.add(tickerFn);
  renderer.render(game.board.getGrid());
}

function endPlay(): void {
  const finalScore = game?.score ?? 0;
  if (detachInput) {
    detachInput();
    detachInput = null;
  }
  if (renderer && tickerFn) {
    renderer.app.ticker.remove(tickerFn);
    tickerFn = null;
  }
  // Keep last frame visible under result? Prefer dedicated result screen.
  if (renderer) {
    const view = renderer.app.view as HTMLElement | null;
    view?.parentElement?.removeChild(view);
    renderer.app.destroy(true);
    renderer = null;
  }
  game = null;
  resultScoreEl.textContent = `Score: ${finalScore}`;
  showScreen("result");
}

btnStart.addEventListener("click", () => startPlay());
btnRetry.addEventListener("click", () => startPlay());

showScreen("title");
