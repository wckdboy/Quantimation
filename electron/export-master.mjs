import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { spawn } from "node:child_process";
import { createCanvas } from "@napi-rs/canvas";
import { renderFrame } from "../src/renderer.js";
import { duration } from "../src/model.js";
import { frameTimes, frameSize } from "../src/timing.js";
import { ffmpegMasterArgs, writeWav } from "../src/offline.js";

function run(command, args) {
  return new Promise((resolve, reject) => {
    const child = spawn(command, args, { stdio: ["ignore", "pipe", "pipe"] });
    let err = "";
    child.stderr.on("data", (chunk) => {
      err += chunk;
    });
    child.on("error", reject);
    child.on("close", (code) => {
      if (code === 0) resolve();
      else reject(new Error((err || `${command} exited ${code}`).slice(-600)));
    });
  });
}

export async function exportMaster(
  episode,
  { height = 1080, fps = 24, captions = false, title = "master", dir } = {},
) {
  const total = duration(episode);
  if (!(total > 0) || total > 180)
    throw new Error("Master duration must be between 0 and 180 seconds.");
  const size = frameSize(height);
  const frames = frameTimes(total, fps);
  const folder = dir || path.join(process.cwd(), "masters");
  await mkdir(folder, { recursive: true });
  const stamp = Date.now();
  const safe = String(title).replace(/[^a-zA-Z0-9 -]/g, "").trim().slice(0, 80) || "master";
  const frameDir = path.join(folder, `${safe}-${stamp}-frames`);
  await mkdir(frameDir, { recursive: true });
  for (const frame of frames) {
    const canvas = createCanvas(size.width, size.height);
    renderFrame(canvas, episode, frame.time, { captions, ink: "broadcast" });
    await writeFile(
      path.join(frameDir, `frame_${String(frame.index + 1).padStart(4, "0")}.png`),
      await canvas.encode("png"),
    );
  }
  const audio = path.join(frameDir, "silent.wav");
  await writeWav(audio, new Float32Array(Math.max(1, Math.ceil(total * 24000))), 24000);
  const output = path.join(folder, `${safe}-${stamp}.mp4`);
  await run(
    "ffmpeg",
    ffmpegMasterArgs({
      frames: path.join(frameDir, "frame_%04d.png"),
      audio,
      output,
      fps,
    }),
  );
  return {
    file: output,
    frames: frames.length,
    width: size.width,
    height: size.height,
    fps,
    audio: "silent",
  };
}
