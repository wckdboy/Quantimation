import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { spawn } from "node:child_process";
import { fileURLToPath } from "node:url";
import { createCanvas, loadImage } from "@napi-rs/canvas";
import { neuralSpeech, stopNeuralSpeech } from "../electron/neural-speech.mjs";
import {
  kitchenEpisode,
  characterStill,
  DOT_LINE,
  TEO_LINE,
  GLOAM_LINE,
} from "../src/broadcast-demo.js";
import { renderFrame, renderOnionSkin } from "../src/renderer.js";
import { closureAudit, normalizeCues } from "../src/lipsync.js";
import { rhubarbCues } from "../src/rhubarb.mjs";
import { subtitlesSrt } from "../src/captions.js";
import {
  ffmpegMasterArgs,
  frameTimes,
  loadWav,
  mixWavTimeline,
  writeWav,
} from "../src/offline.js";
import { frameSize } from "../src/timing.js";
import { separation, lineRunHistogram } from "../src/measure.js";
import { buildSet } from "../src/sets.js";
import { validateEpisode } from "../src/model.js";
import { motionReport } from "../src/onion.js";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const bin = process.env.RHUBARB || path.join(root, "tools/rhubarb/rhubarb");
const outDir = process.env.QUANTIMATION_OUT || "/opt/cursor/artifacts";

function run(command, args) {
  return new Promise((resolve, reject) => {
    const child = spawn(command, args, { stdio: "inherit" });
    child.on("error", reject);
    child.on("close", (code) =>
      code === 0 ? resolve() : reject(new Error(`${command} exited ${code}`)),
    );
  });
}

async function speak(text, voiceId, speed, name) {
  const wavPath = path.join(outDir, `${name}.wav`);
  const audio = await neuralSpeech(
    text,
    {
      neuralCache: path.join(root, ".cache", "models"),
      voiceId,
      voiceSpeed: speed,
    },
    new AbortController().signal,
    () => {},
  );
  await writeFile(wavPath, audio);
  const cues = await rhubarbCues(wavPath, { bin, dialog: text });
  const { rate, pcm } = await loadWav(wavPath);
  return { wavPath, cues, rate, pcm, duration: pcm.length / rate };
}

function paint(canvas, episode, time, options) {
  renderFrame(canvas, episode, time, options);
}

async function png(canvas, file) {
  await writeFile(file, await canvas.encode("png"));
}

await mkdir(outDir, { recursive: true });
await mkdir(path.join(outDir, "page-four-frames"), { recursive: true });
const dot = await speak(DOT_LINE, "af_nicole", 0.96, "dot");
const teo = await speak(TEO_LINE, "am_puck", 1.05, "teo");
const gloam = await speak(GLOAM_LINE, "bm_george", 0.9, "gloam");
await stopNeuralSpeech();
const episode = kitchenEpisode({
  dotCues: dot.cues,
  teoCues: teo.cues,
  gloamCues: gloam.cues,
  durations: { dot: dot.duration, teo: teo.duration, gloam: gloam.duration },
});

for (const id of ["dot", "teo", "gloam"]) {
  const still = characterStill(id);
  const before = createCanvas(1920, 1080);
  const after = createCanvas(1920, 1080);
  paint(before, still, 0.2, { ink: "legacy", captions: false, animOnTwos: false, suppressBlink: true });
  paint(after, still, 0.2, { ink: "broadcast", captions: false, animOnTwos: false, suppressBlink: true });
  await png(before, path.join(outDir, `before-${id}.png`));
  await png(after, path.join(outDir, `after-${id}.png`));
}
const three = createCanvas(1920, 1080);
paint(three, characterStill("dot", "threeQuarter"), 0.2, {
  ink: "broadcast",
  captions: false,
  animOnTwos: false,
  suppressBlink: true,
});
await png(three, path.join(outDir, "after-dot-three-quarter.png"));
for (const [id, bg, light] of [
  ["suburb_kitchen", "#E0D3B4", 135],
  ["coil_shed", "#D2BF9C", 20],
  ["alien_market", "#1F2542", 90],
]) {
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
      background: bg,
      environment: id,
      lightAngleDeg: light,
      camera: { x: 640, y: 360, zoom: 1, zoomEnd: 1 },
      instances: [],
      dialogue: [],
    }],
  });
  const canvas = createCanvas(1920, 1080);
  paint(canvas, plate, 0.2, { captions: false, ink: "broadcast" });
  await png(canvas, path.join(outDir, `plate-${id}.png`));
}
const still = characterStill("dot");
const poster = createCanvas(3840, 2160);
paint(poster, still, 0.2, { ink: "broadcast", captions: false, animOnTwos: false });
await png(poster, path.join(outDir, "after-dot-4k.png"));

const onion = createCanvas(1920, 1080);
renderOnionSkin(onion, episode, episode.scenes[0].dialogue[1].at + 1, {
  captions: false,
  before: 3,
  after: 3,
  opacity: 0.5,
  trails: true,
  createCanvas: (width, height) => createCanvas(width, height),
});
await png(onion, path.join(outDir, "onion-skin.png"));
await writeFile(
  path.join(outDir, "motion-report.json"),
  JSON.stringify(motionReport(episode, { sceneId: "kitchen" }), null, 2),
);

for (const [name, line, spoken] of [
  ["dot", DOT_LINE, dot],
  ["teo", TEO_LINE, teo],
  ["gloam", GLOAM_LINE, gloam],
]) {
  const normalized = normalizeCues(spoken.cues, { text: line });
  const misses = closureAudit(line, normalized);
  console.log(name, "MBP misses", misses.length, misses);
}

const kitchenStill = createCanvas(1920, 1080);
paint(kitchenStill, episode, 1.2, { captions: false, suppressBlink: true });
await png(kitchenStill, path.join(outDir, "kitchen-still.png"));

const size = frameSize(1080);
const frames = frameTimes(episode.scenes[0].duration, 24);
const started = Date.now();
for (const frame of frames) {
  const canvas = createCanvas(size.width, size.height);
  paint(canvas, episode, frame.time, { captions: false, ink: "broadcast" });
  const name = `frame_${String(frame.index + 1).padStart(4, "0")}.png`;
  await png(canvas, path.join(outDir, "page-four-frames", name));
  if (frame.index === 0 || frame.index % 48 === 0)
    console.log(`frame ${frame.index + 1}/${frames.length} ${((Date.now() - started) / 1000).toFixed(1)}s`);
}

const lines = episode.scenes[0].dialogue;
const clips = [
  { at: lines[0].at, rate: dot.rate, pcm: dot.pcm, gain: 0.9 },
  { at: lines[1].at, rate: teo.rate, pcm: teo.pcm, gain: 0.9 },
  { at: lines[2].at, rate: gloam.rate, pcm: gloam.pcm, gain: 0.9 },
];
const mix = mixWavTimeline(clips, episode.scenes[0].duration, 24000);
const audio = path.join(outDir, "page-four.wav");
await writeWav(audio, mix, 24000);
await writeFile(path.join(outDir, "page-four.srt"), subtitlesSrt(episode));
const video = path.join(outDir, "page-four-1080p.mp4");
await run(
  "ffmpeg",
  ffmpegMasterArgs({
    frames: path.join(outDir, "page-four-frames", "frame_%04d.png"),
    audio,
    output: video,
    fps: 24,
  }),
);
console.log(`master ${video}`);
const encodedPng = path.join(outDir, "encoded-frame.png");
await run("ffmpeg", ["-y", "-i", video, "-vf", "select=eq(n\\,30)", "-vframes", "1", encodedPng]);
const decoded = createCanvas(1920, 1080);
const img = await loadImage(await readFile(encodedPng));
decoded.getContext("2d").drawImage(img, 0, 0);
const pixels = decoded.getContext("2d").getImageData(0, 0, 1920, 1080);
const ink = (r, g, b) => r < 48 && g < 44 && b < 52;
const bgLine = (r, g, b, x, y) => {
  if (ink(r, g, b)) return false;
  if (y < 80 || y > 1000) return false;
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  return max < 130 && max - min < 40 && r + g + b > 80 && r + g + b < 340;
};
const horizontal = lineRunHistogram(pixels, 1920, 1080, ink, "horizontal");
const vertical = lineRunHistogram(pixels, 1920, 1080, ink, "vertical");
const background = lineRunHistogram(pixels, 1920, 1080, bgLine, "horizontal");
console.log("encoded ink horizontal runs", horizontal.rows, "median", horizontal.median, "n", horizontal.total);
console.log("encoded ink vertical runs", vertical.rows, "median", vertical.median, "n", vertical.total);
console.log("encoded bg-line runs", background.rows, "median", background.median, "n", background.total);
const sep = separation(pixels, 1920, 1080, (r, g, b) => {
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  return max < 150 && (max - min > 8 || r + g + b < 220) && !(r > 190 && g > 175 && b > 150);
});
console.log("encoded-frame L* separation", Math.round(sep.delta * 10) / 10, "char", Math.round(sep.charL), "bg", Math.round(sep.bgL));
