import { assertEquals } from "https://deno.land/std@0.203.0/testing/asserts.ts";
import { type DestroyOptions, disposeChildren, syncPool } from "./labels.ts";

type FakeChild = {
  destroyed: DestroyOptions[];
  destroy(options?: DestroyOptions): void;
};

function fakeChild(): FakeChild {
  return {
    destroyed: [],
    destroy(options?: DestroyOptions) {
      this.destroyed.push(options ?? {});
    },
  };
}

Deno.test("disposeChildren destroys every child with its textures", () => {
  const first = fakeChild();
  const second = fakeChild();
  const children = [first, second];
  let removals = 0;
  const container = {
    removeChildren() {
      removals++;
      const out = children.slice();
      children.length = 0;
      return out;
    },
  };

  disposeChildren(container);

  assertEquals(removals, 1);
  assertEquals(children.length, 0);
  for (const child of [first, second]) {
    assertEquals(child.destroyed, [
      { children: true, texture: true, baseTexture: true },
    ]);
  }
});

Deno.test("disposeChildren is safe for an empty container", () => {
  const container = { removeChildren: () => [] };
  disposeChildren(container);
});

Deno.test("syncPool creates nodes only up to the requested count", () => {
  const created: number[] = [];
  const pool = syncPool([], 3, (index) => {
    created.push(index);
    return { visible: false };
  });

  assertEquals(created, [0, 1, 2]);
  assertEquals(pool.map((node) => node.visible), [true, true, true]);
});

Deno.test("syncPool reuses existing nodes across frames", () => {
  const pool = [{ visible: true }, { visible: true }, { visible: true }];
  let creates = 0;
  const same = syncPool(pool, 2, () => {
    creates++;
    return { visible: false };
  });

  assertEquals(creates, 0);
  assertEquals(same, pool);
  assertEquals(pool.map((node) => node.visible), [true, true, false]);
});

Deno.test("syncPool grows an existing pool without replacing it", () => {
  const pool = [{ visible: true }];
  let creates = 0;
  const same = syncPool(pool, 2, () => {
    creates++;
    return { visible: false };
  });

  assertEquals(creates, 1);
  assertEquals(same, pool);
  assertEquals(pool.map((node) => node.visible), [true, true]);
});

Deno.test("syncPool hides every node when nothing is visible", () => {
  const pool = [{ visible: true }, { visible: true }];
  const same = syncPool(pool, 0, () => ({ visible: true }));

  assertEquals(same, pool);
  assertEquals(pool.map((node) => node.visible), [false, false]);
});
