import { assert, assertEquals } from "https://deno.land/std@0.203.0/testing/asserts.ts";
import { parseHTML } from "npm:linkedom@0.18.0";
import {
  advanceGuideStep,
  guideGestureHtml,
  guideKeycapHtml,
  isFirstPlay,
  isGuideComplete,
  markGuideCompleted,
  OperationGuide,
} from "./guide.ts";

interface GuideFixture {
  root: HTMLElement;
  text: HTMLElement;
  step: HTMLElement;
  hint: HTMLElement;
}

function createGuideRoot(): GuideFixture {
  const { document } = parseHTML(
    "<!DOCTYPE html><html><body></body></html>",
  );
  const root = document.createElement("div");
  const text = document.createElement("span");
  text.setAttribute("data-guide-text", "");
  const step = document.createElement("span");
  step.setAttribute("data-guide-step", "");
  const hint = document.createElement("span");
  hint.setAttribute("data-guide-hint", "");
  root.append(text, step, hint);
  return { root, text, step, hint };
}

Deno.test("advanceGuideStep only advances on the current action", () => {
  assertEquals(advanceGuideStep(0, "moveRight"), 1);
  assertEquals(advanceGuideStep(0, "hardDrop"), null);
  assertEquals(advanceGuideStep(3, "hardDrop"), 4);
  assertEquals(advanceGuideStep(4, "hardDrop"), null);
  assertEquals(advanceGuideStep(-1, "moveRight"), null);
});

Deno.test("isGuideComplete reports completion at the end of the steps", () => {
  assertEquals(isGuideComplete(0), false);
  assertEquals(isGuideComplete(3), false);
  assertEquals(isGuideComplete(4), true);
});

Deno.test("keyboard hints use keycaps and touch hints use gestures", () => {
  for (const action of ["moveRight", "moveLeft", "rotateCW", "hardDrop"] as const) {
    assert(guideKeycapHtml(action).includes("<kbd"));
    assert(guideGestureHtml(action).includes("<svg"));
    assert(guideKeycapHtml(action).includes("</kbd>"));
    assert(guideGestureHtml(action).includes("</svg>"));
  }
});

Deno.test("OperationGuide walks through steps and hides when complete", () => {
  const { root, text, step, hint } = createGuideRoot();
  const guide = new OperationGuide(root, { touch: false });

  guide.show();
  assertEquals(root.hidden, false);
  assertEquals(root.getAttribute("data-guide-step"), "1");
  assertEquals(root.getAttribute("data-guide-action"), "moveRight");
  assertEquals(root.getAttribute("data-guide-mode"), "keys");
  assertEquals(text.textContent, "ブロックを右へ移動");
  assertEquals(step.textContent, "1 / 4");
  assert(hint.innerHTML.includes("<kbd"));

  assertEquals(guide.advanceOn("hardDrop"), false);
  assertEquals(guide.stepIndex, 0);

  assertEquals(guide.advanceOn("moveRight"), true);
  assertEquals(root.getAttribute("data-guide-action"), "moveLeft");
  assertEquals(text.textContent, "ブロックを左へ移動");

  assertEquals(guide.advanceOn("moveLeft"), true);
  assertEquals(guide.advanceOn("rotateCW"), true);
  assertEquals(guide.advanceOn("hardDrop"), true);
  assertEquals(guide.isComplete, true);
  assertEquals(root.hidden, true);
  assertEquals(root.getAttribute("data-guide-action"), null);
  assertEquals(root.getAttribute("data-guide-mode"), null);
  assertEquals(text.textContent, "");
  assertEquals(step.textContent, "");
  assertEquals(hint.textContent, "");
  assertEquals(hint.innerHTML, "");
});

Deno.test("OperationGuide uses touch gestures when touch mode is enabled", () => {
  const { root, text, step, hint } = createGuideRoot();
  const guide = new OperationGuide(root, { touch: true });

  guide.show();
  assertEquals(root.hidden, false);
  assertEquals(root.getAttribute("data-guide-step"), "1");
  assertEquals(root.getAttribute("data-guide-action"), "moveRight");
  assertEquals(root.getAttribute("data-guide-mode"), "touch");
  assertEquals(text.textContent, "ブロックを右へ移動");
  assertEquals(step.textContent, "1 / 4");
  assert(hint.innerHTML.includes("<svg"));

  assertEquals(guide.advanceOn("moveRight"), true);
  assertEquals(root.getAttribute("data-guide-action"), "moveLeft");
  assertEquals(text.textContent, "ブロックを左へ移動");
  assert(hint.innerHTML.includes("<svg"));

  assertEquals(guide.advanceOn("moveLeft"), true);
  assertEquals(guide.advanceOn("rotateCW"), true);
  assertEquals(guide.advanceOn("hardDrop"), true);
  assertEquals(guide.isComplete, true);
  assertEquals(root.hidden, true);
  assertEquals(text.textContent, "");
  assertEquals(step.textContent, "");
  assertEquals(hint.textContent, "");
  assertEquals(hint.innerHTML, "");
});

Deno.test("OperationGuide marks first-play complete when guided operations are performed", () => {
  const data = new Map<string, string>();
  const storage = {
    getItem: (key: string) => data.get(key) ?? null,
    setItem: (key: string, value: string) => {
      data.set(key, value);
    },
  } as unknown as Storage;
  const target = globalThis as unknown as { localStorage?: Storage };
  const previous = target.localStorage;
  Object.defineProperty(globalThis, "localStorage", {
    value: storage,
    configurable: true,
    writable: true,
  });
  try {
    assertEquals(isFirstPlay(), true);
    const { root } = createGuideRoot();
    const guide = new OperationGuide(root, { touch: false });

    guide.show();
    assertEquals(guide.advanceOn("moveRight"), true);
    assertEquals(isFirstPlay(), true);
    assertEquals(guide.advanceOn("moveLeft"), true);
    assertEquals(guide.advanceOn("rotateCW"), true);
    assertEquals(guide.advanceOn("hardDrop"), true);
    assertEquals(guide.isComplete, true);
    assertEquals(isFirstPlay(), false);
  } finally {
    Object.defineProperty(globalThis, "localStorage", {
      value: previous,
      configurable: true,
      writable: true,
    });
  }
});

Deno.test("isFirstPlay becomes false after the guide is completed", () => {
  const data = new Map<string, string>();
  const storage = {
    getItem: (key: string) => data.get(key) ?? null,
    setItem: (key: string, value: string) => {
      data.set(key, value);
    },
  } as unknown as Storage;
  const target = globalThis as unknown as { localStorage?: Storage };
  const previous = target.localStorage;
  Object.defineProperty(globalThis, "localStorage", {
    value: storage,
    configurable: true,
    writable: true,
  });
  try {
    assertEquals(isFirstPlay(), true);
    markGuideCompleted();
    assertEquals(isFirstPlay(), false);
  } finally {
    Object.defineProperty(globalThis, "localStorage", {
      value: previous,
      configurable: true,
      writable: true,
    });
  }
});
