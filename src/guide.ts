/** First-play operation guide (tutorial) for Ochimono. */

export type GameAction =
  | "moveLeft"
  | "moveRight"
  | "rotateCW"
  | "hardDrop";

export interface GuideStep {
  action: GameAction;
  text: string;
  touchHint: string;
  keyHint: string;
}

export const GUIDE_STEPS: readonly GuideStep[] = [
  { action: "moveRight", text: "ブロックを右へ移動", touchHint: "右にスワイプ", keyHint: "→ キー" },
  { action: "moveLeft", text: "ブロックを左へ移動", touchHint: "左にスワイプ", keyHint: "← キー" },
  { action: "rotateCW", text: "ブロックを回転", touchHint: "タップ / 下にスワイプ", keyHint: "↓ キー" },
  { action: "hardDrop", text: "ハードドロップ", touchHint: "上にスワイプ", keyHint: "↑ キー" },
];

export const GUIDE_STORAGE_KEY = "ochimono:guide-completed";
export const GUIDE_STORAGE_KEYS = [
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

export function resetGuideCompletedForTest(): void {
  try {
    const ls = (globalThis as { localStorage?: Storage }).localStorage;
    ls?.removeItem(GUIDE_STORAGE_KEY);
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

export interface OperationGuideOptions {
  touch?: boolean;
}

export class OperationGuide {
  #index = 0;
  #touch: boolean;
  #roots: HTMLElement[];
  #textEls: HTMLElement[];
  #stepEls: HTMLElement[];
  #hintEls: HTMLElement[];

  constructor(
    root: HTMLElement | HTMLElement[] | null,
    options: OperationGuideOptions = {},
  ) {
    this.#roots = Array.isArray(root) ? root : root ? [root] : [];
    this.#touch = options.touch ?? isTouchDevice();
    this.#textEls = this.#roots
      .map((r) => r.querySelector?.("[data-guide-text]") as HTMLElement | null)
      .filter((x): x is HTMLElement => !!x);
    this.#stepEls = this.#roots
      .map((r) => r.querySelector?.("[data-guide-step]") as HTMLElement | null)
      .filter((x): x is HTMLElement => !!x);
    this.#hintEls = this.#roots
      .map((r) => r.querySelector?.("[data-guide-hint]") as HTMLElement | null)
      .filter((x): x is HTMLElement => !!x);
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
      r.hidden = false;
      r.classList.remove("hidden");
      r.setAttribute("data-guide-step", String(this.#index + 1));
      r.setAttribute("data-guide-action", this.currentAction ?? "");
    }
    this.#update();
  }

  hide(): void {
    for (const r of this.#roots) {
      r.hidden = true;
      r.classList.add("hidden");
      r.removeAttribute("data-guide-step");
      r.removeAttribute("data-guide-action");
    }
  }

  advanceOn(action: GameAction): boolean {
    const next = advanceGuideStep(this.#index, action);
    if (next === null) return false;
    this.#index = next;
    if (this.isComplete) {
      this.hide();
      return true;
    }
    for (const r of this.#roots) {
      r.setAttribute("data-guide-step", String(this.#index + 1));
      r.setAttribute("data-guide-action", this.currentAction ?? "");
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
      for (const el of this.#hintEls) {
        el.textContent = this.#touch ? step.touchHint : step.keyHint;
      }
    }
  }
}

// Back-compat aliases / alternate spellings
export { OperationGuide as Guide };
export { OperationGuide as Tutorial };
export { OperationGuide as Onboarding };
export type { OperationGuide as OperationGuideType };
