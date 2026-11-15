import { assertEquals } from "https://deno.land/std@0.203.0/testing/asserts.ts";
import {
  sendGameOverEvent,
  sendPlayEvent,
  sendTutorialEvent,
} from "./analytics.ts";

type GtagCall = unknown[];

function withGtag(search: string, fn: () => void): GtagCall[] {
  const g = globalThis as unknown as { location?: unknown; gtag?: unknown };
  const prevLoc = g.location;
  const prevGtag = g.gtag;
  const calls: GtagCall[] = [];
  Object.defineProperty(globalThis, "location", {
    value: { search },
    configurable: true,
    writable: true,
  });
  (globalThis as unknown as { gtag: (...a: unknown[]) => void }).gtag = (
    ...args: unknown[]
  ) => {
    calls.push(args);
  };
  try {
    fn();
  } finally {
    Object.defineProperty(globalThis, "location", {
      value: prevLoc,
      configurable: true,
      writable: true,
    });
    (globalThis as unknown as { gtag?: unknown }).gtag = prevGtag;
  }
  return calls;
}

function assertSingleEvent(name: string, fn: () => void): void {
  const calls = withGtag("", fn);
  assertEquals(calls.length, 1);
  assertEquals(calls[0][0], "event");
  assertEquals(calls[0][1], name);
}

Deno.test("sendPlayEvent calls gtag when not e2e", () => {
  assertSingleEvent("play", sendPlayEvent);
});

Deno.test("sendTutorialEvent calls gtag when not e2e", () => {
  assertSingleEvent("tutorial", sendTutorialEvent);
});

Deno.test("sendGameOverEvent calls gtag when not e2e", () => {
  assertSingleEvent("game_over", sendGameOverEvent);
});

Deno.test("analytics events are skipped under e2e", () => {
  for (const fn of [sendPlayEvent, sendTutorialEvent, sendGameOverEvent]) {
    assertEquals(withGtag("?e2e=1", fn).length, 0);
  }
});
