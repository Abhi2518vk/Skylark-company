import { createServer } from "node:http";
import { createReadStream } from "node:fs";
import { stat } from "node:fs/promises";
import { resolve, dirname, extname, sep } from "node:path";
import { fileURLToPath } from "node:url";
const root = resolve(dirname(fileURLToPath(import.meta.url)), "../dist");
const types = {
  ".html": "text/html; charset=utf-8",
  ".css": "text/css",
  ".js": "text/javascript",
  ".webp": "image/webp",
  ".png": "image/png",
  ".mp4": "video/mp4",
  ".webm": "video/webm",
  ".txt": "text/plain",
  ".xml": "application/xml",
  ".json": "application/json",
};
const server = createServer(async (request, response) => {
  if (!["GET", "HEAD"].includes(request.method)) {
    response.writeHead(405).end();
    return;
  }
  let path;
  try {
    path = decodeURIComponent(
      new URL(request.url, "http://localhost").pathname,
    );
  } catch {
    response.writeHead(400).end();
    return;
  }
  const file = resolve(
    root,
    `.${path.endsWith("/") ? `${path}index.html` : path}`,
  );
  if (!file.startsWith(root + sep)) {
    response.writeHead(403).end();
    return;
  }
  let info;
  try {
    info = await stat(file);
  } catch (error) {
    if (error.code !== "ENOENT") console.error(error);
    response.writeHead(404).end("Not found");
    return;
  }
  if (!info.isFile()) {
    response.writeHead(404).end();
    return;
  }
  const headers = {
    "Content-Type": types[extname(file)] || "application/octet-stream",
    "X-Content-Type-Options": "nosniff",
    "Accept-Ranges": "bytes",
  };
  let start = 0;
  let end = info.size - 1;
  let status = 200;
  if (request.headers.range) {
    const match = /^bytes=(\d+)-(\d*)$/.exec(request.headers.range);
    if (!match) {
      response
        .writeHead(416, { "Content-Range": `bytes */${info.size}` })
        .end();
      return;
    }
    start = Number(match[1]);
    end = match[2] ? Math.min(Number(match[2]), end) : end;
    if (start > end || start >= info.size) {
      response
        .writeHead(416, { "Content-Range": `bytes */${info.size}` })
        .end();
      return;
    }
    status = 206;
    headers["Content-Range"] = `bytes ${start}-${end}/${info.size}`;
  }
  headers["Content-Length"] = info.size === 0 ? 0 : end - start + 1;
  response.writeHead(status, headers);
  if (request.method === "HEAD" || info.size === 0) {
    response.end();
    return;
  }
  const stream = createReadStream(file, { start, end });
  stream.on("error", (error) => {
    console.error(error);
    response.destroy();
  });
  stream.pipe(response);
});
server.listen(8793, "127.0.0.1", () =>
  console.log("Skylark preview: http://127.0.0.1:8793"),
);
