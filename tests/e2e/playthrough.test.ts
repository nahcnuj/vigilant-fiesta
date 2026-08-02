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
        args: ["--no-sandbox", "--disable-dev-shm-usage", "--disable-gpu"],
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

      await page.locator("#btn-start").click({ timeout: 15_000 });
      await page.waitForSelector("#screen-playing:not([hidden])", {
        timeout: 15_000,
      });
      await page.waitForSelector("#game-container canvas", { timeout: 30_000 });

      // Next panel must show labels for upcoming pair
      await page.waitForSelector("#next-panel", { timeout: 5_000 });
      const nextPivot = (await page.locator("#next-pivot").innerText()).trim();
      const nextSec = (await page.locator("#next-secondary").innerText()).trim();
      if (!nextPivot || !nextSec) {
        throw new Error(`Next panel empty: pivot="${nextPivot}" secondary="${nextSec}"`);
      }

      const deadline = Date.now() + 60_000;
      while (Date.now() < deadline) {
        if (await page.locator("#screen-result:not([hidden])").count()) break;
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
        await sleep(50);
      }

      if (!(await page.locator("#screen-result:not([hidden])").count())) {
        const err = errors.length ? errors.join("; ") : "(no page errors)";
        throw new Error(`result not shown within timeout; ${err}`);
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
