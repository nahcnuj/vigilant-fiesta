import { assertEquals } from "https://deno.land/std@0.203.0/testing/asserts.ts";
import { createAdWaiter, requestAdsIn } from "./ads.ts";

Deno.test("requestAdsIn no-ops without container", () => {
  requestAdsIn(null);
});

Deno.test("requestAdsIn skips when e2e=1", () => {
  const g = globalThis as unknown as { location?: unknown };
  const prev = g.location;
  Object.defineProperty(globalThis, "location", {
    value: { search: "?e2e=1" },
    configurable: true,
    writable: true,
  });
  try {
    const el = {
      querySelectorAll() {
        throw new Error("should not query ads in e2e");
      },
    } as unknown as Element;
    requestAdsIn(el);
  } finally {
    Object.defineProperty(globalThis, "location", {
      value: prev,
      configurable: true,
      writable: true,
    });
  }
});

Deno.test("createAdWaiter waitForAdDisplayed fires immediately without slot", () => {
  const waiter = createAdWaiter();
  let n = 0;
  waiter.waitForAdDisplayed(null, () => {
    n++;
  });
  assertEquals(n, 1);
});

Deno.test("createAdWaiter cancelPending suppresses stale callback", () => {
  const waiter = createAdWaiter();
  let n = 0;
  waiter.waitForAdDisplayed(null, () => {
    n++;
  });
  waiter.cancelPending();
  waiter.waitForAdDisplayed(null, () => {
    n += 10;
  });
  assertEquals(n, 11);
});
