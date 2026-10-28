import test from "node:test";
import assert from "node:assert/strict";
import { synthesize } from "../electron/speech.mjs";
import http from "node:http";
test("HTTP speech honors per-character voice and performance direction", async () => {
  const server = http.createServer(async (req, res) => {
    let body = "";
    for await (const c of req) body += c;
    const data = JSON.parse(body);
    assert.equal(data.voice, "custom-character");
    assert.equal(data.instructions, "Dry delivery with a pause.");
    assert.equal(data.speed, 1.1);
    res.end(Buffer.from("RIFFtestWAVE"));
  });
  await new Promise((r) => server.listen(0, "127.0.0.1", r));
  try {
    await synthesize("An audition.", {
      ttsProvider: "http",
      ttsUrl: `http://127.0.0.1:${server.address().port}`,
      ttsModel: "test",
      ttsVoice: "default",
      providerVoice: "custom-character",
      voiceInstructions: "Dry delivery with a pause.",
      voiceSpeed: 1.1,
    });
  } finally {
    server.close();
  }
});
test("bundled offline speech produces an actual PCM WAV file", async () => {
  const audio = await synthesize("Hello from Quantimation.", {
    ttsProvider: "builtin",
    pitch: 52,
  });
  assert.equal(audio.toString("ascii", 0, 4), "RIFF");
  assert.equal(audio.toString("ascii", 8, 12), "WAVE");
  assert.ok(audio.length > 10000);
});
test("speech rejects empty or excessive input", async () => {
  await assert.rejects(() => synthesize("", {}));
  await assert.rejects(() => synthesize("x".repeat(1601), {}));
});
