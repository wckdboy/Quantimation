import test from "node:test";
import assert from "node:assert/strict";
import { dragonEpisode } from "../src/dragon.js";
import { activeShot, validateEpisode } from "../src/model.js";
test("camera cuts resolve at their exact scene-local time", () => {
  const s = dragonEpisode().scenes[0];
  assert.equal(activeShot(s, 0).start, 0);
  const next = s.shots[1];
  assert.equal(activeShot(s, next.at).label, next.label);
  assert.equal(activeShot(s, next.at).progress, 0);
});
test("camera, acting, character views and voice profiles survive project validation", () => {
  const e = dragonEpisode();
  e.scenes[0].instances[0].beats = [
    { at: 0, duration: 1, action: "smug", intensity: 1 },
  ];
  assert.deepEqual(validateEpisode(e), e);
  assert.ok(e.scenes.some((s) => s.shots.length > 1));
  assert.ok(e.assets.some((a) => a.voice));
  assert.ok(e.scenes.some((s) => s.instances.some((p) => p.beats.length)));
});
test("unsupported camera and acting data is rejected", () => {
  const e = dragonEpisode();
  e.scenes[0].shots[0].camera.rotation = Infinity;
  assert.throws(() => validateEpisode(e));
  const f = dragonEpisode();
  f.scenes[0].instances[0].view = "run-script";
  assert.throws(() => validateEpisode(f));
});
