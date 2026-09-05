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
