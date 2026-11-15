import { isE2e } from "./e2e.ts";

type GtagWindow = {
  gtag?: (...args: unknown[]) => void;
};

/** Send a GA event (skipped under ?e2e=1). */
function sendGaEvent(name: string): void {
  if (isE2e()) return;
  const w = globalThis as unknown as GtagWindow;
  w.gtag?.("event", name);
}

/** Fire a GA `play` event when a session starts. */
export function sendPlayEvent(): void {
  sendGaEvent("play");
}

/** Fire a GA `tutorial` event when an instructed operation is completed.
 *  Pass the completed operation (or step) to send a distinct event per
 *  instructed operation (e.g. `tutorial_moveRight`). */
export function sendTutorialEvent(step?: string | number): void {
  if (step === undefined) {
    sendGaEvent("tutorial");
    return;
  }
  sendGaEvent(`tutorial_${step}`);
}

/** Fire a GA `game_over` event when a game ends. */
export function sendGameOverEvent(): void {
  sendGaEvent("game_over");
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
