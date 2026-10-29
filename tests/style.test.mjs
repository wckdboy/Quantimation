import test from "node:test";
import assert from "node:assert/strict";
import { createCanvas } from "@napi-rs/canvas";
import { assertIpSafe, ipViolation } from "../src/style/ip.js";
import { drawKey, drawKeyBlock, keyPrompt } from "../src/style/draw-key.js";
import { poseSkeleton } from "../src/style/skeleton.js";
import { auditTracedKey, traceImageData } from "../src/style/trace.js";
import { trainingPlan } from "../src/style/trainers.js";

test("prompts and captions reject protected names", async () => {
  assert.equal(ipViolation("a proportional front view"), "");
  assert.equal(ipViolation("a green portal in the wall"), "portal");
  assert.throws(() => assertIpSafe("morty walks in"), /blocked/);
  assert.throws(() => keyPrompt({ character: "dot", view: "front", pose: "opens a portal" }), /blocked/);
  await assert.rejects(() => drawKey({ character: "rick", view: "front", pose: "stand" }, {}), /dot, teo and gloam/);
});

test("draw_key does not invent a picture when no backend is configured", async () => {
  await assert.rejects(
    () => drawKey({ character: "dot", view: "front", pose: "stand" }, {}),
    (error) => {
      assert.match(error.message, /QUANTIMATION_DRAW_URL/);
      assert.match(error.message, /FAL_KEY/);
      assert.match(error.message, /HF_TOKEN/);
      assert.match(error.message, /No key was generated/);
      assert.equal(error.message, drawKeyBlock());
      return true;
    },
  );
});

test("a traced blob is a cubic contour at the silhouette weight", () => {
  const canvas = createCanvas(160, 160);
  const ctx = canvas.getContext("2d");
  ctx.fillStyle = "#E0D3B4";
  ctx.fillRect(0, 0, 160, 160);
  ctx.fillStyle = "#8A5B3A";
  ctx.beginPath();
  ctx.ellipse(80, 84, 36, 48, 0, 0, Math.PI * 2);
  ctx.fill();
  const image = ctx.getImageData(0, 0, 160, 160);
  const shapes = traceImageData(image.data, 160, 160, { palette: ["#8A5B3A"] });
  assert.ok(shapes.length >= 1);
  assert.match(shapes[0].path, /C/);
  assert.equal(shapes[0].line, "contour");
  assert.equal(shapes[0].strokeWidth, 4);
  assert.equal(shapes[0].fill.toLowerCase(), "#8a5b3a");
});

test("check rejects an off-palette key and keeps a sheet-coloured one", () => {
  const bad = auditTracedKey("dot", {
    crown: 10,
    chin: 80,
    feet: [[40, 340], [80, 340]],
    shapes: [{ id: "blob", path: "M0 0C1 0 2 0 3 0Z", fill: "#FF00FF", line: "contour", strokeWidth: 4 }],
  });
  assert.equal(bad.ok, false);
  assert.ok(bad.flags.some((flag) => flag.startsWith("palette")));
  const good = auditTracedKey("teo", {
    crown: 10,
    chin: 90,
    feet: [[40, 428], [90, 428]],
    shapes: [{ id: "body", path: "M0 0C1 0 2 0 3 0Z", fill: "#EBC3A0", line: "contour", strokeWidth: 4 }],
  });
  assert.equal(good.ok, true, good.flags.join(" "));
});

test("the skeleton stands on the scene floor and training names its token", () => {
  const front = poseSkeleton({ character: "dot", view: "front", depth: 0.1 });
  const back = poseSkeleton({ character: "dot", view: "front", depth: 0.5 });
  const foot = front.joints.find((joint) => joint.name === "footL");
  assert.ok(foot.y > back.joints.find((joint) => joint.name === "footL").y);
  assert.equal(front.floorY, foot.y);
  const plan = trainingPlan({});
  assert.equal(plan.ok, false);
  assert.match(plan.blocked, /HF_TOKEN/);
  assert.match(plan.blocked, /FLUX\.1-schnell/);
  assert.match(plan.blocked, /No job was submitted/);
});
