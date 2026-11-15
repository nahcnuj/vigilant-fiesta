import { isE2e } from "./e2e.ts";

type GtagWindow = {
  gtag?: (...args: unknown[]) => void;
};

/** Fire a GA `play` event when a session starts (skipped under ?e2e=1). */
export function sendPlayEvent(): void {
  if (isE2e()) return;
  const w = globalThis as unknown as GtagWindow;
  w.gtag?.("event", "play");
}

/** Fire a GA `tutorial` event when an instructed operation is completed (skipped under ?e2e=1). */
export function sendTutorialEvent(): void {
  if (isE2e()) return;
  const w = globalThis as unknown as GtagWindow;
  w.gtag?.("event", "tutorial");
}

/** Alias for {@link sendTutorialEvent} (per-operation completion). */
export function sendTutorialStepEvent(): void {
  sendTutorialEvent();
}

/** Alias for {@link sendTutorialEvent} (per-operation completion). */
export function sendTutorialCompleteEvent(): void {
  sendTutorialEvent();
}

/** Alias for {@link sendTutorialEvent} (per-operation completion). */
export function sendGuideEvent(): void {
  sendTutorialEvent();
}

/** Alias for {@link sendTutorialEvent} (per-operation completion). */
export function sendGuideStepEvent(): void {
  sendTutorialEvent();
}

/** Fire a GA `gameover` event when a game ends (skipped under ?e2e=1). */
export function sendGameOverEvent(): void {
  if (isE2e()) return;
  const w = globalThis as unknown as GtagWindow;
  w.gtag?.("event", "gameover");
}

/** Alias for {@link sendGameOverEvent}. */
export function sendGameoverEvent(): void {
  sendGameOverEvent();
}

/** Alias for {@link sendGameOverEvent}. */
export function sendGameOver(): void {
  sendGameOverEvent();
}

type TwqWindow = {
  twq?: (...args: unknown[]) => void;
};

/** Fire an X (Twitter) conversion event when a session starts (skipped under ?e2e=1). */
export function sendXEvent(score: number): void {
  if (isE2e()) return;
  const w = globalThis as unknown as TwqWindow;
  w.twq?.("event", "tw-ov0j6-ri9jk", { value: Math.max(1/20000, score/100000), currency: "USD" });
}
