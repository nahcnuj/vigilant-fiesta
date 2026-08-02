/**
 * E2E: start → hard-drop only → game over → result.
 * Uses `?e2e=1` (digits-only pairs) so the board fills without formula clears.
 * Asserts Next panel shows upcoming pair (not the falling piece on the board).
 */
import { spawn } from "node:child_process";
import { chromium } from "playwright";

function sleep(ms: number): Promise<void> {
  return new Promise((r) => setTimeout(r, ms));
}

async function waitForServer(url: string, attempts = 80): Promise<void> {
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
      browser = await chromium.launch({ headless: true });
      const page = await browser.newPage();
      const errors: string[] = [];
      page.on("pageerror", (e) => errors.push(String(e)));
      page.on("console", (msg) => {
        if (msg.type() === "error") errors.push(`console: ${msg.text()}`);
      });

      await page.goto(`${ORIGIN}/index.html?e2e=1`, {
        waitUntil: "networkidle",
      });

      await page.waitForSelector("#screen-title:not([hidden])", {
        timeout: 15_000,
      });
      await page.locator("#btn-start").click();

      await page.waitForSelector("#screen-playing:not([hidden])", {
        timeout: 15_000,
      });
      await page.locator("#game-container").click({ timeout: 15_000 });
      await page.waitForSelector("#game-container canvas", { timeout: 20_000 });

      // Next = side panel with non-empty labels for upcoming pair
      await page.waitForSelector("#next-panel", { timeout: 5_000 });
      await page.waitForFunction(() => {
        const a = document.getElementById("next-pivot")?.textContent?.trim();
        const b = document.getElementById("next-secondary")?.textContent?.trim();
        return !!(a && b && a.length > 0 && b.length > 0);
      }, { timeout: 5_000 });

      const nextBefore = await page.locator("#next-pivot").innerText();

      const deadline = Date.now() + 90_000;
      while (Date.now() < deadline) {
        const resultVisible = await page
          .locator("#screen-result:not([hidden])")
          .count();
        if (resultVisible > 0) break;
        await page.keyboard.press("ArrowUp");
        await sleep(80);
      }

      await page.waitForSelector("#screen-result:not([hidden])", {
        timeout: 10_000,
      });
      const resultText = await page.locator("#result-score").innerText();
      if (!/^Score:\s*\d+/.test(resultText)) {
        throw new Error(`unexpected result score text: ${resultText}`);
      }
      if (errors.length) {
        throw new Error(`page errors: ${errors.join("; ")}`);
      }
      // silence unused if game ends before we sample again
      void nextBefore;
    } finally {
      if (browser) await browser.close();
      server.kill("SIGTERM");
    }
  },
});
