// build.ts - simple bundling script for Deno
// Run with: deno run --allow-read --allow-write --allow-run build.ts

const cmd = ["deno", "bundle", "src/main.ts", "dist/main.js"];
const p = Deno.run({ cmd, stdout: "inherit", stderr: "inherit" });
const status = await p.status();
p.close();
if (!status.success) {
  console.error("Bundling failed");
  Deno.exit(1);
}
console.log("Bundling succeeded");
