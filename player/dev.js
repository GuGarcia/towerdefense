/**
 * Dev: build once, run watch (rebuild on change), serve dist/.
 * Refresh the page manually after changes.
 */
import { join } from "path";
import { mkdir, writeFile, readFile } from "fs/promises";

const ROOT = import.meta.dir;
const DIST = join(ROOT, "dist");

async function buildOnce() {
  await mkdir(DIST, { recursive: true });
  const result = await Bun.build({
    entrypoints: [join(ROOT, "src", "index.ts")],
    outdir: DIST,
    minify: false,
    target: "browser",
  });
  if (!result.success) {
    console.error("Build failed:", result.logs);
    process.exit(1);
  }
  let html = await readFile(join(ROOT, "index.html"), "utf-8");
  html = html.replace(/src="\/src\/index\.js"/, 'src="index.js"');
  await writeFile(join(DIST, "index.html"), html);
  console.log("Build OK → dist/");
}

await buildOnce();

Bun.spawn({
  cmd: ["bun", "build", join(ROOT, "src", "index.ts"), "--outdir", DIST, "--watch"],
  cwd: ROOT,
  stdout: "inherit",
  stderr: "inherit",
});

const MIME = { ".html": "text/html", ".js": "application/javascript", ".json": "application/json", ".css": "text/css" };
const getMime = (path) => MIME[path.slice(path.lastIndexOf("."))] ?? "application/octet-stream";

Bun.serve({
  port: 5173,
  async fetch(req) {
    const path = new URL(req.url).pathname === "/" ? "/index.html" : new URL(req.url).pathname;
    const file = Bun.file(join(DIST, path.slice(1) || "index.html"));
    const exists = await file.exists();
    if (!exists) return new Response("Not found", { status: 404 });
    return new Response(file, { headers: { "Content-Type": getMime(path) } });
  },
});

console.log("Server: http://localhost:5173 (serving dist/, watch — refresh page manually)");
