import {
  assert,
  assertEquals,
} from "https://deno.land/std@0.203.0/testing/asserts.ts";
import {
  advanceGuideStep,
  GUIDE_STEPS,
  guideGestureHtml,
  guideKeycapHtml,
  isFirstPlay,
  isGuideComplete,
  markGuideCompleted,
  OperationGuide,
} from "./guide.ts";

class FakeElement {
  hidden = true;
  textContent: string | null = null;
  innerHTML = "";
  readonly attrs = new Map<string, string>();
  readonly classList = { add() {}, remove() {} };

  setAttribute(name: string, value: string): void {
    this.attrs.set(name, value);
  }

  removeAttribute(name: string): void {
    this.attrs.delete(name);
  }

  querySelector(_selector: string): FakeElement | null {
    return null;
  }
}

class FakeGuideRoot extends FakeElement {
  readonly text = new FakeElement();
  readonly step = new FakeElement();
  readonly hint = new FakeElement();

  override querySelector(selector: string): FakeElement | null {
    if (selector === "[data-guide-text]") return this.text;
    if (selector === "[data-guide-step]") return this.step;
    if (selector === "[data-guide-hint]") return this.hint;
    return null;
  }
}

Deno.test("GUIDE_STEPS follows the requested operation order", () => {
  assertEquals(
    GUIDE_STEPS.map((step) => step.action),
    ["moveRight", "moveLeft", "rotateCW", "hardDrop"],
  );
});

Deno.test("advanceGuideStep only advances on the current action", () => {
  assertEquals(advanceGuideStep(0, "moveRight"), 1);
  assertEquals(advanceGuideStep(0, "hardDrop"), null);
  assertEquals(advanceGuideStep(3, "hardDrop"), 4);
  assertEquals(advanceGuideStep(4, "hardDrop"), null);
  assertEquals(advanceGuideStep(-1, "moveRight"), null);
});

Deno.test("isGuideComplete reports completion at the end of the steps", () => {
  assertEquals(isGuideComplete(0), false);
  assertEquals(isGuideComplete(GUIDE_STEPS.length - 1), false);
  assertEquals(isGuideComplete(GUIDE_STEPS.length), true);
});

Deno.test("keyboard hints use keycaps and touch hints use gestures", () => {
  assert(guideKeycapHtml("moveRight").includes("<kbd"));
  assert(guideGestureHtml("moveRight").includes("<svg"));
});

Deno.test("OperationGuide walks through steps and hides when complete", () => {
  const root = new FakeGuideRoot();
  const guide = new OperationGuide(root, { touch: false });

  guide.show();
  assertEquals(root.hidden, false);
  assertEquals(root.attrs.get("data-guide-step"), "1");
  assertEquals(root.attrs.get("data-guide-action"), "moveRight");
  assertEquals(root.attrs.get("data-guide-mode"), "keys");
  assertEquals(root.text.textContent, GUIDE_STEPS[0].text);
  assertEquals(root.step.textContent, `1 / ${GUIDE_STEPS.length}`);
  assertEquals(root.hint.textContent, GUIDE_STEPS[0].keyHint);
  assert(root.hint.innerHTML.includes("<kbd"));

  assertEquals(guide.advanceOn("hardDrop"), false);
  assertEquals(guide.stepIndex, 0);

  assertEquals(guide.advanceOn("moveRight"), true);
  assertEquals(root.attrs.get("data-guide-action"), "moveLeft");
  assertEquals(root.text.textContent, GUIDE_STEPS[1].text);

  assertEquals(guide.advanceOn("moveLeft"), true);
  assertEquals(guide.advanceOn("rotateCW"), true);
  assertEquals(guide.advanceOn("hardDrop"), true);
  assertEquals(guide.isComplete, true);
  assertEquals(root.hidden, true);
  assertEquals(root.attrs.has("data-guide-action"), false);
  assertEquals(root.attrs.has("data-guide-mode"), false);
  assertEquals(root.text.textContent, "");
  assertEquals(root.step.textContent, "");
  assertEquals(root.hint.textContent, "");
  assertEquals(root.hint.innerHTML, "");
});

Deno.test("OperationGuide uses touch gestures when touch mode is enabled", () => {
  const root = new FakeGuideRoot();
  const guide = new OperationGuide(root, { touch: true });

  guide.show();
  assertEquals(root.attrs.get("data-guide-mode"), "touch");
  assertEquals(root.hint.textContent, GUIDE_STEPS[0].touchHint);
  assert(root.hint.innerHTML.includes("<svg"));
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
