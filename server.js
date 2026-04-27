import { createReadStream } from "node:fs";
import fs from "node:fs/promises";
import http from "node:http";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { scrapeSoundCloudProfile } from "./scripts/soundcloud-scraper.js";

const __filename = fileURLToPath(import.meta.url);
const ROOT = path.dirname(__filename);
const DATA_FILE = path.join(ROOT, "data", "soundcloud_data.json");
const PORT = Number(process.env.PORT || 3000);
const CACHE_TTL_MS = Number(process.env.SOUNDCLOUD_CACHE_TTL_MS || 120000);
const LIVE_REFRESH_MS = Number(process.env.SOUNDCLOUD_LIVE_REFRESH_MS || 60000);

const MIME_TYPES = {
  ".html": "text/html; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".mp4": "video/mp4",
  ".png": "image/png",
  ".svg": "image/svg+xml",
  ".ico": "image/x-icon"
};

let cache = null;
let refreshPromise = null;

function sendJson(response, status, payload) {
  response.writeHead(status, {
    "Content-Type": "application/json; charset=utf-8",
    "Cache-Control": "no-store"
  });
  response.end(`${JSON.stringify(payload)}\n`);
}

async function readSnapshotFromDisk() {
  try {
    const text = await fs.readFile(DATA_FILE, "utf8");
    const data = JSON.parse(text);
    cache = { data, refreshedAt: Date.now(), stale: true };
    return data;
  } catch {
    return null;
  }
}

async function refreshSoundCloudData(force = false) {
  const now = Date.now();

  if (!force && cache && now - cache.refreshedAt < CACHE_TTL_MS) {
    return cache.data;
  }

  if (refreshPromise) {
    return refreshPromise;
  }

  refreshPromise = scrapeSoundCloudProfile({ outputFile: DATA_FILE })
    .then((data) => {
      cache = { data, refreshedAt: Date.now(), stale: false };
      return data;
    })
    .catch(async (error) => {
      if (cache?.data) {
        return { ...cache.data, stale: true, error: error.message };
      }

      const diskData = await readSnapshotFromDisk();
      if (diskData) {
        return { ...diskData, stale: true, error: error.message };
      }

      throw error;
    })
    .finally(() => {
      refreshPromise = null;
    });

  return refreshPromise;
}

async function handleSoundCloudApi(request, response, url) {
  const force = url.searchParams.get("refresh") === "1";

  try {
    const data = await refreshSoundCloudData(force);
    sendJson(response, 200, data);
  } catch (error) {
    sendJson(response, 502, {
      error: "soundcloud_scrape_failed",
      message: error.message
    });
  }
}

async function handleSoundCloudEvents(request, response) {
  response.writeHead(200, {
    "Content-Type": "text/event-stream; charset=utf-8",
    "Cache-Control": "no-cache, no-transform",
    Connection: "keep-alive",
    "X-Accel-Buffering": "no"
  });

  let closed = false;
  let interval = null;

  const send = async (force = false) => {
    if (closed) {
      return;
    }

    try {
      const data = await refreshSoundCloudData(force);
      response.write(`event: soundcloud\n`);
      response.write(`data: ${JSON.stringify(data)}\n\n`);
    } catch (error) {
      response.write(`event: error\n`);
      response.write(`data: ${JSON.stringify({ message: error.message })}\n\n`);
    }
  };

  request.on("close", () => {
    closed = true;
    if (interval) {
      clearInterval(interval);
    }
  });

  await send(false);
  interval = setInterval(() => send(true), LIVE_REFRESH_MS);
}

function parseRange(rangeHeader, size) {
  const match = /^bytes=(\d*)-(\d*)$/.exec(rangeHeader || "");
  if (!match) {
    return null;
  }

  let start = match[1] ? Number(match[1]) : 0;
  let end = match[2] ? Number(match[2]) : size - 1;

  if (!match[1] && match[2]) {
    const suffixLength = Number(match[2]);
    start = Math.max(size - suffixLength, 0);
    end = size - 1;
  }

  if (
    !Number.isInteger(start) ||
    !Number.isInteger(end) ||
    start < 0 ||
    end < start ||
    start >= size
  ) {
    return null;
  }

  return { start, end: Math.min(end, size - 1) };
}

async function serveStatic(request, response, pathname) {
  const cleanPath = pathname === "/" ? "/index.html" : pathname;
  let decodedPath = "";

  try {
    decodedPath = decodeURIComponent(cleanPath);
  } catch {
    response.writeHead(400, { "Content-Type": "text/plain; charset=utf-8" });
    response.end("Bad request");
    return;
  }

  const filePath = path.resolve(ROOT, `.${decodedPath}`);
  const relativePath = path.relative(ROOT, filePath);

  if (relativePath.startsWith("..") || path.isAbsolute(relativePath)) {
    response.writeHead(403, { "Content-Type": "text/plain; charset=utf-8" });
    response.end("Forbidden");
    return;
  }

  try {
    const stat = await fs.stat(filePath);
    if (!stat.isFile()) {
      throw new Error("Not a file");
    }

    const contentType = MIME_TYPES[path.extname(filePath).toLowerCase()] || "application/octet-stream";
    const range = parseRange(request.headers.range, stat.size);

    if (request.headers.range && !range) {
      response.writeHead(416, {
        "Content-Range": `bytes */${stat.size}`,
        "Content-Type": "text/plain; charset=utf-8"
      });
      response.end("Range not satisfiable");
      return;
    }

    if (range) {
      response.writeHead(206, {
        "Accept-Ranges": "bytes",
        "Content-Length": range.end - range.start + 1,
        "Content-Range": `bytes ${range.start}-${range.end}/${stat.size}`,
        "Content-Type": contentType
      });

      if (request.method === "HEAD") {
        response.end();
        return;
      }

      createReadStream(filePath, range).pipe(response);
      return;
    }

    response.writeHead(200, {
      "Accept-Ranges": "bytes",
      "Content-Length": stat.size,
      "Content-Type": contentType
    });

    if (request.method === "HEAD") {
      response.end();
      return;
    }

    createReadStream(filePath).pipe(response);
  } catch {
    response.writeHead(404, { "Content-Type": "text/plain; charset=utf-8" });
    response.end("Not found");
  }
}

const server = http.createServer(async (request, response) => {
  const url = new URL(request.url || "/", `http://${request.headers.host || "localhost"}`);

  if (request.method !== "GET" && request.method !== "HEAD") {
    response.writeHead(405, { "Content-Type": "text/plain; charset=utf-8" });
    response.end("Method not allowed");
    return;
  }

  if (url.pathname === "/api/soundcloud") {
    await handleSoundCloudApi(request, response, url);
    return;
  }

  if (url.pathname === "/api/soundcloud/events") {
    await handleSoundCloudEvents(request, response);
    return;
  }

  await serveStatic(request, response, url.pathname);
});

server.listen(PORT, () => {
  console.log(`dash. site running on http://localhost:${PORT}`);
  refreshSoundCloudData(false).catch((error) => {
    console.warn(`Initial SoundCloud refresh failed: ${error.message}`);
  });
});
