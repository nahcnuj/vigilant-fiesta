import { Game, type GameOptions } from "./game.ts";
import { Renderer } from "./renderer/index.ts";
import { setupInput } from "./input/index.ts";
import { blockHue, blockLabel, nextPreview } from "./renderer/layout.ts";
import { audio } from "./audio.ts";
import { isE2e } from "./e2e.ts";
import { type Block, num, op } from "./piece.ts";

const WIDTH = 8;
const HEIGHT = 10;

const DEFAULT_PAGE_TITLE = "落ち物パズルゲーム・蘇";

/** AdSense: enable retry after filled/unfilled or fallback timeout. */
const AD_WAIT_FALLBACK_MS = 4000;

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

let game: Game | null = null;
let renderer: Renderer | null = null;
let detachInput: (() => void) | null = null;
let tickerFn: (() => void) | null = null;
let dropAccMs = 0;

/** Same fill as board cells / Next (source: blockHue). */
function blockFill(block: Block): string {
  return `hsl(${blockHue(block)} 70% 45%)`;
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

let adWaitToken = 0;

function e2eRng(): number {
  return 0.5;
}

function gameOptionsFromUrl(): GameOptions {
  if (isE2e()) return { rng: e2eRng };
  return {};
}

function dropIntervalMs(level: number): number {
  return Math.max(120, 700 - (level - 1) * 50);
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
  renderer.render(game.board, activeCells());
  updateHud();
}

/** Push AdSense for ins elements that have not been requested yet. */
function requestAdsIn(container: Element | null): void {
  if (!container || isE2e()) return;
  const insList = container.querySelectorAll("ins.adsbygoogle");
  const w = globalThis as unknown as {
    adsbygoogle?: unknown[];
  };
  w.adsbygoogle = w.adsbygoogle || [];
  for (const ins of insList) {
    if (ins.getAttribute("data-adsbygoogle-status")) continue;
    try {
      w.adsbygoogle.push({});
    } catch {
      /* adblock / not ready */
    }
  }
}

/**
 * Wait until the ad slot is "shown" enough to unlock retry.
 * - data-ad-status filled | unfilled (AdSense)
 * - iframe appeared inside the slot
 * - fallback timeout (adblock / slow network)
 */
function waitForAdDisplayed(
  slot: Element | null,
  onReady: () => void,
): void {
  const token = ++adWaitToken;

  const done = () => {
    if (token !== adWaitToken) return;
    onReady();
  };

  if (isE2e() || !slot) {
    done();
    return;
  }

  const ins = slot.querySelector("ins.adsbygoogle");
  if (!ins) {
    done();
    return;
  }

  const status = ins.getAttribute("data-ad-status");
  if (status === "filled" || status === "unfilled") {
    done();
    return;
  }

  if (ins.querySelector("iframe")) {
    done();
    return;
  }

  const observer = new MutationObserver(() => {
    if (token !== adWaitToken) {
      observer.disconnect();
      return;
    }
    const st = ins.getAttribute("data-ad-status");
    if (st === "filled" || st === "unfilled" || ins.querySelector("iframe")) {
      observer.disconnect();
      done();
    }
  });
  observer.observe(ins, {
    attributes: true,
    attributeFilter: ["data-ad-status"],
    childList: true,
    subtree: true,
  });

  globalThis.setTimeout(() => {
    observer.disconnect();
    done();
  }, AD_WAIT_FALLBACK_MS);
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

function destroyRenderer(): void {
  if (renderer) {
    renderer.destroy();
    renderer = null;
  }
  game = null;
}

function sendPlayEvent(): void {
  if (isE2e()) return;
  const w = globalThis as unknown as {
    gtag?: (...args: unknown[]) => void;
  };
  w.gtag?.("event", "play");
}
async function startPlay(): Promise<void> {
  await audio.unlock();
  audio.playSe("ui");
  sendPlayEvent();

  document.title = DEFAULT_PAGE_TITLE;
  adWaitToken++;
  btnRetry.disabled = true;
  setResultOverlayVisible(false);
  stopPlayLoop();
  destroyRenderer();

  showScreen("playing");
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
  renderer = new Renderer(WIDTH, HEIGHT);
  renderer.attachTo("game-container");
  detachInput = setupInput(game);
  dropAccMs = 0;
  paint();

  if (game.isGameOver) {
    endPlay();
    return;
  }

  audio.startBgm();
  tickerFn = () => {
    if (!game || !renderer) return;
    if (game.isGameOver) {
      endPlay();
      return;
    }
    dropAccMs += renderer.deltaMS;
    const interval = dropIntervalMs(game.level);
    while (dropAccMs >= interval) {
      dropAccMs -= interval;
      game.tick();
      if (game.isGameOver) break;
    }
    paint();
    if (game.isGameOver) endPlay();
  };
  renderer.addTicker(tickerFn);
}

function endPlay(): void {
  audio.stopBgm();
  const finalScore = game?.score ?? 0;
  stopPlayLoop();
  // Keep renderer + final board visible under overlay
  if (game && renderer) {
    renderer.render(game.board, []);
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
  resultScoreEl.textContent = `Score: ${finalScore}`;
  document.title = `Score: ${finalScore} | ${DEFAULT_PAGE_TITLE}`;
  btnRetry.disabled = true;
  setResultOverlayVisible(true);

  // Fresh push for result ad (new page-like surface)
  requestAdsIn(adResult);
  waitForAdDisplayed(adResult, () => {
    btnRetry.disabled = false;
  });
}

paintRuleExample();
btnStart.addEventListener("click", () => void startPlay());
btnRetry.addEventListener("click", () => {
  if (btnRetry.disabled) return;
  void startPlay();
});

function initControlsCarousel(): void {
  const root = document.querySelector("[data-controls-carousel]");
  const track = document.querySelector("[data-controls-track]");
  const dotsHost = document.querySelector("[data-controls-dots]");
  if (
    !(root instanceof HTMLElement) || !(track instanceof HTMLElement) ||
    !(dotsHost instanceof HTMLElement)
  ) {
    return;
  }
  const slides = [...track.querySelectorAll(".controls-slide")];
  if (slides.length === 0) return;

  const visible = () => {
    const w = track.clientWidth;
    if (w <= 0) return 1;
    const sw = (slides[0] as HTMLElement).getBoundingClientRect().width;
    return Math.max(1, Math.round(w / sw));
  };

  const syncDots = () => {
    const vis = visible();
    const needDots = slides.length > vis;
    dotsHost.hidden = !needDots;
    if (!needDots) {
      dotsHost.replaceChildren();
      return;
    }
    if (dotsHost.childElementCount !== slides.length) {
      dotsHost.replaceChildren();
      slides.forEach((_, i) => {
        const b = document.createElement("button");
        b.type = "button";
        b.className = "controls-dot";
        b.setAttribute("aria-label", `謫堺ｽ應ｽ鍋ｳｻ ${i + 1}`);
        b.addEventListener("click", () => {
          (slides[i] as HTMLElement).scrollIntoView({
            behavior: "smooth",
            inline: "start",
            block: "nearest",
          });
        });
        dotsHost.appendChild(b);
      });
    }
    const idx = Math.round(
      track.scrollLeft / Math.max(1, (slides[0] as HTMLElement).offsetWidth),
    );
    [...dotsHost.children].forEach((el, i) => {
      el.setAttribute("aria-current", i === idx ? "true" : "false");
    });
  };

  track.addEventListener("scroll", () => syncDots(), { passive: true });
  globalThis.addEventListener("resize", () => syncDots());
  syncDots();
}

showScreen("title");
initControlsCarousel();
setResultOverlayVisible(false);
btnRetry.disabled = true;
requestAdsIn(adTitle);
requestAdsIn(adSideLeft);
requestAdsIn(adSideRight);
