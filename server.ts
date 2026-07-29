// server.ts – Simple static file server for Deno
// Serves files from the `dist` directory (Vite build output)
// Run with: deno run -A --watch server.ts

import { serve } from "https://deno.land/std@0.224.0/http/server.ts";
import { extname, join } from "https://deno.land/std@0.224.0/path/mod.ts";

const PORT = 8080;
const DIST_DIR = new URL("./dist/", import.meta.url).pathname;

// Basic MIME type map
const MIME_TYPES: Record<string, string> = {
  ".html": "text/html",
  ".js": "application/javascript",
  ".css": "text/css",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".svg": "image/svg+xml",
  ".json": "application/json",
  ".wasm": "application/wasm",
};

async function handler(request: Request): Promise<Response> {
  const url = new URL(request.url);
  // Resolve the requested path relative to dist
  let pathname = decodeURIComponent(url.pathname);
  if (pathname === "/") pathname = "/index.html";
  const filePath = join(DIST_DIR, pathname);
  try {
    const file = await Deno.open(filePath, { read: true });
    const fileInfo = await file.stat();
    if (fileInfo.isDirectory) {
      // fallback to index.html for directories (SPA routing)
      file.close();
      return await serveFile("/index.html");
    }
    const ext = extname(filePath);
    const contentType = MIME_TYPES[ext] || "application/octet-stream";
    const response = new Response(file.readable, {
      status: 200,
      headers: { "content-type": contentType },
    });
    return response;
  } catch {
    // If file not found, serve index.html (helps SPA client‑side routing)
    return await serveFile("/index.html");
  }
}

async function serveFile(path: string): Promise<Response> {
  const fullPath = join(DIST_DIR, path);
  const file = await Deno.open(fullPath, { read: true });
  const ext = extname(fullPath);
  const contentType = MIME_TYPES[ext] || "text/html";
  return new Response(file.readable, {
    status: 200,
    headers: { "content-type": contentType },
  });
}

console.log(`🚀 Deno server listening on http://localhost:${PORT}`);
await serve(handler, { port: PORT });
