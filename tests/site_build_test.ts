import { assert } from "https://deno.land/std@0.224.0/assert/mod.ts";
import { existsSync } from "https://deno.land/std@0.224.0/fs/mod.ts";

Deno.test("Site build generates index.html", async () => {
  // 1. Lumeのビルドコマンドを実行
  const command = new Deno.Command(Deno.execPath(), {
    args: ["task", "build"],
    stdout: "piped",
    stderr: "piped",
  });
  
  const { code } = await command.output();
  assert(code === 0, "Build command failed");

  // 2. 出力先に index.html が生成されているか確認
  const indexHtmlExists = existsSync("./dist/index.html");
  assert(indexHtmlExists, "index.html was not generated in dist folder");
});
