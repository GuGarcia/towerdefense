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

console.log("Build OK → dist/");
console.log("  index.html, index.js");
