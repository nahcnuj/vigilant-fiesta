import { assertEquals } from "https://deno.land/std@0.203.0/testing/asserts.ts";
import { X_PIXEL_ID } from "./analytics.ts";

function countOccurrences(haystack: string, needle: string): number {
  return haystack.split(needle).length - 1;
}

Deno.test("X base pixel loads once before </head>", async () => {
  const html = await Deno.readTextFile(
    new URL("../index.html", import.meta.url),
  );
  const headEnd = html.indexOf("</head>");
  const config = `twq('config','${X_PIXEL_ID}')`;

  assertEquals(headEnd >= 0, true);
  assertEquals(countOccurrences(html, config), 1);
  assertEquals(html.indexOf(config) < headEnd, true);
  assertEquals(countOccurrences(html, "static.ads-twitter.com/uwt.js"), 1);
});
