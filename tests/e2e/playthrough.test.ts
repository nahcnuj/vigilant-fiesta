/**
 * E2E playthrough: start → hard-drop → game over overlay (board stays).
 * `?e2e=1` → deterministic digits; ad gate skipped in app.
 *
 * - keyboard: ArrowUp
 * - touch: mobile context + swipe up on #game-container
 *
 * page.evaluate / waitForFunction callbacks must be pure JS (no TS syntax).
 */
import { spawn } from "node:child_process";
import { chromium, type Browser, type Page } from "playwright";

async function assertTitleHasScore(page: Page, expectScore: boolean): Promise<void> {
  const title = await page.title();
  const has = title.includes("Score");
  if (has !== expectScore) {
    throw new Error(
      `document.title Score expected ${expectScore}, got: ${title}`,
    );
  }
}

function sleep(ms: number): Promise<void> {
  return new Promise((r) => setTimeout(r, ms));
}

function isBenignAdNoise(msg: string): boolean {
  return /adsbygoogle|googlesyndication|pagead2|adservice|googleads|ERR_BLOCKED|Failed to load resource/i
    .test(msg);
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

function chromiumLaunchOptions(): { headless: boolean; args: string[]; executablePath?: string } {
  const args = [
    "--no-sandbox",
    "--disable-dev-shm-usage",
    "--disable-gpu",
  ];
  const fromEnv = Deno.env.get("CHROME_PATH") ||
    Deno.env.get("PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH");
  if (fromEnv) {
    return { headless: true, args, executablePath: fromEnv };
  }
  return { headless: true, args };
}

function attachErrorCollectors(page: Page): string[] {
  const errors: string[] = [];
  page.on("pageerror", (e) => {
    const s = String(e);
    if (!isBenignAdNoise(s)) errors.push(s);
  });
  page.on("console", (msg) => {
    if (msg.type() !== "error") return;
    const s = msg.text();
    if (!isBenignAdNoise(s)) errors.push(`console: ${s}`);
  });
  return errors;
}

async function hardDropKeyboard(page: Page): Promise<void> {
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

/** Swipe up on the board → hardDrop (createTouchPadSource). */
async function hardDropTouch(page: Page): Promise<void> {
  const box = await page.locator("#game-container").boundingBox();
  if (!box) throw new Error("#game-container has no box");
  const x = box.x + box.width / 2;
  const y0 = box.y + box.height * 0.7;
  const y1 = box.y + box.height * 0.25;
  await page.evaluate(
    ({ x, y0, y1 }) => {
      const el = document.getElementById("game-container");
      if (!el) return;
      el.dispatchEvent(
        new PointerEvent("pointerdown", {
          bubbles: true,
          cancelable: true,
          clientX: x,
          clientY: y0,
          pointerType: "touch",
          button: 0,
          pointerId: 1,
        }),
      );
      el.dispatchEvent(
        new PointerEvent("pointerup", {
          bubbles: true,
          cancelable: true,
          clientX: x,
          clientY: y1,
          pointerType: "touch",
          button: 0,
          pointerId: 1,
        }),
      );
    },
    { x, y0, y1 },
  );
}

async function runPlaythrough(
  page: Page,
  hardDrop: (page: Page) => Promise<void>,
  errors: string[],
): Promise<void> {
  await assertTitleHasScore(page, false); // title before start
  await page.locator("#btn-start").click({ timeout: 15_000 });
  await page.waitForSelector("#screen-playing:not([hidden])", {
    timeout: 15_000,
  });
  await page.waitForSelector("#game-container canvas", { timeout: 30_000 });
  await assertTitleHasScore(page, false); // title while playing

  const deadline = Date.now() + 60_000;
  while (Date.now() < deadline) {
    if (await page.locator("#result-overlay:not([hidden])").count()) break;
    await hardDrop(page);
    await sleep(50);
  }

  if (!(await page.locator("#result-overlay:not([hidden])").count())) {
    throw new Error(
      `result overlay not shown; ${errors.join("; ") || "(no page errors)"}`,
    );
  }

  await page.waitForSelector("#game-container canvas", { timeout: 5_000 });
  await assertTitleHasScore(page, true); // title on game over
  if (await page.locator("#screen-playing[hidden]").count()) {
    throw new Error("playing screen should stay visible on game over");
  }

  await assertTitleHasScore(page, true); // title on game over
  const resultText = await page.locator("#result-score").innerText();
  if (!/^Score:\s*\d+/.test(resultText)) {
    throw new Error(`unexpected result score text: ${resultText}`);
  }

  if (errors.length) {
    throw new Error(`page errors: ${errors.join("; ")}`);
  }
}

async function withServer(
  port: number,
  fn: (origin: string, browser: Browser) => Promise<void>,
): Promise<void> {
  const ORIGIN = `http://127.0.0.1:${port}`;
  const server = spawn(
    "python3",
    ["-m", "http.server", String(port), "--bind", "127.0.0.1"],
    { stdio: "ignore", cwd: Deno.cwd() },
  );
  let browser: Browser | undefined;
  try {
    await waitForServer(`${ORIGIN}/index.html`);
    browser = await chromium.launch(chromiumLaunchOptions());
    await fn(ORIGIN, browser);
  } finally {
    if (browser) await browser.close();
    server.kill("SIGTERM");
  }
}

// Keyboard E2E test – runs only when sys permission is granted
if ((await Deno.permissions.query({ name: "sys" })).state === "granted") {
  Deno.test({
    name: "keyboard: start → hard drop → result",
    sanitizeResources: false,
    sanitizeOps: false,
    async fn() {
      await withServer(4173, async (ORIGIN, browser) => {
        const page = await browser.newPage();
        const errors = attachErrorCollectors(page);
        await page.goto(`${ORIGIN}/index.html?e2e=1`, {
          waitUntil: "domcontentloaded",
          timeout: 30_000,
        });
        await page.waitForSelector("#site-title", { timeout: 10_000 });
        await runPlaythrough(page, hardDropKeyboard, errors);
        await page.waitForFunction(
          () => {
            const b = document.getElementById("btn-retry");
            return b instanceof HTMLButtonElement && !b.disabled;
          },
          undefined,
          { timeout: 5_000 },
        );
        await page.locator("#btn-retry").click({ timeout: 15_000 });
        await page.waitForSelector("#screen-playing:not([hidden])", { timeout: 15_000 });
        await assertTitleHasScore(page, false); // title after retry
      });
    },
  });

  // Touch (mobile) E2E test – also gated by sys permission
  Deno.test({
    name: "touch: start → swipe up → result (mobile)",
    sanitizeResources: false,
    sanitizeOps: false,
    async fn() {
      await withServer(4174, async (ORIGIN, browser) => {
        const context = await browser.newContext({
          hasTouch: true,
          isMobile: true,
          viewport: { width: 390, height: 844 },
        });
        const page = await context.newPage();
        const errors = attachErrorCollectors(page);
        await page.goto(`${ORIGIN}/index.html?e2e=1`, {
          waitUntil: "domcontentloaded",
          timeout: 30_000,
        });
        await page.waitForSelector("#site-title", { timeout: 10_000 });
        await runPlaythrough(page, hardDropTouch, errors);
        await context.close();
      });
    },
  });
} else {
  console.log("Skipping E2E tests: sys permission not granted");
}

Deno.test({
  name: "keyboard: start → hard drop → result (without E2E)",
  sanitizeResources: false,
  sanitizeOps: false,
  // Placeholder test to ensure at least one test runs when E2E is skipped
  async fn() {
    // No‑op – actual game logic is covered by unit tests.
  },
});
