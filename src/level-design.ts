import type { Operator } from "./piece.ts";

export type LevelDistribution = "uniform" | "biased";

export interface ForcedGameOver {
  negativeScore: boolean;
  divisionByZero: boolean;
}

export interface LevelDesign {
  readonly level: number;
  readonly scoreThreshold: number;
  readonly digits: readonly number[];
  readonly operators: readonly Operator[];
  readonly distribution: LevelDistribution;
  readonly forcedGameOver: ForcedGameOver;
}

export function createLevelDesign(
  level: number,
  scoreThreshold: number,
  digits: number[],
  operators: Operator[],
  distribution: LevelDistribution,
  forcedGameOver: ForcedGameOver,
): LevelDesign {
  return {
    level,
    scoreThreshold,
    digits: [...digits],
    operators: [...operators],
    distribution,
    forcedGameOver,
  };
}

export const LEVEL_DESIGNS: readonly LevelDesign[] = [
  createLevelDesign(
    0,
    0,
    [1, 2, 3, 4, 5, 6, 7, 8, 9],
    ["+"],
    "uniform",
    { negativeScore: false, divisionByZero: false },
  ),
  createLevelDesign(
    1,
    0,
    [1, 2, 3, 4, 5, 6, 7, 8, 9],
    ["+"],
    "uniform",
    { negativeScore: false, divisionByZero: false },
  ),
  createLevelDesign(
    2,
    10,
    [1, 2, 3, 4, 5, 6, 7, 8, 9],
    ["+", "-"],
    "uniform",
    { negativeScore: true, divisionByZero: false },
  ),
  createLevelDesign(
    3,
    50,
    [1, 2, 3, 4, 5, 6, 7, 8, 9],
    ["+", "-", "*"],
    "uniform",
    { negativeScore: true, divisionByZero: false },
  ),
  createLevelDesign(
    4,
    250,
    [1, 2, 3, 4, 5, 6, 7, 8, 9],
    ["+", "-", "*", "/"],
    "uniform",
    { negativeScore: true, divisionByZero: false },
  ),
  createLevelDesign(
    5,
    1000,
    [0, 1, 2, 3, 4, 5, 6, 7, 8, 9],
    ["+", "-", "*", "/"],
    "uniform",
    { negativeScore: true, divisionByZero: true },
  ),
  createLevelDesign(
    6,
    5000,
    [0, 1, 2, 3, 4, 5, 6, 7, 8, 9],
    ["+", "-", "*", "/"],
    "biased",
    { negativeScore: true, divisionByZero: true },
  ),
];

export function designForLevel(level: number): LevelDesign {
  if (level < 0) return LEVEL_DESIGNS[0];
  const base = LEVEL_DESIGNS[Math.min(level, LEVEL_DESIGNS.length - 1)];
  if (level <= LEVEL_DESIGNS.length - 1) return base;
  const scoreThreshold = Math.pow(10, level - 3);
  return {
    level,
    scoreThreshold,
    digits: [...base.digits],
    operators: [...base.operators],
    distribution: base.distribution,
    forcedGameOver: { ...base.forcedGameOver },
  };
}

export function designForScore(score: number): LevelDesign {
  if (score <= 0) return LEVEL_DESIGNS[0];
  const design = LEVEL_DESIGNS.reduce(
    (current, next) => (score >= next.scoreThreshold ? next : current),
    LEVEL_DESIGNS[0],
  );
  if (score < 10_000) return design;
  const level = 2 + String(Math.max(0, Math.floor(score))).length;
  return designForLevel(level);
}

export function levelForScore(score: number): number {
  return designForScore(score).level;
}
