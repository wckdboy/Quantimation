import test from "node:test";
import assert from "node:assert/strict";
import { pressureWidth, ribbonPolygon, sampleSvgPath, shadeHex } from "../src/ink.js";
import { onTwos, shakeOffset, frameTimes, frameSize } from "../src/timing.js";
import { solveArm } from "../src/rig.js";
import { FAMILY_LIMBS } from "../src/family.js";
import {
  cuesToMouthTrack,
  estimateCues,
  mouthForShape,
} from "../src/lipsync.js";
import { analyzeJoint, onionTimes } from "../src/onion.js";
import { coilShedEpisode } from "../src/broadcast-demo.js";
import { instantiateStandard, STANDARDS } from "../src/standards.js";
import { applyLipsync } from "../src/directing.js";
import { encodeWav, mixWavTimeline, readWav } from "../src/offline.js";
import { validateEpisode } from "../src/model.js";

test("open strokes taper and closed strokes keep a body", () => {
  assert.ok(pressureWidth(0.5, 10, { closed: false }) > pressureWidth(0, 10, { closed: false }) * 4);
  assert.ok(pressureWidth(1, 8, { closed: false }) < 1);
  assert.ok(pressureWidth(0, 8, { closed: true }) > 4);
  const poly = ribbonPolygon(
    [
      { x: 0, y: 0 },
      { x: 30, y: 0 },
      { x: 60, y: 0 },
    ],
    (u) => pressureWidth(u, 10, { closed: false }),
    false,
  );
  assert.ok(poly.length >= 6);
  assert.equal(shadeHex("#808080", -1), "#000000");
  assert.equal(sampleSvgPath("M0 0 L10 0 L10 10 Z")[0].closed, true);
});

test("twos holds, camera shake and frame sizes are deterministic", () => {
  assert.equal(onTwos(0.03), 0);
  assert.equal(onTwos(0.1), 2 / 24);
  assert.deepEqual(shakeOffset(1, 0), { x: 0, y: 0 });
  const a = shakeOffset(0.4, 12, 2);
  const b = shakeOffset(0.4, 12, 2);
  assert.deepEqual(a, b);
  assert.ok(Math.hypot(a.x, a.y) > 0);
  assert.equal(frameTimes(1, 24).length, 24);
  assert.deepEqual(frameSize(2160), { width: 3840, height: 2160 });
  assert.deepEqual(frameSize(1080), { width: 1920, height: 1080 });
});

test("arm IK rests at the drawn wrist and reaches outward", () => {
  for (const side of ["left", "right"]) {
    const rest = solveArm(side, FAMILY_LIMBS[side].wrist);
    assert.ok(Math.abs(rest.upper) < 0.05, side);
    assert.ok(Math.abs(rest.lower) < 0.05, side);
  }
  const reach = solveArm("left", { x: -20, y: 360 });
  assert.notEqual(Math.round(reach.upper), 0);
});

test("rhubarb shapes map onto the nine mouth drawings and hold between cues", () => {
  const names = new Set([
    "closed",
    "open",
    "wide",
    "round",
    "teeth",
    "smirk",
    "snarl",
    "frown",
    "grin",
  ]);
  assert.equal(mouthForShape("A", names), "closed");
  assert.equal(mouthForShape("F", names), "round");
  assert.equal(mouthForShape("D", names), "wide");
  assert.equal(mouthForShape("G", new Set(["closed", "open"])), "closed");
  const cues = estimateCues("Oh no.", 1);
  assert.equal(cues[0].value, "F");
  const track = cuesToMouthTrack(cues, { available: names, step: 1 / 12 });
  assert.equal(track.target, "mouth");
  assert.ok(track.keyframes.every((frame) => frame.easing === "hold"));
  assert.equal(new Set(track.keyframes.map((frame) => frame.t)).size, track.keyframes.length);
});

test("onion times and motion report flag a pop but not a smooth arc", () => {
  const frames = onionTimes(1, { before: 2, after: 1, twos: true });
  assert.deepEqual(
    frames.map((frame) => frame.index),
    [-2, -1, 0, 1],
  );
  const smooth = [];
  for (let i = 0; i < 8; i++) smooth.push({ t: i / 12, x: i * 4, y: Math.sin(i / 2) * 2 });
  assert.equal(
    analyzeJoint(smooth).suspects.some((item) => item.code === "frame-jump"),
    false,
  );
  const pop = [
    { t: 0, x: 0, y: 0 },
    { t: 1 / 12, x: 4, y: 0 },
    { t: 2 / 12, x: 180, y: 20 },
  ];
  assert.ok(analyzeJoint(pop).suspects.some((item) => item.code === "frame-jump"));
});

test("coil shed episode, parallax sets and lip-sync tracks validate", () => {
  for (const id of ["coil_shed", "alien_market", "suburb_kitchen"]) {
    const set = instantiateStandard(id, { id });
    assert.equal(set.kind, "environment");
    assert.ok(set.shapes.some((shape) => shape.parallax > 0));
  }
  assert.ok(STANDARDS.some((item) => item.id === "dot"));
  assert.ok(!STANDARDS.some((item) => item.id === "portal"));
  assert.ok(!STANDARDS.some((item) => String(item.name).includes("Oona")));
  const episode = coilShedEpisode();
  assert.equal(episode.title, "Page Four");
  assert.ok(episode.scenes[0].duration >= 15 && episode.scenes[0].duration <= 30);
  assert.equal(episode.scenes[0].shots.length, 4);
  assert.equal(episode.scenes[0].lightAngleDeg, 135);
  const mouth = episode.scenes[0].instances[0].tracks.find((track) => track.target === "mouth");
  assert.ok(mouth.keyframes.length > 2);
  const again = applyLipsync(episode, {
    sceneId: "kitchen",
    lineId: "line_teo",
    cues: [
      { start: 0, end: 0.2, value: "X" },
      { start: 0.2, end: 0.5, value: "D" },
    ],
  });
  assert.equal(again.engine, "rhubarb");
  assert.equal(validateEpisode(episode).title, "Page Four");
});

test("wav timeline mix is deterministic and bounded", () => {
  const pcm = new Float32Array([0, 0.5, -0.5, 0.25]);
  const wav = encodeWav(pcm, 24000);
  const decoded = readWav(wav);
  assert.equal(decoded.rate, 24000);
  assert.equal(decoded.pcm.length, 4);
  assert.ok(Math.abs(decoded.pcm[1] - 0.5) < 0.002);
  const mix = mixWavTimeline(
    [
      { at: 0, rate: 24000, pcm, gain: 0.5 },
      { at: 0, rate: 24000, pcm, gain: 0.5 },
    ],
    1,
    24000,
  );
  assert.ok(Math.abs(mix[1] - 0.5) < 0.002);
  assert.ok(mix.every((sample) => Math.abs(sample) <= 1));
});
