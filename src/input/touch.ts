import type { GameAction } from "./action.ts";
import type { InputSource } from "./source.ts";

const SWIPE_MIN_PX = 24;

export type TouchPadOptions = {
  /** Board area. Default: #game-container */
  root?: HTMLElement | null;
};

/**
 * Pointer swipe/tap on the board → GameAction.
 * No on-screen pad (keeps mobile layout tight).
 */
export function createTouchPadSource(options: TouchPadOptions = {}): InputSource {
  return {
    attach(handler) {
      const root = options.root ??
        (document.getElementById("game-container") as HTMLElement | null);
      if (!root) return () => {};

      let startX = 0;
      let startY = 0;
      let tracking = false;

      const onDown = (ev: Event) => {
        const e = ev as PointerEvent;
        if (e.pointerType === "mouse" && e.button !== 0) return;
        tracking = true;
        startX = e.clientX;
        startY = e.clientY;
        try {
          root.setPointerCapture(e.pointerId);
        } catch {
          /* ignore */
        }
      };

      const onUp = (ev: Event) => {
        if (!tracking) return;
        tracking = false;
        const e = ev as PointerEvent;
        const dx = e.clientX - startX;
        const dy = e.clientY - startY;
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
        e.preventDefault();
        handler(action);
      };

      const onCancel = () => {
        tracking = false;
      };

      root.style.touchAction = "none";
      root.addEventListener("pointerdown", onDown, { passive: false });
      root.addEventListener("pointerup", onUp, { passive: false });
      root.addEventListener("pointercancel", onCancel);

      return () => {
        root.style.touchAction = "";
        root.removeEventListener("pointerdown", onDown);
        root.removeEventListener("pointerup", onUp);
        root.removeEventListener("pointercancel", onCancel);
      };
    },
  };
}
