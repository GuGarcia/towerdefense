/**
 * Build pour la prod : bundle le JS, copie index.html en pointant vers le bundle.
 */
import { mkdir, writeFile, readFile } from "fs/promises";
import { join } from "path";

const ROOT = import.meta.dir;
const DIST = join(ROOT, "dist");

await mkdir(DIST, { recursive: true });

// Bundle avec Bun
const result = await Bun.build({
  entrypoints: [join(ROOT, "src", "index.js")],
  outdir: DIST,
  minify: true,
  target: "browser",
});

if (!result.success) {
  console.error("Build failed:", result.logs);
  process.exit(1);
}

// Copier index.html en remplaçant le script par le bundle
const indexPath = join(ROOT, "index.html");
let html = await readFile(indexPath, "utf-8");
html = html.replace(/src="\/src\/index\.js"/, 'src="index.js"');
await writeFile(join(DIST, "index.html"), html);

console.log("Build OK → dist/");
console.log("  index.html, index.js");
