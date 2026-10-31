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

type TwqWindow = {
  twq?: (...args: unknown[]) => void;
};

/** Fire an X (Twitter) conversion event when a session starts (skipped under ?e2e=1). */
export function sendXEvent(): void {
  if (isE2e()) return;
  const w = globalThis as unknown as TwqWindow;
  w.twq?.("event", "tw-ov0j6-ri9jk", { value: 5.0, currency: "USD" });
}

export const trackXEvent = sendXEvent;
export const fireXEvent = sendXEvent;
export const sendXConversion = sendXEvent;
export const trackXConversion = sendXEvent;
export const fireXConversion = sendXEvent;
export const sendXConversionEvent = sendXEvent;
export const trackXConversionEvent = sendXEvent;
export const fireXConversionEvent = sendXEvent;
export const sendXConversionTracking = sendXEvent;
export const trackXConversionTracking = sendXEvent;
