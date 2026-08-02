import type { GameAction } from "./action.ts";
import type { InputSource } from "./source.ts";

/** Default mapping from KeyboardEvent.key (requirements 3.3). */
export const DEFAULT_KEY_MAP: Readonly<Record<string, GameAction>> = {
  ArrowLeft: "moveLeft",
  ArrowRight: "moveRight",
  ArrowDown: "rotateCW",
  ArrowUp: "hardDrop",
};

export type KeyboardSourceOptions = {
  /** Override or extend key → action. */
  keyMap?: Readonly<Record<string, GameAction>>;
  target?: EventTarget;
};

/** Desktop keyboard → GameAction. */
export function createKeyboardSource(
  options: KeyboardSourceOptions = {},
): InputSource {
  const keyMap = options.keyMap ?? DEFAULT_KEY_MAP;
  const target = options.target ?? globalThis;

  return {
    attach(handler) {
      const onKeyDown = (ev: Event) => {
        // Key-like events (DOM KeyboardEvent or test doubles)
        const e = ev as Event & { key?: string };
        const key = e.key;
        if (key === undefined) return;
        const action = keyMap[key];
        if (!action) return;
        if (typeof (e as { preventDefault?: () => void }).preventDefault === "function") {
          (e as { preventDefault: () => void }).preventDefault();
        }
        handler(action);
      };
      target.addEventListener("keydown", onKeyDown);
      return () => target.removeEventListener("keydown", onKeyDown);
    },
  };
}
