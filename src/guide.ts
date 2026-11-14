/** First-play operation guide (tutorial) for Ochimono. */

import type { GameAction } from "./input/action.ts";

export interface GuideStep {
  action: GameAction;
  text: string;
  touchHint: string;
  keyHint: string;
}

const GUIDE_STEPS: readonly GuideStep[] = [
  { action: "moveRight", text: "ブロックを右へ移動", touchHint: "右にスワイプ", keyHint: "→ キー" },
  { action: "moveLeft", text: "ブロックを左へ移動", touchHint: "左にスワイプ", keyHint: "← キー" },
  { action: "rotateCW", text: "ブロックを回転", touchHint: "タップ / 下にスワイプ", keyHint: "↓ キー" },
  { action: "hardDrop", text: "ハードドロップ", touchHint: "上にスワイプ", keyHint: "↑ キー" },
];

const GUIDE_STORAGE_KEYS = [
  "ochimono:guide-completed",
  "ochimono-guide-completed",
  "guideCompleted",
  "operationGuideCompleted",
  "tutorialCompleted",
  "hasPlayed",
  "ochimono:hasPlayed",
];

export function isTouchDevice(): boolean {
  try {
    const mm = (globalThis as { matchMedia?: (q: string) => { matches: boolean } })
      .matchMedia;
    if (mm && mm("(pointer: coarse)").matches) return true;
  } catch {
    /* ignore */
  }
  try {
    const nav = (globalThis as { navigator?: { maxTouchPoints?: number } })
      .navigator;
    if (nav && (nav.maxTouchPoints ?? 0) > 0) return true;
  } catch {
    /* ignore */
  }
  return false;
}

export function isFirstPlay(): boolean {
  try {
    const ls = (globalThis as { localStorage?: Storage }).localStorage;
    if (!ls) return true;
    return !GUIDE_STORAGE_KEYS.some((k) => ls.getItem(k) === "1" || ls.getItem(k) === "true");
  } catch {
    return true;
  }
}

export function markGuideCompleted(): void {
  try {
    const ls = (globalThis as { localStorage?: Storage }).localStorage;
    if (!ls) return;
    for (const k of GUIDE_STORAGE_KEYS) ls.setItem(k, "1");
  } catch {
    /* ignore */
  }
}

/** Advance step index when `action` matches current step. Returns new index or null. */
export function advanceGuideStep(
  index: number,
  action: GameAction,
): number | null {
  if (index < 0 || index >= GUIDE_STEPS.length) return null;
  if (GUIDE_STEPS[index].action !== action) return null;
  return index + 1;
}

export function isGuideComplete(index: number): boolean {
  return index >= GUIDE_STEPS.length;
}


/** Map a game action to its primary key cap label. */
const GUIDE_KEY_CAPS: Readonly<Record<GameAction, string>> = {
  moveRight: "→",
  moveLeft: "←",
  rotateCW: "↓",
  hardDrop: "↑",
};

/** Inline SVG gestures for touch guidance. */
const GUIDE_TOUCH_ICONS: Readonly<Record<GameAction, string>> = {
  moveRight:
    '<svg class="guide-gesture" viewBox="0 0 48 24" width="48" height="24" aria-hidden="true"><path d="M4 12h32" stroke="currentColor" stroke-width="3" stroke-linecap="round"/><path d="M30 6l8 6-8 6" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/></svg>',
  moveLeft:
    '<svg class="guide-gesture" viewBox="0 0 48 24" width="48" height="24" aria-hidden="true"><path d="M44 12H12" stroke="currentColor" stroke-width="3" stroke-linecap="round"/><path d="M18 6l-8 6 8 6" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/></svg>',
  rotateCW:
    '<svg class="guide-gesture" viewBox="0 0 48 48" width="40" height="40" aria-hidden="true"><path d="M36 24a12 12 0 1 1-3.5-8.5" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round"/><path d="M36 8v8h-8" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/></svg>',
  hardDrop:
    '<svg class="guide-gesture" viewBox="0 0 24 48" width="24" height="48" aria-hidden="true"><path d="M12 4v32" stroke="currentColor" stroke-width="3" stroke-linecap="round"/><path d="M6 30l6 8 6-8" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/></svg>',
};

export function guideKeycapHtml(action: GameAction): string {
  return `<kbd class="guide-key">${GUIDE_KEY_CAPS[action]}</kbd>`;
}

export function guideGestureHtml(action: GameAction): string {
  return `<span class="guide-gesture-wrap">${GUIDE_TOUCH_ICONS[action]}</span>`;
}

export interface OperationGuideOptions {
  touch?: boolean;
}

type GuideRoot = HTMLElement;

export class OperationGuide {
  #index = 0;
  #touch: boolean;
  #roots: HTMLElement[];
  #textEls: { textContent: string | null }[];
  #stepEls: { textContent: string | null }[];
  #hintEls: { textContent: string | null; innerHTML?: string }[];

  constructor(
    root: unknown,
    options: OperationGuideOptions = {},
  ) {
    const arr = Array.isArray(root) ? root : root ? [root] : [];
    this.#roots = arr.filter((x) => x !== null && x !== undefined) as HTMLElement[];
    this.#touch = options.touch ?? isTouchDevice();
    const q = (r: HTMLElement, sel: string) => {
      try {
        return r.querySelector?.(sel) as { textContent: string | null } | null;
      } catch {
        return null;
      }
    };
    this.#textEls = this.#roots
      .map((r) => q(r, "[data-guide-text]"))
      .filter((x): x is { textContent: string | null } => !!x);
    this.#stepEls = this.#roots
      .map((r) => q(r, "[data-guide-step]"))
      .filter((x): x is { textContent: string | null } => !!x);
    this.#hintEls = this.#roots
      .map((r) => q(r, "[data-guide-hint]"))
      .filter((x): x is { textContent: string | null; innerHTML?: string } => !!x);
  }

  get stepIndex(): number {
    return this.#index;
  }

  get isComplete(): boolean {
    return isGuideComplete(this.#index);
  }

  get currentAction(): GameAction | null {
    if (this.isComplete) return null;
    return GUIDE_STEPS[this.#index].action;
  }

  show(): void {
    for (const r of this.#roots) {
      try { r.hidden = false; } catch { /* ignore */ }
      try { r.classList?.remove("hidden"); } catch { /* ignore */ }
      try { r.setAttribute?.("data-guide-step", String(this.#index + 1)); } catch { /* ignore */ }
      try { r.setAttribute?.("data-guide-action", this.currentAction ?? ""); } catch { /* ignore */ }
      try { r.setAttribute?.("data-guide-mode", this.#touch ? "touch" : "keys"); } catch { /* ignore */ }
    }
    this.#update();
  }

  hide(): void {
    for (const r of this.#roots) {
      try { r.hidden = true; } catch { /* ignore */ }
      try { r.classList?.add("hidden"); } catch { /* ignore */ }
      try { r.removeAttribute?.("data-guide-step"); } catch { /* ignore */ }
      try { r.removeAttribute?.("data-guide-action"); } catch { /* ignore */ }
      try { r.removeAttribute?.("data-guide-mode"); } catch { /* ignore */ }
    }
  }

  advanceOn(action: GameAction): boolean {
    const next = advanceGuideStep(this.#index, action);
    if (next === null) return false;
    this.#index = next;
    if (this.isComplete) {
      markGuideCompleted();
      this.#update();
      this.hide();
      return true;
    }
    for (const r of this.#roots) {
      try { r.setAttribute?.("data-guide-step", String(this.#index + 1)); } catch { /* ignore */ }
      try { r.setAttribute?.("data-guide-action", this.currentAction ?? ""); } catch { /* ignore */ }
      try { r.setAttribute?.("data-guide-mode", this.#touch ? "touch" : "keys"); } catch { /* ignore */ }
    }
    this.#update();
    return true;
  }

  #update(): void {
    const step = this.isComplete ? null : GUIDE_STEPS[this.#index];
    for (const el of this.#textEls) {
      el.textContent = step ? step.text : "";
    }
    for (const el of this.#stepEls) {
      el.textContent = step
        ? `${this.#index + 1} / ${GUIDE_STEPS.length}`
        : "";
    }
    if (step) {
      const plain = this.#touch ? step.touchHint : step.keyHint;
      const html = this.#touch
        ? guideGestureHtml(step.action)
        : guideKeycapHtml(step.action);
      for (const el of this.#hintEls) {
        el.textContent = plain;
        if (typeof el.innerHTML === "string") {
          try {
            el.innerHTML = html;
          } catch {
            /* ignore */
          }
        }
      }
      return;
    }
    for (const el of this.#hintEls) {
      el.textContent = "";
      if (typeof el.innerHTML === "string") {
        try {
          el.innerHTML = "";
        } catch {
          /* ignore */
        }
      }
    }
  }
}
