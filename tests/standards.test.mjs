import test from "node:test";
import assert from "node:assert/strict";
import { STANDARDS, instantiateStandard } from "../src/standards.js";
import { buildLead } from "../src/cast.js";
import { poseTracks } from "../src/rig.js";
import { validateEpisode } from "../src/model.js";
import { poseAt, speechMouth } from "../src/pose.js";
import { subtitlesSrt } from "../src/captions.js";
import { soundBuffer } from "../src/sound.js";

test("all standards are independent editable trees; invalid palette and density fail", () => {
  for (const s of STANDARDS) {
    const first = instantiateStandard(s.id, { id: "first" }),
      next = instantiateStandard(s.id, { id: "next" });
    first.shapes[0].opacity = 0;
    assert.notEqual(next.shapes[0].opacity, 0);
    assert.ok(next.shapes.length);
  }
  assert.throws(
    () => instantiateStandard("forest", { parameters: { density: 11 } }),
    /Density/,
  );
  assert.throws(
    () => instantiateStandard("moon", { parameters: { light: "red" } }),
    /color/,
  );
  assert.throws(() => instantiateStandard("unknown"), /Unknown/);
  assert.deepEqual(
    instantiateStandard("space", { parameters: { seed: 42 } }),
    instantiateStandard("space", { parameters: { seed: 42 } }),
  );
  assert.notDeepEqual(
    instantiateStandard("space", { parameters: { seed: 42 } }),
    instantiateStandard("space", { parameters: { seed: 43 } }),
  );
  assert.notDeepEqual(
    instantiateStandard("forest", { parameters: { density: 2 } }),
    instantiateStandard("forest", { parameters: { density: 10 } }),
  );
});

test("every lead accepts the reusable pose vocabulary and valid mouth changes", () => {
  for (const id of ["dot", "teo", "gloam"])
    for (const pose of ["neutral", "shocked", "talking"]) {
      const asset = buildLead(id, { id });
      const episode = validateEpisode({
        version: 1,
        title: "Pose",
        logline: "Pose",
        genre: "Test",
        style: "Test",
        assets: [asset],
        scenes: [
          {
            id: "scene",
            name: "Scene",
            duration: 4,
            background: "#E0D3B4",
            camera: { x: 640, y: 360, zoom: 1 },
            instances: [
              {
                id: "test",
                assetId: id,
                x: 640,
                y: 690,
                motion: "still",
                tracks: poseTracks(pose),
              },
            ],
            dialogue: [],
          },
        ],
      });
      assert.ok(episode.scenes[0].instances[0].tracks.length);
      episode.scenes[0].instances[0].tracks = [
        { target: "mouth", keyframes: [{ t: 0, variant: "nonexistent" }] },
      ];
      assert.throws(() => validateEpisode(episode), /Unknown variant/);
    }
  assert.equal(
    poseAt(
      {
        keyframes: [
          { t: 0, variant: "closed" },
          { t: 1, variant: "snarl" },
        ],
      },
      0.9,
    ).variant,
    "closed",
  );
  assert.equal(
    poseAt(
      {
        keyframes: [
          { t: 0, variant: "closed" },
          { t: 1, variant: "snarl" },
        ],
      },
      1,
    ).variant,
    "snarl",
  );
  assert.equal(speechMouth("aaaa", 0.5, 0), "closed");
  assert.equal(speechMouth("oooo", 0.5, 0.5), "round");
});

test("SRT uses cumulative scene times and a separate removable text track", () => {
  const text = subtitlesSrt({
    scenes: [
      {
        duration: 10,
        dialogue: [{ at: 1, duration: 2, text: "Hello.\nAgain." }],
      },
      {
        duration: 5,
        dialogue: [{ at: 0.25, duration: 1.5, text: "<i>Second</i>" }],
      },
    ],
  });
  assert.match(text, /00:00:01,000 --> 00:00:03,000\nHello. Again./);
  assert.match(text, /00:00:10,250 --> 00:00:11,750/);
  assert.equal(subtitlesSrt({ scenes: [] }), "");
});

test("procedural sound cues produce bounded deterministic PCM with nonzero energy", () => {
  const context = {
    sampleRate: 24000,
    createBuffer: (_channels, n, rate) => {
      const data = new Float32Array(n);
      return { length: n, sampleRate: rate, getChannelData: () => data };
    },
  };
  for (const type of ["impact", "fire", "whoosh", "rumble", "crackle"]) {
    const cue = { id: "sound", type, duration: 0.8, gain: 0.4 };
    const a = soundBuffer(context, cue).getChannelData(0),
      b = soundBuffer(context, cue).getChannelData(0);
    assert.deepEqual(a, b);
    assert.equal(a.length, 19200);
    assert.ok(a.every((n) => Number.isFinite(n) && Math.abs(n) <= 0.95));
    assert.ok(a.reduce((sum, n) => sum + n * n, 0) > 0);
    assert.equal(Math.abs(a[0]), 0);
  }
});
