/**
 * E2E smoke: serve repo root, open index.html, expect canvas under #game-container.
 *
 *   deno task build
 *   npm install playwright
 *   npx playwright install chromium
 *   node tests/e2e/smoke.mjs
 *
 * CI: see .github/workflows/ci.yml e2e job.
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

  // Pixi ticker keeps the page active; do not wait for networkidle
  await page.goto(`${ORIGIN}/index.html`, { waitUntil: "domcontentloaded" });

  const title = await page.title();
  if (!title.includes("落ち物")) {
    throw new Error(`unexpected title: ${title}`);
  }

  await page.waitForSelector("#game-container canvas", { timeout: 15000 });
  const canvasCount = await page.locator("#game-container canvas").count();
  if (canvasCount < 1) {
    throw new Error("expected canvas inside #game-container");
  }
  if (errors.length) {
    throw new Error(`page errors: ${errors.join("; ")}`);
  }
  console.log("e2e smoke ok");
} finally {
  if (browser) await browser.close();
  server.kill("SIGTERM");
}
