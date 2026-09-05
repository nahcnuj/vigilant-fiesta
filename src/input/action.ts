/**
 * Device-agnostic player intent.
 * Keyboard and future UI controls (e.g. on-screen buttons) emit these actions.
 */
export type GameAction =
  | "moveLeft"
  | "moveRight"
  | "rotateCW"
  | "hardDrop";
