// src/generate_assets.ts

/** Simple script that copies placeholder assets into the assets directory.
 *  In a real project this could generate a spritesheet from individual PNGs.
 */
import { copyFile } from "https://deno.land/std@0.203.0/fs/mod.ts";

const placeholder = "assets/placeholder.txt"; // using the placeholder txt as a dummy asset
const destDir = "assets";

// Ensure the assets directory exists (create if missing)
await Deno.mkdir(destDir, { recursive: true });
await copyFile(placeholder, `${destDir}/placeholder.txt`);
console.log("Assets prepared.");
