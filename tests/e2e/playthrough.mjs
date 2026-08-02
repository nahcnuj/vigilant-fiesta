/**
 * E2E: start → hard-drop only → game over → result screen.
 *
 * Uses `?e2e=1` so pairs are digits-only (no formula clears), so the board
 * fills and game over is reachable by hard drops alone.
 *
 *   deno task build && node tests/e2e/playthrough.mjs
 */
import { spawn } from "node:child_process";
import { chromium } from "playwright";

const PORT = 4173;
const ORIGIN = `http://127.0.0.1:${PORT}`;

function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

async function waitForServer(url, attempts = 50) {
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

const server = spawn(
  "npx",
  ["--yes", "serve", ".", "-l", String(PORT)],
  { stdio: "ignore", shell: true },
);

let browser;
try {
  await waitForServer(`${ORIGIN}/index.html`);
  browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();
  const errors = [];
  page.on("pageerror", (e) => errors.push(String(e)));

  await page.goto(`${ORIGIN}/index.html?e2e=1`, {
    waitUntil: "domcontentloaded",
  });

  // Title
  await page.waitForSelector('#screen-title:not([hidden])', { timeout: 10000 });
  await page.locator("#btn-start").click();

  // Playing
  await page.waitForSelector('#screen-playing:not([hidden])', { timeout: 10000 });
  await page.waitForSelector("#game-container canvas", { timeout: 15000 });

  // Hard drop only until result (game over)
  const deadline = Date.now() + 60_000;
  while (Date.now() < deadline) {
    const resultVisible = await page.locator('#screen-result:not([hidden])')
      .count();
    if (resultVisible > 0) break;
    await page.keyboard.press("ArrowUp");
    await sleep(40);
  }

  await page.waitForSelector('#screen-result:not([hidden])', { timeout: 5000 });
  const resultText = await page.locator("#result-score").innerText();
  if (!/^Score:\s*\d+/.test(resultText)) {
    throw new Error(`unexpected result score text: ${resultText}`);
  }

  if (errors.length) {
    throw new Error(`page errors: ${errors.join("; ")}`);
  }
  console.log("e2e playthrough ok:", resultText);
} finally {
  if (browser) await browser.close();
  server.kill("SIGTERM");
}
