/**
 * Production build: bundle JS, copy index.html pointing to the bundle.
 */
import { mkdir, writeFile, readFile } from "fs/promises";
import { join } from "path";

const ROOT = import.meta.dir;
const DIST = join(ROOT, "dist");

await mkdir(DIST, { recursive: true });

// Bundle with Bun (native TypeScript)
const result = await Bun.build({
  entrypoints: [join(ROOT, "src", "index.ts")],
  outdir: DIST,
  minify: true,
  target: "browser",
});

if (!result.success) {
  console.error("Build failed:", result.logs);
  process.exit(1);
}

// Copy index.html and point script to the bundle
const indexPath = join(ROOT, "index.html");
let html = await readFile(indexPath, "utf-8");
html = html.replace(/src="\/src\/index\.js"/, 'src="index.js"');
await writeFile(join(DIST, "index.html"), html);

// Copy gameparams.json so fetch("/gameparams.json") works in browser
try {
  const buf = await readFile(join(ROOT, "gameparams.json"));
  await writeFile(join(DIST, "gameparams.json"), buf);
} catch (_) {}

// Copy player.css
try {
  const css = await readFile(join(ROOT, "player.css"));
  await writeFile(join(DIST, "player.css"), css);
} catch (_) {}

console.log("Build OK → dist/");
console.log("  index.html, index.js, player.css, gameparams.json");
