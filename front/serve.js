/**
 * Dev / preview server: serves static files (HTML, JS, etc.).
 * SERVEDIR=dist: serve the dist/ folder (after build).
 */
import { join } from "path";

const PORT = 5173;
const ROOT = process.env.SERVEDIR ? join(import.meta.dir, process.env.SERVEDIR) : import.meta.dir;

const MIME = {
  ".html": "text/html",
  ".js": "application/javascript",
  ".json": "application/json",
  ".css": "text/css",
  ".ico": "image/x-icon",
};

function getMime(pathname) {
  const ext = pathname.slice(pathname.lastIndexOf("."));
  return MIME[ext] ?? "application/octet-stream";
}

Bun.serve({
  port: PORT,
  async fetch(req) {
    const url = new URL(req.url);
    const path = url.pathname === "/" ? "/index.html" : url.pathname;
    const file = Bun.file(ROOT + path);
    const exists = await file.exists();
    if (!exists) return new Response("Not found", { status: 404 });
    return new Response(file, {
      headers: { "Content-Type": getMime(path) },
    });
  },
});

console.log(`Server: http://localhost:${PORT}`);
