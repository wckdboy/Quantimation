import http from "node:http";
import { randomBytes, timingSafeEqual } from "node:crypto";
import { mkdir, writeFile, readFile, unlink } from "node:fs/promises";
import path from "node:path";
export async function startControl({ profile, dispatch }) {
  const token = randomBytes(32).toString("hex");
  const server = http.createServer(async (req, res) => {
    const answer = (status, value) => {
      res.writeHead(status, {
        "Content-Type": "application/json",
        "Cache-Control": "no-store",
      });
      res.end(JSON.stringify(value));
    };
    const received = String(req.headers.authorization || "").replace(
      /^Bearer /,
      "",
    );
    if (
      req.headers.origin ||
      Buffer.byteLength(received) !== token.length ||
      !timingSafeEqual(Buffer.from(received), Buffer.from(token))
    ) {
      answer(403, { error: "Unauthorized local studio request." });
      return;
    }
    if (req.method !== "POST" || req.url !== "/command") {
      answer(404, { error: "Not found." });
      return;
    }
    try {
      const chunks = [];
      let bytes = 0;
      for await (const data of req) {
        bytes += data.length;
        if (bytes > 10000000) throw new Error("Command exceeds 10 MB.");
        chunks.push(data);
      }
      const command = JSON.parse(Buffer.concat(chunks).toString("utf8"));
      if (!command || typeof command.action !== "string")
        throw new Error("Missing action.");
      answer(200, { result: await dispatch(command) });
    } catch (error) {
      answer(400, { error: error.message });
    }
  });
  server.requestTimeout = 30000;
  server.headersTimeout = 10000;
  await new Promise((resolve, reject) => {
    server.once("error", reject);
    server.listen(0, "127.0.0.1", resolve);
  });
  const info = {
    url: `http://127.0.0.1:${server.address().port}/command`,
    token,
    pid: process.pid,
    version: 1,
  };
  await mkdir(profile, { recursive: true });
  const file = path.join(profile, "mcp-connection.json");
  await writeFile(file, JSON.stringify(info), { mode: 0o600 });
  return {
    port: server.address().port,
    close: async () => {
      server.closeAllConnections();
      server.close();
      // Closing an older app must not erase another instance's discovery file.
      try {
        if (JSON.parse(await readFile(file, "utf8")).token === token)
          await unlink(file);
      } catch {}
    },
  };
}
