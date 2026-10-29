import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { spawn } from "node:child_process";
import { fileURLToPath } from "node:url";
import { createCanvas } from "@napi-rs/canvas";
import { synthesize } from "../electron/speech.mjs";
import {
  kitchenEpisode,
  characterStill,
  DOT_LINE,
  TEO_LINE,
  GLOAM_LINE,
} from "../src/broadcast-demo.js";
import { renderFrame, renderOnionSkin } from "../src/renderer.js";
import { rhubarbCues } from "../src/lipsync.js";
import { subtitlesSrt } from "../src/captions.js";
import {
  ffmpegMasterArgs,
  frameTimes,
  loadWav,
  mixWavTimeline,
  writeWav,
} from "../src/offline.js";
import { frameSize } from "../src/timing.js";
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

async function speak(text, pitch, name) {
  const wavPath = path.join(outDir, `${name}.wav`);
  const audio = await synthesize(text, { ttsProvider: "builtin", pitch });
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
const [dot, teo, gloam] = await Promise.all([
  speak(DOT_LINE, 42, "dot"),
  speak(TEO_LINE, 58, "teo"),
  speak(GLOAM_LINE, 36, "gloam"),
]);
const episode = kitchenEpisode({
  dotCues: dot.cues,
  teoCues: teo.cues,
  gloamCues: gloam.cues,
  durations: { dot: dot.duration, teo: teo.duration, gloam: gloam.duration },
});

const still = characterStill("dot");
const before = createCanvas(1920, 1080);
const after = createCanvas(1920, 1080);
paint(before, still, 0.2, { ink: "legacy", captions: false, animOnTwos: false });
paint(after, still, 0.2, { ink: "broadcast", captions: false, animOnTwos: false });
await png(before, path.join(outDir, "before-dot.png"));
await png(after, path.join(outDir, "after-dot.png"));
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
