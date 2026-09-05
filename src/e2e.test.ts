import { assertEquals } from "https://deno.land/std@0.203.0/testing/asserts.ts";
import { isE2e } from "./e2e.ts";

Deno.test("isE2e is true when ?e2e=1", () => {
  const g = globalThis as unknown as { location?: unknown };
  const prev = g.location;
  Object.defineProperty(globalThis, "location", {
    value: { search: "?e2e=1" },
    configurable: true,
    writable: true,
  });
  try {
    assertEquals(isE2e(), true);
  } finally {
    Object.defineProperty(globalThis, "location", {
      value: prev,
      configurable: true,
      writable: true,
    });
  }
});

Deno.test("isE2e is false without e2e query", () => {
  const g = globalThis as unknown as { location?: unknown };
  const prev = g.location;
  Object.defineProperty(globalThis, "location", {
    value: { search: "" },
    configurable: true,
    writable: true,
  });
  try {
    assertEquals(isE2e(), false);
  } finally {
    Object.defineProperty(globalThis, "location", {
      value: prev,
      configurable: true,
      writable: true,
    });
  }
});
