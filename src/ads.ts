import { isE2e } from "./e2e.ts";

/** AdSense: enable retry after filled/unfilled or fallback timeout. */
export const AD_WAIT_FALLBACK_MS = 4000;

type AdsWindow = {
  adsbygoogle?: unknown[];
};

/** Push AdSense for ins elements that have not been requested yet. */
export function requestAdsIn(container: Element | null): void {
  if (!container || isE2e()) return;
  const insList = container.querySelectorAll("ins.adsbygoogle");
  const w = globalThis as unknown as AdsWindow;
  w.adsbygoogle = w.adsbygoogle || [];
  for (const ins of insList) {
    if (ins.getAttribute("data-adsbygoogle-status")) continue;
    try {
      w.adsbygoogle.push({});
    } catch {
      /* adblock / not ready */
    }
  }
}

/**
 * Wait until the ad slot is shown enough to unlock retry.
 * - data-ad-status filled | unfilled (AdSense)
 * - iframe appeared inside the slot
 * - fallback timeout (adblock / slow network)
 */
export function createAdWaiter(): {
  cancelPending(): void;
  waitForAdDisplayed(slot: Element | null, onReady: () => void): void;
} {
  let token = 0;

  return {
    cancelPending(): void {
      token++;
    },
    waitForAdDisplayed(slot: Element | null, onReady: () => void): void {
      const my = ++token;

      const done = () => {
        if (my !== token) return;
        onReady();
      };

      if (isE2e() || !slot) {
        done();
        return;
      }

      const ins = slot.querySelector("ins.adsbygoogle");
      if (!ins) {
        done();
        return;
      }

      const status = ins.getAttribute("data-ad-status");
      if (status === "filled" || status === "unfilled") {
        done();
        return;
      }

      if (ins.querySelector("iframe")) {
        done();
        return;
      }

      const observer = new MutationObserver(() => {
        if (my !== token) {
          observer.disconnect();
          return;
        }
        const st = ins.getAttribute("data-ad-status");
        if (
          st === "filled" || st === "unfilled" || ins.querySelector("iframe")
        ) {
          observer.disconnect();
          done();
        }
      });
      observer.observe(ins, {
        attributes: true,
        attributeFilter: ["data-ad-status"],
        childList: true,
        subtree: true,
      });

      globalThis.setTimeout(() => {
        observer.disconnect();
        done();
      }, AD_WAIT_FALLBACK_MS);
    },
  };
}
