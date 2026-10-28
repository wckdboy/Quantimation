import test from "node:test";
import assert from "node:assert/strict";
import http from "node:http";
import {
  completion,
  directEpisode,
  endpoint,
  designAsset,
} from "../electron/director.mjs";
import { demoEpisode } from "../src/demo.js";
test("asset designer receives an existing standard with its joints and mouth drawings", async () => {
  const server = http.createServer(async (req, res) => {
    let body = "";
    for await (const chunk of req) body += chunk;
    const data = JSON.parse(body),
      brief = JSON.parse(data.messages[1].content);
    assert.equal(brief.template.id, "performer");
    assert.ok(JSON.stringify(brief.template).includes("variants"));
    assert.match(data.messages[0].content, /EDIT its existing shape tree/);
    res.end(
      JSON.stringify({ message: { content: JSON.stringify(brief.template) } }),
    );
  });
  await new Promise((r) => server.listen(0, "127.0.0.1", r));
  try {
    const a = await designAsset(
      {
        provider: "ollama",
        baseUrl: `http://127.0.0.1:${server.address().port}`,
        model: "test",
      },
      {
        id: "performer",
        name: "Custom performer",
        kind: "character",
        standardId: "family_oona",
      },
      new AbortController().signal,
    );
    assert.equal(a.id, "performer");
  } finally {
    server.close();
  }
});
test("endpoint restrictions preserve TLS and reject embedded secrets", () => {
  assert.equal(
    endpoint({ baseUrl: "http://localhost:11434" }, "/api/chat"),
    "http://localhost:11434/api/chat",
  );
  assert.equal(
    endpoint({ baseUrl: "https://provider.example/v1/" }, "/chat/completions"),
    "https://provider.example/v1/chat/completions",
  );
  assert.throws(
    () => endpoint({ baseUrl: "http://remote.example" }, "/x"),
    /HTTPS/,
  );
  assert.throws(
    () => endpoint({ baseUrl: "https://key:secret@host.test" }, "/x"),
    /credentials/,
  );
});
test("real HTTP contract drives plan -> generated assets -> validated episode", async () => {
  const demo = demoEpisode();
  let requests = 0;
  const server = http.createServer(async (req, res) => {
    let body = "";
    for await (const c of req) body += c;
    const data = JSON.parse(body);
    assert.equal(req.url, "/api/chat");
    assert.equal(data.stream, false);
    assert.equal(data.format, "json");
    requests++;
    const assetBrief =
      requests > 1 ? JSON.parse(data.messages[1].content) : null;
    const content =
      requests === 1
        ? { ...demo, assets: demo.assets.map(({ shapes, ...a }) => a) }
        : requests === 7
          ? { scenes: demo.scenes }
          : demo.assets.find((a) => a.id === assetBrief.id);
    res.setHeader("Content-Type", "application/json");
    res.end(JSON.stringify({ message: { content: JSON.stringify(content) } }));
  });
  await new Promise((r) => server.listen(0, "127.0.0.1", r));
  try {
    const events = [];
    const result = await directEpisode(
      {
        provider: "ollama",
        baseUrl: `http://127.0.0.1:${server.address().port}`,
        model: "test",
      },
      { prompt: "Test story" },
      new AbortController().signal,
      (p) => events.push(p),
    );
    assert.deepEqual(result, demo);
    assert.equal(requests, 7);
    assert.ok(events.some((p) => p.phase === "Directing the performance"));
    assert.ok(events.some((p) => p.phase === "Draft ready for visual review"));
    assert.equal(
      events.filter((p) => p.phase.startsWith("Designing")).length,
      5,
    );
  } finally {
    server.close();
  }
});
test("compatible provider sends JSON and reports authentication failures without exposing response", async () => {
  const server = http.createServer(async (req, res) => {
    assert.equal(req.url, "/v1/chat/completions");
    assert.equal(req.headers.authorization, "Bearer test-key");
    res.writeHead(401);
    res.end("sensitive upstream response");
  });
  await new Promise((r) => server.listen(0, "127.0.0.1", r));
  try {
    await assert.rejects(
      () =>
        completion(
          {
            provider: "compatible",
            baseUrl: `http://127.0.0.1:${server.address().port}/v1`,
            model: "test",
            apiKey: "test-key",
          },
          "system",
          "user",
          new AbortController().signal,
        ),
      (e) => e.message.includes("401") && !e.message.includes("sensitive"),
    );
  } finally {
    server.close();
  }
});
test("cancellation aborts a pending model request", async () => {
  const server = http.createServer(() => {});
  await new Promise((r) => server.listen(0, "127.0.0.1", r));
  const controller = new AbortController();
  try {
    const p = completion(
      {
        provider: "ollama",
        baseUrl: `http://127.0.0.1:${server.address().port}`,
        model: "test",
      },
      "system",
      "user",
      controller.signal,
    );
    controller.abort();
    await assert.rejects(p);
  } finally {
    server.closeAllConnections();
    server.close();
  }
});
