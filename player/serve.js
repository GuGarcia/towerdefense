/**
 * Serveur de dev / preview : sert les fichiers statiques (HTML, JS, etc.).
 * Lancer avec : bun run dev (hot reload) ou bun run preview
 */
const PORT = 5173;
const ROOT = import.meta.dir;

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
