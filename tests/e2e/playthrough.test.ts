/**
 * E2E: start → hard-drop only → game over → result.
 * `?e2e=1` → digits-only pairs (no formula clears).
 */
import { spawn } from "node:child_process";
import { chromium } from "playwright";

function sleep(ms: number): Promise<void> {
  return new Promise((r) => setTimeout(r, ms));
}

async function waitForServer(url: string, attempts = 100): Promise<void> {
  for (let i = 0; i < attempts; i++) {
    try {
      const res = await fetch(url);
      await res.arrayBuffer();
      if (res.ok) return;
    } catch {
      /* retry */
    }
    await sleep(200);
  }
  throw new Error(`server not ready: ${url}`);
}

async function hardDrop(page: Awaited<ReturnType<Awaited<ReturnType<typeof chromium.launch>>["newPage"]>>) {
  // Dispatch on window so createKeyboardSource(globalThis) always receives it
  await page.evaluate(() => {
    window.dispatchEvent(
      new KeyboardEvent("keydown", {
        key: "ArrowUp",
        code: "ArrowUp",
        bubbles: true,
        cancelable: true,
      }),
    );
  });
}

Deno.test({
  name: "start → hard drop → result",
  sanitizeResources: false,
  sanitizeOps: false,
  async fn() {
    const PORT = 4173;
    const ORIGIN = `http://127.0.0.1:${PORT}`;

    const server = spawn(
      "npx",
      ["--yes", "serve", ".", "-l", String(PORT)],
      { stdio: "ignore", shell: true },
    );

    let browser: Awaited<ReturnType<typeof chromium.launch>> | undefined;
    try {
      await waitForServer(`${ORIGIN}/index.html`);
      browser = await chromium.launch({
        headless: true,
        args: ["--no-sandbox", "--disable-gpu"],
      });
      const page = await browser.newPage();
      const errors: string[] = [];
      page.on("pageerror", (e) => errors.push(String(e)));
      page.on("console", (msg) => {
        if (msg.type() === "error") errors.push(`console: ${msg.text()}`);
      });

      await page.goto(`${ORIGIN}/index.html?e2e=1`, {
        waitUntil: "domcontentloaded",
        timeout: 30_000,
      });

      await page.waitForSelector("#btn-start", { timeout: 15_000 });
      await page.locator("#btn-start").click();

      await page.waitForSelector("#screen-playing:not([hidden])", {
        timeout: 15_000,
      });
      await page.waitForSelector("#game-container canvas", { timeout: 30_000 });

      await page.waitForSelector("#next-panel", { timeout: 5_000 });
      await page.waitForFunction(() => {
        const a = document.getElementById("next-pivot")?.textContent?.trim();
        const b = document.getElementById("next-secondary")?.textContent?.trim();
        return !!(a && a.length > 0 && b && b.length > 0);
      }, { timeout: 10_000 });

      const deadline = Date.now() + 60_000;
      while (Date.now() < deadline) {
        if (await page.locator("#screen-result:not([hidden])").count()) break;
        await hardDrop(page);
        await sleep(50);
      }

      if (!(await page.locator("#screen-result:not([hidden])").count())) {
        const title = await page.locator("#screen-title").getAttribute("hidden");
        const playing = await page.locator("#screen-playing").getAttribute("hidden");
        const err = errors.length ? errors.join("; ") : "(no page errors)";
        throw new Error(
          `result not shown within timeout; title.hidden=${title} playing.hidden=${playing}; ${err}`,
        );
      }

      const resultText = await page.locator("#result-score").innerText();
      if (!/^Score:\s*\d+/.test(resultText)) {
        throw new Error(`unexpected result score text: ${resultText}`);
      }
      if (errors.length) {
        throw new Error(`page errors: ${errors.join("; ")}`);
      }
    } finally {
      if (browser) await browser.close();
      server.kill("SIGTERM");
    }
  },
});
