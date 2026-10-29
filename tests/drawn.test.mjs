import test from "node:test";
import assert from "node:assert/strict";
import { drawCharacter, inbetweenKeys, modelCheck, samplePose } from "../src/drawn.js";
import { kitchenEpisode } from "../src/broadcast-demo.js";
import { cameraRig, project } from "../src/layout.js";
import { buildSet } from "../src/sets.js";

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
  const kitchen = episode.assets.find((asset) => asset.id === "dot_kitchen");
  assert.ok(kitchen.shapes.some((shape) => shape.parallax > 0));
  assert.equal(JSON.stringify(kitchen.shapes).includes("ellipse"), false);
  assert.ok(teo.drawingKeys.some((key) => key.lHip > -8 && key.t > teo.drawingKeys.find((seat) => seat.lHip < -40).t));
});

test("Teo's model sheet is smooth Bézier keys that morph", () => {
  const front = drawCharacter("teo", { view: "front", drawing: "stand" });
  const quarter = drawCharacter("teo", { view: "threeQuarter", drawing: "stand" });
  const profile = drawCharacter("teo", { view: "profile", drawing: "stand" });
  for (const art of [front, quarter, profile]) {
    assert.ok(art.shapes.every((shape) => shape.type === "path" && /[CcQq]/.test(shape.path)));
    assert.equal(art.shapes.some((shape) => shape.type === "polygon" || shape.type === "ellipse"), false);
  }
  assert.equal(front.metrics.handLoops, 2);
  assert.equal(profile.metrics.handLoops, 1);
  assert.notEqual(front.shapes.find((shape) => shape.role === "head").path, profile.shapes.find((shape) => shape.role === "head").path);
  const profileStand = drawCharacter("teo", { view: "profile", drawing: "stand" });
  const mid = drawCharacter("teo", { view: "profile", drawing: "stand", drawingTo: "contact", drawU: 0.5 });
  assert.notEqual(mid.shapes.find((shape) => shape.id === "legF").path, profileStand.shapes.find((shape) => shape.id === "legF").path);
  assert.match(mid.shapes.find((shape) => shape.id === "legF").path, /C/);
});

test("construction keeps inner lines, a real turn, and a low lens converges", () => {
  const front = drawCharacter("dot", { view: "front" });
  const quarter = drawCharacter("dot", { view: "threeQuarter" });
  const profile = drawCharacter("dot", { view: "profile" });
  assert.ok(front.shapes.filter((shape) => shape.line === "contour").length > 6);
  assert.ok(front.shapes.some((shape) => shape.line === "interior"));
  assert.notEqual(front.shapes.find((shape) => shape.role === "head").path, profile.shapes.find((shape) => shape.role === "head").path);
  assert.notEqual(quarter.shapes.find((shape) => shape.role === "head").path, front.shapes.find((shape) => shape.role === "head").path);
  const grip = drawCharacter("dot", { view: "threeQuarter", handL: "grip", prop: "tablet" });
  assert.ok(grip.shapes.some((shape) => shape.line === "prop"));
  const gloam = drawCharacter("gloam", { view: "front", handL: "open" });
  assert.equal(gloam.metrics.handLoops, 2);
  const low = cameraRig("Low angle", "low", "kitchen");
  const a = project(low, [0, 0, 220]);
  const b = project(low, [0, 220, 220]);
  const c = project(low, [420, 0, 220]);
  const d = project(low, [420, 220, 220]);
  const slope = (p, q) => (q.x - p.x) / (q.y - p.y);
  assert.ok(Math.abs(slope(a, b) - slope(c, d)) > 0.02);
  for (const id of ["suburb_kitchen", "coil_shed", "alien_market"]) {
    const set = buildSet(id);
    assert.ok(set.shapes.some((shape) => shape.parallax > 0));
    const flat = JSON.stringify(set.shapes);
    assert.equal(flat.includes("ellipse"), false);
  }
});
