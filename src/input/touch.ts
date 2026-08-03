import type { GameAction } from "./action.ts";
import type { InputSource } from "./source.ts";

const SWIPE_MIN_PX = 24;

/** Board surface: EventTarget + optional style / capture (browser element or test double). */
export type TouchRoot = EventTarget & {
  style?: { touchAction?: string };
  setPointerCapture?: (pointerId: number) => void;
};

export type TouchPadOptions = {
  /** Board area. Default: #game-container when document exists. */
  root?: TouchRoot | null;
};

type PointerLike = Event & {
  clientX?: number;
  clientY?: number;
  pointerType?: string;
  button?: number;
  pointerId?: number;
  preventDefault?: () => void;
};

function defaultRoot(): TouchRoot | null {
  const doc = (globalThis as {
    document?: { getElementById?: (id: string) => TouchRoot | null };
  }).document;
  return doc?.getElementById?.("game-container") ?? null;
}

/**
 * Pointer swipe/tap on the board → GameAction.
 * Inject `root` in tests (same idea as keyboard `target`).
 */
export function createTouchPadSource(options: TouchPadOptions = {}): InputSource {
  return {
    attach(handler) {
      const root = options.root === undefined ? defaultRoot() : options.root;
      if (!root) return () => {};

      let startX = 0;
      let startY = 0;
      let tracking = false;

      const onDown = (ev: Event) => {
        const e = ev as PointerLike;
        if (e.pointerType === "mouse" && e.button !== 0) return;
        tracking = true;
        startX = e.clientX ?? 0;
        startY = e.clientY ?? 0;
        try {
          root.setPointerCapture?.(e.pointerId ?? 0);
        } catch {
          /* ignore */
        }
      };

      const onUp = (ev: Event) => {
        if (!tracking) return;
        tracking = false;
        const e = ev as PointerLike;
        const dx = (e.clientX ?? 0) - startX;
        const dy = (e.clientY ?? 0) - startY;
        const adx = Math.abs(dx);
        const ady = Math.abs(dy);

        let action: GameAction;
        if (adx < SWIPE_MIN_PX && ady < SWIPE_MIN_PX) {
          action = "rotateCW";
        } else if (adx > ady) {
          action = dx < 0 ? "moveLeft" : "moveRight";
        } else {
          action = dy < 0 ? "hardDrop" : "rotateCW";
        }
        e.preventDefault?.();
        handler(action);
      };

      const onCancel = () => {
        tracking = false;
      };

      if (root.style) root.style.touchAction = "none";
      root.addEventListener("pointerdown", onDown);
      root.addEventListener("pointerup", onUp);
      root.addEventListener("pointercancel", onCancel);

      return () => {
        if (root.style) root.style.touchAction = "";
        root.removeEventListener("pointerdown", onDown);
        root.removeEventListener("pointerup", onUp);
        root.removeEventListener("pointercancel", onCancel);
      };
    },
  };
}
