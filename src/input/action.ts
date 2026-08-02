/**
 * Device-agnostic player intent.
 * Keyboard and future UI controls (e.g. on-screen buttons) emit these actions.
 */
export type GameAction =
  | "moveLeft"
  | "moveRight"
  | "rotateCW"
  | "hardDrop";

/** Short labels for HUD / help / on-screen buttons (locale can wrap later). */
export const GAME_ACTION_LABELS: Record<GameAction, string> = {
  moveLeft: "左へ",
  moveRight: "右へ",
  rotateCW: "回転",
  hardDrop: "一気に落とす",
};

export const ALL_GAME_ACTIONS: readonly GameAction[] = [
  "moveLeft",
  "moveRight",
  "rotateCW",
  "hardDrop",
] as const;
