/**
 * Parse `deno coverage` text output, emit a clean Markdown table for PR comments,
 * and exit non‑zero if any All‑files metric is below THRESHOLD.
 *
 * Usage: deno run -A scripts/coverage_report.ts coverage.txt coverage.md
 */
const THRESHOLD = 90;

const inputPath = Deno.args[0] ?? "coverage.txt";
const outputPath = Deno.args[1] ?? "coverage.md";

// Strip BOM / UTF-16 LE null bytes from PowerShell `>` redirects
const rawBytes = await Deno.readFile(inputPath);
let raw: string;
if (rawBytes.length >= 2 && rawBytes[0] === 0xff && rawBytes[1] === 0xfe) {
  // UTF-16 LE
  raw = new TextDecoder("utf-16le").decode(rawBytes.subarray(2));
} else if (rawBytes.length >= 3 && rawBytes[0] === 0xef && rawBytes[1] === 0xbb && rawBytes[2] === 0xbf) {
  raw = new TextDecoder("utf-8").decode(rawBytes.subarray(3));
} else {
  raw = new TextDecoder("utf-8").decode(rawBytes).replace(/\0/g, "");
}
// Strip ANSI color codes (deno colors table cells when stdout is a TTY / PowerShell pipe)
raw = raw.replace(/\u001b\[[0-9;]*m/g, "");
const lines = raw.split(/\r?\n/).map((l) => l.trimEnd()).filter((l) => l.length > 0);

type Row = { file: string; branch: number; func: number; line: number };
const rows: Row[] = [];

for (const line of lines) {
  // | file | branch | function | line |
  const m = line.match(
    /^\|\s*([^|]+?)\s*\|\s*([\d.]+)\s*\|\s*([\d.]+)\s*\|\s*([\d.]+)\s*\|$/,
  );
  if (!m) continue;
  const file = m[1].trim();
  if (file === "File" || /^-+$/.test(file.replace(/\s/g, ""))) continue;
  rows.push({
    file,
    branch: Number(m[2]),
    func: Number(m[3]),
    line: Number(m[4]),
  });
}

if (rows.length === 0) {
  console.error("No coverage rows parsed from", inputPath);
  console.error(raw);
  Deno.exit(1);
}

const all = rows.find((r) => r.file === "All files") ?? rows[rows.length - 1];

function pad(s: string, n: number, right = false): string {
  if (s.length >= n) return s;
  const space = " ".repeat(n - s.length);
  return right ? space + s : s + space;
}

const fileW = Math.max(4, ...rows.map((r) => r.file.length));
const colW = 10;

const mdLines = [
  "### 📊 Coverage Report",
  "",
  `| ${pad("File", fileW)} | ${pad("Branch %", colW, true)} | ${pad("Function %", colW, true)} | ${pad("Line %", colW, true)} |`,
  `| ${"-".repeat(fileW)} | ${"-".repeat(colW - 1)}: | ${"-".repeat(colW - 1)}: | ${"-".repeat(colW - 1)}: |`,
];

for (const r of rows) {
  mdLines.push(
    `| ${pad(r.file, fileW)} | ${pad(r.branch.toFixed(1), colW, true)} | ${pad(r.func.toFixed(1), colW, true)} | ${pad(r.line.toFixed(1), colW, true)} |`,
  );
}

const below: string[] = [];
if (all.branch < THRESHOLD) below.push(`branch ${all.branch}%`);
if (all.func < THRESHOLD) below.push(`function ${all.func}%`);
if (all.line < THRESHOLD) below.push(`line ${all.line}%`);

const pass = below.length === 0;
mdLines.push(
  "",
  `**Overall:** Branch ${all.branch.toFixed(1)}% · Function ${all.func.toFixed(1)}% · Line ${all.line.toFixed(1)}%`,
  "",
  pass
    ? `✅ All metrics ≥ ${THRESHOLD}%`
    : `❌ Below threshold (${THRESHOLD}%): ${below.join(", ")}`,
);

const md = mdLines.join("\n") + "\n";
await Deno.writeTextFile(outputPath, md);
console.log(md);

if (!pass) {
  console.error(`Coverage threshold failed (need ≥ ${THRESHOLD}%): ${below.join(", ")}`);
  Deno.exit(1);
}
