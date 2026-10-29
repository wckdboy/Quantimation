// Render the original model sheets as a LoRA training set. Captions name our
// characters, views and poses. Nothing else is copied into the set.

import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { createCanvas } from "@napi-rs/canvas";
import { characterStill } from "../../src/broadcast-demo.js";
import { renderFrame } from "../../src/renderer.js";
import { sheetPoses } from "../../src/drawings.js";
import { buildSet } from "../../src/sets.js";
import { validateEpisode } from "../../src/model.js";
import { assertIpSafe } from "../../src/style/ip.js";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");
const outDir = path.join(root, "training/style");

function paint(canvas, episode) {
  renderFrame(canvas, episode, 0.2, {
    captions: false,
    suppressBlink: true,
    ink: "broadcast",
    animOnTwos: false,
  });
}

function poseEpisode(character, view, pose) {
  const episode = characterStill(character, view);
  episode.scenes[0].instances[0].drawingKeys[0].drawing = pose;
  return episode;
}

const sets = [
  ["suburb_kitchen", "Dot's kitchen, original interior, one-point perspective, flat colour"],
  ["coil_shed", "coil shed, original interior, one-point perspective, flat colour"],
  ["alien_market", "silt market, original interior, flat colour"],
];

await mkdir(outDir, { recursive: true });
const manifest = [];
for (const character of ["dot", "teo", "gloam"]) {
  const poses = [...new Set(sheetPoses(character).map((key) => key.split("/").slice(1).join("/")))];
  for (const pair of poses) {
    const [view, pose] = pair.split("/");
    const caption = assertIpSafe(
      `${character} Lind, original character, ${view} view, ${pose} pose, flat cel colour, ink contour, warm paper background`,
      "Caption",
    );
    const canvas = createCanvas(1600, 900);
    paint(canvas, poseEpisode(character, view, pose));
    const file = `${character}-${view}-${pose}.png`;
    await writeFile(path.join(outDir, file), await canvas.encode("png"));
    await writeFile(path.join(outDir, file.replace(/\.png$/, ".txt")), caption);
    manifest.push({ file, character, view, pose, caption });
    console.log(file);
  }
}
for (const [id, captionText] of sets) {
  const caption = assertIpSafe(captionText, "Caption");
  const plate = validateEpisode({
    version: 1,
    title: "Plate",
    logline: "Plate",
    genre: "Study",
    style: "Flat",
    assets: [buildSet(id, { id })],
    scenes: [{
      id: "plate",
      name: "Plate",
      duration: 1,
      background: "#E0D3B4",
      environment: id,
      camera: { x: 640, y: 360, zoom: 1, zoomEnd: 1 },
      instances: [],
      dialogue: [],
    }],
  });
  const canvas = createCanvas(1600, 900);
  paint(canvas, plate);
  const file = `set-${id}.png`;
  await writeFile(path.join(outDir, file), await canvas.encode("png"));
  await writeFile(path.join(outDir, file.replace(/\.png$/, ".txt")), caption);
  manifest.push({ file, set: id, caption });
  console.log(file);
}
await writeFile(path.join(outDir, "manifest.json"), JSON.stringify({
  base: "black-forest-labs/FLUX.1-schnell",
  license: "Apache-2.0 weights downloaded separately. Training images are original Quantimation drawings.",
  images: manifest,
}, null, 2));
console.log(`dataset ${manifest.length} images`);
