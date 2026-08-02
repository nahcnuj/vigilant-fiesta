import { assertEquals, assertStringIncludes } from "https://deno.land/std@0.203.0/testing/asserts.ts";

const script = new URL("../scripts/coverage_report.ts", import.meta.url).pathname;
// Windows: URL pathname starts with /C:/...
const scriptPath = Deno.build.os === "windows" && script.startsWith("/")
  ? script.slice(1)
  : script;

async function runReport(table: string): Promise<{ code: number; md: string; stderr: string }> {
  const dir = await Deno.makeTempDir();
  const input = `${dir}/coverage.txt`;
  const output = `${dir}/coverage.md`;
  // Include ANSI sequences to prove the parser strips them (broken-table root cause)
  const withAnsi = table.replace(
    /board\.ts/,
    "\u001b[32mboard.ts\u001b[0m",
  );
  await Deno.writeTextFile(input, withAnsi);
  const cmd = new Deno.Command("deno", {
    args: ["run", "--allow-read", "--allow-write", scriptPath, input, output],
    stdout: "piped",
    stderr: "piped",
  });
  const { code, stderr } = await cmd.output();
  let md = "";
  try {
    md = await Deno.readTextFile(output);
  } catch {
    md = "";
  }
  return {
    code,
    md,
    stderr: new TextDecoder().decode(stderr),
  };
}

Deno.test("coverage_report builds markdown table and passes ≥90%", async () => {
  const table = `| File      | Branch % | Function % | Line % |
| --------- | -------- | ---------- | ------ |
| board.ts  |    100.0 |      100.0 |  100.0 |
| All files |     95.0 |       92.0 |   91.0 |
`;
  const { code, md } = await runReport(table);
  assertEquals(code, 0);
  assertStringIncludes(md, "| board.ts");
  assertStringIncludes(md, "| All files");
  assertStringIncludes(md, "Branch 95.0%");
  assertStringIncludes(md, "✅ All metrics ≥ 90%");
  // No raw ANSI in output
  assertEquals(md.includes("\u001b"), false);
});

Deno.test("coverage_report fails when overall metric < 90%", async () => {
  const table = `| File      | Branch % | Function % | Line % |
| --------- | -------- | ---------- | ------ |
| game.ts   |     80.0 |       70.0 |   85.0 |
| All files |     80.0 |       70.0 |   85.0 |
`;
  const { code, md, stderr } = await runReport(table);
  assertEquals(code, 1);
  assertStringIncludes(md, "❌ Below threshold");
  assertStringIncludes(stderr, "Coverage threshold failed");
});
