import { readFile, mkdir, copyFile, stat, writeFile } from "node:fs/promises";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";
const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const pages = ["index.html", "credits.html"];
const files = new Set([
  ...pages,
  "styles.css",
  "script.js",
  "robots.txt",
  "sitemap.xml",
  ".nojekyll",
]);
for (const page of pages) {
  const html = await readFile(resolve(root, page), "utf8");
  for (const match of html.matchAll(
    /(?:src|href|poster|data-product-image)="([^"#]+)"/g,
  )) {
    const path = match[1];
    if (!/^(https?:|tel:|mailto:)/.test(path)) files.add(path);
  }
}
for (const file of files) {
  if (file.includes("..") || file.startsWith("/"))
    throw new Error(`Unsafe asset path: ${file}`);
  const source = resolve(root, file);
  if (!(await stat(source)).isFile()) throw new Error(`Missing asset: ${file}`);
  const target = resolve(root, "dist", file);
  await mkdir(dirname(target), { recursive: true });
  await copyFile(source, target);
}
const bytes = await Promise.all(
  [...files].map(async (file) => (await stat(resolve(root, file))).size),
);
await writeFile(
  resolve(root, "dist", "build-manifest.json"),
  JSON.stringify(
    { files: [...files], bytes: bytes.reduce((a, b) => a + b, 0) },
    null,
    2,
  ),
);
console.log(
  `Build complete: ${files.size} deployable files; ${(bytes.reduce((a, b) => a + b, 0) / 1048576).toFixed(2)} MiB. Local asset references verified.`,
);
