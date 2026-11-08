import { Game, type GameOptions } from "./game.ts";
import { Renderer } from "./renderer/index.ts";
import type { GameAction } from "./input/action.ts";
import { createGameController } from "./input/controller.ts";
import { createKeyboardSource } from "./input/keyboard.ts";
import { createTouchPadSource } from "./input/touch.ts";
import { attachSources } from "./input/source.ts";
import {
  OperationGuide,
  isFirstPlay,
  markGuideCompleted,
  isTouchDevice,
} from "./guide.ts";
import { blockHue, blockLabel, nextPreview } from "./renderer/layout.ts";
import { blockFillCss } from "./renderer/fill.ts";
import { audio } from "./audio.ts";
import { isE2e } from "./e2e.ts";
import { createAdWaiter, requestAdsIn } from "./ads.ts";
import { sendPlayEvent, sendXEvent } from "./analytics.ts";
import { initControlsCarousel } from "./controls-carousel.ts";
import { renderShareButtons } from "./social-share.ts";
import { type Block, num, op } from "./piece.ts";
import { advanceDrop, dropIntervalMs } from "./loop.ts";

const WIDTH = 8;
const HEIGHT = 10;

const DEFAULT_PAGE_TITLE = "Mathch-Three";

type ScreenId = "title" | "playing";

const screens = {
  title: document.getElementById("screen-title")!,
  playing: document.getElementById("screen-playing")!,
};

const scoreEl = document.getElementById("score")!;
const levelEl = document.getElementById("level")!;
const resultScoreEl = document.getElementById("result-score")!;
const resultBoardImg = document.getElementById("result-board") as
  | HTMLImageElement
  | null;
const resultOverlay = document.getElementById("result-overlay")!;
const nextPivotEl = document.getElementById("next-pivot")!;
const nextSecondaryEl = document.getElementById("next-secondary")!;
const btnStart = document.getElementById("btn-start")!;
const btnRetry = document.getElementById("btn-retry") as HTMLButtonElement;
const adTitle = document.getElementById("ad-title");
const adResult = document.getElementById("ad-result");
const adSideLeft = document.getElementById("ad-side-left");
const adSideRight = document.getElementById("ad-side-right");

const adWaiter = createAdWaiter();

let game: Game | null = null;
let renderer: Renderer | null = null;
let detachInput: (() => void) | null = null;
let tickerFn: (() => void) | null = null;
let dropAccMs = 0;

function blockFill(block: Block): string {
  return blockFillCss(blockHue(block));
}

function paintRuleExample(): void {
  const root = document.querySelector("[data-rule-example]");
  if (!root) return;
  for (const el of root.querySelectorAll<HTMLElement>(".rule-cell")) {
    const kind = el.dataset.kind;
    const raw = el.dataset.value;
    if (!kind || raw === undefined) continue;
    const block: Block = kind === "num"
      ? num(Number(raw))
      : op(raw as "+" | "-" | "*" | "/");
    el.textContent = blockLabel(block);
    el.style.background = blockFill(block);
  }
}

function e2eRng(): number {
  return 0.5;
}

function gameOptionsFromUrl(): GameOptions {
  if (isE2e()) return { rng: e2eRng };
  return {};
}

function showScreen(id: ScreenId): void {
  for (const [key, el] of Object.entries(screens)) {
    const active = key === id;
    el.hidden = !active;
    el.classList.toggle("hidden", !active);
  }
}

function setResultOverlayVisible(visible: boolean): void {
  resultOverlay.hidden = !visible;
  resultOverlay.classList.toggle("hidden", !visible);
}

function updateHud(): void {
  if (!game) return;
  scoreEl.textContent = `Score: ${game.score}`;
  levelEl.textContent = `Level: ${game.level}`;
  const preview = nextPreview(game.next);
  nextPivotEl.textContent = preview.pivot.label;
  nextPivotEl.style.background = blockFill(game.next.pivot);
  nextSecondaryEl.textContent = preview.secondary.label;
  nextSecondaryEl.style.background = blockFill(game.next.secondary);
}

function activeCells() {
  if (!game || game.isGameOver) return [];
  return game.current.blocksAt(game.position.x, game.position.y);
}

function paint(): void {
  if (!game || !renderer) return;
  renderer.render(game, activeCells());
  updateHud();
}

function stopPlayLoop(): void {
  if (detachInput) {
    detachInput();
    detachInput = null;
  }
  if (renderer && tickerFn) {
    renderer.removeTicker(tickerFn);
    tickerFn = null;
  }
  dropAccMs = 0;
}

function resetGame(): void {
  game = null;
}

async function startPlay(): Promise<void> {
  await audio.unlock();
  audio.playSe("ui");
  sendPlayEvent();

  document.title = DEFAULT_PAGE_TITLE;
  adWaiter.cancelPending();
  btnRetry.disabled = true;
  setResultOverlayVisible(false);
  stopPlayLoop();
  resetGame();

  showScreen("playing");
  if (!renderer) {
    renderer = new Renderer(WIDTH, HEIGHT);
    renderer.attachTo("game-container");
  }
  game = new Game(WIDTH, HEIGHT, {
    ...gameOptionsFromUrl(),
    onEvent: (ev) => {
      switch (ev.type) {
        case "moved":
          audio.playSe("move");
          break;
        case "rotated":
          audio.playSe("rotate");
          break;
        case "locked":
          audio.playSe("drop");
          break;
        case "cleared":
          audio.playSe("clear");
          break;
        case "levelup":
          audio.playSe("levelup");
          break;
        case "gameover":
          audio.playSe("gameover");
          break;
      }
    },
  });
  const guideMode = isFirstPlay();
  const baseGuideRoot = document.getElementById("guide-overlay");
  const guideRoots: HTMLElement[] = baseGuideRoot ? [baseGuideRoot] : [];

  const controller = createGameController(game);
  let guide: OperationGuide | null = null;
  if (guideMode && guideRoots.length > 0) {
    guide = new OperationGuide(guideRoots, { touch: isTouchDevice() });
  }

  const handleAction = (action: GameAction) => {
    if (guide && !guide.isComplete) {
      guide.advanceOn(action);
    }
    controller(action);
    paint();
    if (guide && guide.isComplete) {
      guide.hide();
      markGuideCompleted();
      guide = null;
      if (game && !game.isGameOver && !tickerFn && renderer) {
        dropAccMs = 0;
        tickerFn = makeTicker();
        renderer.addTicker(tickerFn);
      }
    }
    if (game?.isGameOver) {
      if (guide) {
        guide.hide();
        guide = null;
      }
      endPlay();
    }
  };

  detachInput = attachSources(handleAction, [
    createKeyboardSource(),
    createTouchPadSource(),
  ]);
  dropAccMs = 0;
  paint();

  if (game.isGameOver) {
    endPlay();
    return;
  }

  audio.startBgm();
  if (guide) {
    guide.show();
  } else {
    tickerFn = makeTicker();
    renderer.addTicker(tickerFn);
  }
}

function makeTicker(): () => void {
  return () => {
    if (!game || !renderer) return;
    if (game.isGameOver) {
      endPlay();
      return;
    }
    const advance = advanceDrop(
      dropAccMs,
      renderer.deltaMS,
      dropIntervalMs(game.level),
    );
    dropAccMs = advance.remainderMs;
    for (let i = 0; i < advance.ticks; i++) {
      game.tick();
      if (game.isGameOver) break;
    }
    paint();
    if (game.isGameOver) endPlay();
  };
}

function endPlay(): void {
  audio.stopBgm();
  const finalScore = game?.score ?? 0;
  // Hide any lingering guide overlay.
  const guideEl = document.getElementById("guide-overlay");
  if (guideEl) {
    guideEl.hidden = true;
    guideEl.classList.add("hidden");
  }
  stopPlayLoop();
  sendXEvent(finalScore);
  if (game && renderer) {
    renderer.render(game, []);
    updateHud();
  }
  const thumb = renderer?.snapshotDataURL(160) ?? null;
  if (resultBoardImg) {
    if (thumb) {
      resultBoardImg.src = thumb;
      resultBoardImg.hidden = false;
    } else {
      resultBoardImg.removeAttribute("src");
      resultBoardImg.hidden = true;
    }
  }
  const shareUrl = location.href;
  resultScoreEl.textContent = `Score: ${finalScore}`;
  const shareContainer = document.getElementById("share-buttons");
  if (shareContainer) {
    renderShareButtons(shareContainer, {
      score: finalScore,
      url: shareUrl,
      imageDataUrl: thumb,
    });
  }
  document.title = `Score: ${finalScore} | ${DEFAULT_PAGE_TITLE}`;
  btnRetry.disabled = true;
  setResultOverlayVisible(true);

  requestAdsIn(adResult);
  adWaiter.waitForAdDisplayed(adResult, () => {
    btnRetry.disabled = false;
  });
}

paintRuleExample();
btnStart.addEventListener("click", () => void startPlay());
btnRetry.addEventListener("click", () => {
  if (btnRetry.disabled) return;
  void startPlay();
});

showScreen("title");
initControlsCarousel();
setResultOverlayVisible(false);
btnRetry.disabled = true;
requestAdsIn(adTitle);
requestAdsIn(adSideLeft);
requestAdsIn(adSideRight);

if ("serviceWorker" in navigator) {
  globalThis.addEventListener("load", () => {
    navigator.serviceWorker.register("sw.js").catch(() => {});
  });
}
