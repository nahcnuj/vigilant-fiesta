/** True when running under Playwright (?e2e=1): skip ads, analytics, audio. */
export function isE2e(): boolean {
  const loc = globalThis.location;
  const search = typeof loc === "object" && loc !== null
    ? String((loc as { search?: string }).search ?? "")
    : "";
  return new URLSearchParams(search).get("e2e") === "1";
}
