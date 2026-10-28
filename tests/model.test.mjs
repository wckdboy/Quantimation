import test from "node:test";
import assert from "node:assert/strict";
import { demoEpisode } from "../src/demo.js";
import {
  validateEpisode,
  validateAsset,
  interpolate,
  locate,
  duration,
  parseJSON,
} from "../src/model.js";
test("example is valid and every scene can be located at its boundary", () => {
  const e = demoEpisode();
  let offset = 0;
  for (let i = 0; i < e.scenes.length; i++) {
    assert.equal(locate(e, offset).index, i);
    offset += e.scenes[i].duration;
  }
  assert.equal(duration(e), 48);
  assert.equal(locate(e, 999).index, 3);
});
test("round trip preserves animation data", () => {
  const e = demoEpisode();
  assert.deepEqual(validateEpisode(JSON.parse(JSON.stringify(e))), e);
});
test("unknown references and duplicate IDs are rejected", () => {
  const e = demoEpisode();
  e.scenes[0].instances[0].assetId = "missing";
  assert.throws(() => validateEpisode(e), /Unknown asset/);
  const f = demoEpisode();
  f.assets[1].id = f.assets[0].id;
  assert.throws(() => validateEpisode(f), /unique/);
});
test("malformed shapes and resource exhaustion are rejected", () => {
  const a = demoEpisode().assets[0];
  a.shapes = [{ type: "image", url: "https://example.com" }];
  assert.throws(() => validateAsset(a), /Unsupported/);
  a.shapes = [{ type: "ellipse", rx: Infinity }];
  assert.throws(() => validateAsset(a), /between/);
  a.shapes = [{ type: "path", path: "javascript:alert(1)" }];
  assert.throws(() => validateAsset(a), /unsupported/);
});
test("shape tree recursion is bounded", () => {
  const a = demoEpisode().assets[0];
  let shape = { type: "rect" };
  for (let i = 0; i < 20; i++) shape = { type: "group", children: [shape] };
  a.shapes = [shape];
  assert.throws(() => validateAsset(a), /too large/);
});
test("non-finite, invalid timing and unknown motions are rejected", () => {
  for (const change of [
    (e) => (e.scenes[0].duration = NaN),
    (e) => (e.scenes[0].dialogue[0].at = -1),
    (e) => (e.scenes[0].instances[0].motion = "run-script"),
  ]) {
    const e = demoEpisode();
    change(e);
    assert.throws(() => validateEpisode(e));
  }
});
test("sparse keyframes interpolate each property independently", () => {
  const p = {
    x: 0,
    y: 100,
    scale: 1,
    keyframes: [
      { t: 2, x: 100 },
      { t: 4, y: 200 },
      { t: 6, x: 200 },
    ],
  };
  assert.equal(interpolate(p, 1).x, 50);
  assert.equal(interpolate(p, 1).y, 115.625);
  assert.equal(interpolate(p, 4).x, 150);
  assert.equal(interpolate(p, 8).x, 200);
  assert.equal(interpolate(p, 8).y, 200);
});
test("fenced JSON is parsed without evaluating code", () => {
  assert.deepEqual(parseJSON('```json\n{"ok":true}\n```'), { ok: true });
  assert.throws(() => parseJSON("process.exit()"));
});
