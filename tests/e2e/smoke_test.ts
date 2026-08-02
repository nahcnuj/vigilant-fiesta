/**
 * E2E (browser): index shell + bundled main + Pixi canvas.
 * Requires network + browser binaries (playwright).
 *
 *   deno task test:e2e
 */
import { assertEquals, assert } from "https://deno.land/std@0.203.0/testing/asserts.ts";
import { chromium } from "npm:playwright";

const PORT = 4173;
const ORIGIN = `http://127.0.0.1:${PORT}`;

async function startStaticServer(): Promise<Deno.ChildProcess> {
  const cmd = new Deno.Command("deno", {
    args: [
      "run",
      "-A",
      "https://deno.land/std@0.203.0/http/file_server.ts",
      ".",
      "--port",
      String(PORT),
    ],
    stdout: "null",
    stderr: "null",
  });
  const child = cmd.spawn();
  // wait until up
  for (let i = 0; i < 40; i++) {
    try {
      const res = await fetch(ORIGIN + "/index.html");
      await res.arrayBuffer();
      if (res.ok) return child;
    } catch {
      /* retry */
    }
    await new Promise((r) => setTimeout(r, 150));
  }
  child.kill("SIGTERM");
  throw new Error("static server failed to start");
}

Deno.test({
  name: "e2e: page mounts #game-container and a canvas (Pixi)",
  sanitizeResources: false,
  sanitizeOps: false,
  async fn() {
    // ensure bundle exists
    const build = new Deno.Command("deno", {
      args: ["task", "build"],
      stdout: "piped",
      stderr: "piped",
    });
    const built = await build.output();
    assertEquals(built.success, true, new TextDecoder().decode(built.stderr));

    const server = await startStaticServer();
    const browser = await chromium.launch({ headless: true });
    try {
      const page = await browser.newPage();
      const errors: string[] = [];
      page.on("pageerror", (e) => errors.push(String(e)));

      // networkidle never settles while Pixi ticker keeps the page busy
      await page.goto(ORIGIN + "/index.html", { waitUntil: "domcontentloaded" });

      const title = await page.title();
      assert(title.includes("落ち物"), `unexpected title: ${title}`);

      await page.waitForSelector("#game-container", { timeout: 10000 });
      await page.waitForSelector("#game-container canvas", { timeout: 15000 });
      const canvasCount = await page.locator("#game-container canvas").count();
      assert(canvasCount >= 1, "expected canvas inside #game-container");

      assertEquals(errors, [], `page errors: ${errors.join("; ")}`);
    } finally {
      await browser.close();
      server.kill("SIGTERM");
      try {
        await server.status;
      } catch {
        /* ignore */
      }
    }
  },
});
