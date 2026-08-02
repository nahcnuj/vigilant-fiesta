/**
 * E2E: start → hard-drop only → game over → result.
 * Uses `?e2e=1` (digits-only pairs) so the board fills without formula clears.
 */
import { spawn } from "node:child_process";
import { chromium } from "playwright";

function sleep(ms: number): Promise<void> {
  return new Promise((r) => setTimeout(r, ms));
}

async function waitForServer(url: string, attempts = 50): Promise<void> {
  for (let i = 0; i < attempts; i++) {
    try {
      const res = await fetch(url);
      await res.arrayBuffer();
      if (res.ok) return;
    } catch {
      /* retry */
    }
    await sleep(150);
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

      await page.goto(`${ORIGIN}/index.html?e2e=1`, {
        waitUntil: "domcontentloaded",
      });

      await page.waitForSelector("#screen-title:not([hidden])", {
        timeout: 10_000,
      });
      await page.locator("#btn-start").click();

      await page.waitForSelector("#screen-playing:not([hidden])", {
        timeout: 10_000,
      });
      await page.waitForSelector("#game-container canvas", { timeout: 15_000 });

      const deadline = Date.now() + 60_000;
      while (Date.now() < deadline) {
        const resultVisible = await page
          .locator("#screen-result:not([hidden])")
          .count();
        if (resultVisible > 0) break;
        await page.keyboard.press("ArrowUp");
        await sleep(40);
      }

      await page.waitForSelector("#screen-result:not([hidden])", {
        timeout: 5_000,
      });
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
