import test from "node:test";
import assert from "node:assert/strict";
import { drawCharacter, inbetweenKeys, modelCheck, samplePose } from "../src/drawn.js";
import { kitchenEpisode } from "../src/broadcast-demo.js";

test("a drawn hand is one contour and a held drawing does not change on the next frame", () => {
  for (const id of ["dot", "teo", "gloam"]) {
    const art = drawCharacter(id, { view: "front" });
    assert.equal(art.metrics.handLoops, 2, id);
    assert.ok(art.shapes.some((shape) => shape.line === "contour"));
  }
  const profile = drawCharacter("dot", { view: "profile" });
  assert.equal(profile.metrics.handLoops, 1);
  const three = drawCharacter("dot", { view: "threeQuarter", rShoulder: -60, handR: "point" });
  assert.ok(three.metrics.handLoops >= 1);
  const keys = inbetweenKeys(
    [
      { t: 0, character: "dot", groundX: 0, lShoulder: 0 },
      { t: 1, character: "dot", groundX: 40, lShoulder: 30, arc: 12 },
    ],
    { step: 2 / 24 },
  );
  const a = samplePose(keys, 0.5, { twos: true });
  const b = samplePose(keys, 0.5 + 1 / 24, { twos: true });
  assert.equal(a.boil, b.boil);
  assert.notEqual(samplePose(keys, 0.5 + 2 / 24, { twos: true }).boil, a.boil);
  const sheet = modelCheck("teo");
  assert.ok(sheet.measured > 3);
  assert.equal(sheet.handLoops, 2);
});

test("page four stores redrawn keys for a walk, a seat, and a gripped prop", () => {
  const episode = kitchenEpisode();
  const scene = episode.scenes[0];
  const teo = scene.instances.find((actor) => actor.id === "teo");
  const dot = scene.instances.find((actor) => actor.id === "dot");
  assert.ok(teo.drawingKeys.length > 8);
  assert.ok(teo.drawingKeys.some((key) => key.depth > 0.6));
  assert.ok(teo.drawingKeys.some((key) => key.lHip < -40));
  assert.equal(dot.drawingKeys[0].prop, "tablet");
  assert.equal(dot.drawingKeys[0].handL, "grip");
  assert.equal(scene.shots.length, 4);
  assert.ok(scene.shots.some((shot) => shot.camera.perspective === "low"));
});
