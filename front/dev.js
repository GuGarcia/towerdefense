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
    entrypoints: [join(ROOT, "src", "app", "index.tsx")],
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
  try {
    const buf = await readFile(join(ROOT, "gameparams.json"));
    await writeFile(join(DIST, "gameparams.json"), buf);
  } catch {
    // ignore: optional asset
  }
  try {
    const css = await readFile(join(ROOT, "player.css"));
    await writeFile(join(DIST, "player.css"), css);
  } catch {
    // ignore: optional asset
  }
  try {
    const manifest = await readFile(join(ROOT, "manifest.json"));
    await writeFile(join(DIST, "manifest.json"), manifest);
  } catch {
    // ignore: optional asset
  }
  try {
    await mkdir(join(DIST, "icons"), { recursive: true });
    const icon = await readFile(join(ROOT, "icons", "icon.svg"));
    await writeFile(join(DIST, "icons", "icon.svg"), icon);
  } catch {
    // ignore: optional asset
  }
  try {
    const sw = await readFile(join(ROOT, "sw.js"));
    await writeFile(join(DIST, "sw.js"), sw);
  } catch {
    // ignore: optional asset
  }
  console.log("Build OK → dist/");
}

await buildOnce();

Bun.spawn({
  cmd: ["bun", "build", join(ROOT, "src", "app", "index.tsx"), "--outdir", DIST, "--watch"],
  cwd: ROOT,
  stdout: "inherit",
  stderr: "inherit",
});

const MIME = { ".html": "text/html", ".js": "application/javascript", ".json": "application/json", ".css": "text/css" };
const getMime = (path) => MIME[path.slice(path.lastIndexOf("."))] ?? "application/octet-stream";

Bun.serve({
  port: 5173,
  async fetch(req) {
    const pathname = new URL(req.url).pathname;
    const path = pathname === "/" ? "/index.html" : pathname;
    const filePath = path.slice(1) || "index.html";
    const file = Bun.file(join(DIST, filePath));
    const exists = await file.exists();
    // SPA fallback: unknown paths serve index.html for client-side routing
    if (!exists) {
      const html = Bun.file(join(DIST, "index.html"));
      return new Response(html, { headers: { "Content-Type": "text/html" } });
    }
    return new Response(file, { headers: { "Content-Type": getMime(path) } });
  },
});

console.log("Server: http://localhost:5173 (serving dist/, watch — refresh page manually)");
