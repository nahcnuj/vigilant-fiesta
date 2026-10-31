import { assertEquals } from "https://deno.land/std@0.203.0/testing/asserts.ts";
import {
  sendPlayEvent,
  sendXEvent,
  X_CONVERSION_EVENT_ID,
  X_PIXEL_ID,
} from "./analytics.ts";

Deno.test("sendPlayEvent calls gtag when not e2e", () => {
  const g = globalThis as unknown as { location?: unknown; gtag?: unknown };
  const prevLoc = g.location;
  const prevGtag = g.gtag;
  const calls: unknown[][] = [];
  Object.defineProperty(globalThis, "location", {
    value: { search: "" },
    configurable: true,
    writable: true,
  });
  (globalThis as unknown as { gtag: (...a: unknown[]) => void }).gtag = (
    ...args: unknown[]
  ) => {
    calls.push(args);
  };
  try {
    sendPlayEvent();
    assertEquals(calls.length, 1);
    assertEquals(calls[0][0], "event");
    assertEquals(calls[0][1], "play");
  } finally {
    Object.defineProperty(globalThis, "location", {
      value: prevLoc,
      configurable: true,
      writable: true,
    });
    (globalThis as unknown as { gtag?: unknown }).gtag = prevGtag;
  }
});

Deno.test("sendPlayEvent skipped under e2e", () => {
  const g = globalThis as unknown as { location?: unknown; gtag?: unknown };
  const prevLoc = g.location;
  const prevGtag = g.gtag;
  let called = false;
  Object.defineProperty(globalThis, "location", {
    value: { search: "?e2e=1" },
    configurable: true,
    writable: true,
  });
  (globalThis as unknown as { gtag: () => void }).gtag = () => {
    called = true;
  };
  try {
    sendPlayEvent();
    assertEquals(called, false);
  } finally {
    Object.defineProperty(globalThis, "location", {
      value: prevLoc,
      configurable: true,
      writable: true,
    });
    (globalThis as unknown as { gtag?: unknown }).gtag = prevGtag;
  }
});

Deno.test("X tracking constants match the configured pixel and event", () => {
  assertEquals(X_PIXEL_ID, "ov0j6");
  assertEquals(X_CONVERSION_EVENT_ID, "tw-ov0j6-ri9jk");
});

Deno.test("sendXEvent fires the X conversion event when not e2e", () => {
  const g = globalThis as unknown as { location?: unknown; twq?: unknown };
  const prevLoc = g.location;
  const prevTwq = g.twq;
  const calls: unknown[][] = [];
  Object.defineProperty(globalThis, "location", {
    value: { search: "" },
    configurable: true,
    writable: true,
  });
  (globalThis as unknown as { twq: (...a: unknown[]) => void }).twq = (
    ...args: unknown[]
  ) => {
    calls.push(args);
  };
  try {
    sendXEvent();
    assertEquals(calls.length, 1);
    assertEquals(calls[0][0], "event");
    assertEquals(calls[0][1], X_CONVERSION_EVENT_ID);
    assertEquals(calls[0][2], { value: 5.0, currency: "USD" });
  } finally {
    Object.defineProperty(globalThis, "location", {
      value: prevLoc,
      configurable: true,
      writable: true,
    });
    (globalThis as unknown as { twq?: unknown }).twq = prevTwq;
  }
});

Deno.test("sendXEvent skipped under e2e", () => {
  const g = globalThis as unknown as { location?: unknown; twq?: unknown };
  const prevLoc = g.location;
  const prevTwq = g.twq;
  let called = false;
  Object.defineProperty(globalThis, "location", {
    value: { search: "?e2e=1" },
    configurable: true,
    writable: true,
  });
  (globalThis as unknown as { twq: () => void }).twq = () => {
    called = true;
  };
  try {
    sendXEvent();
    assertEquals(called, false);
  } finally {
    Object.defineProperty(globalThis, "location", {
      value: prevLoc,
      configurable: true,
      writable: true,
    });
    (globalThis as unknown as { twq?: unknown }).twq = prevTwq;
  }
});
