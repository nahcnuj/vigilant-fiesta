import { assertEquals, assert } from "https://deno.land/std@0.203.0/testing/asserts.ts";
import { buildShareText, dataUrlToFile } from "./social-share.ts";

Deno.test("buildShareText formats score to two decimal places with URL and hashtag", () => {
  const text = buildShareText(123.456, "https://example.com/");
  assertEquals(
    text,
    "スコアは 123.46 でした。 https://example.com/ #落ち物パズルゲーム・蘇",
  );
});

Deno.test("buildShareText formats integer score to two decimal places", () => {
  const text = buildShareText(0, "https://example.com/");
  assertEquals(
    text,
    "スコアは 0.00 でした。 https://example.com/ #落ち物パズルゲーム・蘇",
  );
});

Deno.test("dataUrlToFile converts valid PNG data URL to File object", () => {
  const dataUrl = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==";
  const file = dataUrlToFile(dataUrl, "final-board.png");
  assert(file !== null);
  assertEquals(file?.name, "final-board.png");
  assertEquals(file?.type, "image/png");
});

Deno.test("dataUrlToFile returns null for null or invalid data URL", () => {
  assertEquals(dataUrlToFile(null, "final-board.png"), null);
  assertEquals(dataUrlToFile("invalid", "final-board.png"), null);
});
