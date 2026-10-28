import test from "node:test";
import assert from "node:assert/strict";
import { demoEpisode } from "../src/demo.js";
import { validateEpisode } from "../src/model.js";
import { poseAt, motionOffset } from "../src/pose.js";
import {
  auditProduction,
  cameraExposesStage,
  summarizeRender,
} from "../src/quality.js";
test("held poses preserve a gesture until the next key and sparse channels interpolate independently", () => {
  const t = {
    keyframes: [
      { t: 0, rotation: 0, x: 0, easing: "hold" },
      { t: 1, rotation: 45, easing: "linear" },
      { t: 2, rotation: 0, x: 20 },
    ],
  };
  assert.equal(poseAt(t, 0.9).rotation, 0);
  assert.equal(poseAt(t, 1).rotation, 45);
  assert.equal(poseAt(t, 1.5).rotation, 22.5);
  assert.equal(poseAt(t, 2).x, 20);
  assert.equal(motionOffset("still", 1.2), 0);
});
test("named tracks survive validation and reject dangling or duplicate animation targets", () => {
  const e = demoEpisode(),
    p = e.scenes[0].instances[0],
    a = e.assets.find((a) => a.id === p.assetId);
  a.shapes[0].id = "bone";
  p.tracks = [
    {
      target: "bone",
      keyframes: [
        { t: 0, rotation: 0 },
        { t: 1, rotation: 20 },
      ],
    },
  ];
  assert.equal(
    validateEpisode(e).scenes[0].instances[0].tracks[0].target,
    "bone",
  );
  p.tracks[0].target = "missing";
  assert.throws(() => validateEpisode(e), /Unknown pose target/);
  p.tracks[0].target = "bone";
  a.shapes[1].id = "bone";
  assert.throws(() => validateEpisode(e), /Duplicate shape ID/);
});
test("quality review blocks dialogue cutoff and overlap but never claims creative approval", () => {
  const e = demoEpisode(),
    s = e.scenes[0];
  s.dialogue[0].duration = s.duration + 1;
  const r = auditProduction(e);
  assert.equal(r.status, "blocked");
  assert.equal(r.artisticQuality, "unreviewed");
  assert.ok(r.issues.some((i) => i.code === "cutoff-dialogue"));
});
test("camera review catches uncovered set edges and render review reports stalls", () => {
  const s = demoEpisode().scenes[0];
  s.shots = [];
  s.camera = {
    zoom: 1,
    zoomEnd: 1,
    x: 640,
    y: 360,
    panX: 0,
    panY: 0,
    rotation: 0,
    perspective: "eye",
  };
  assert.equal(cameraExposesStage(s, 0), false);
  s.camera.rotation = 20;
  assert.equal(cameraExposesStage(s, 0), true);
  assert.ok(summarizeRender([0, 33, 66, 700], 1).warnings.length > 0);
});
