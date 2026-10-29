import { spawn } from "node:child_process";
import { mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";

// Rhubarb Lip Sync (MIT) mouth shapes, mapped onto Quantimation's nine drawings.
// Emotional drawings (snarl, frown, grin) stay available for pose tracks.
const LEGACY_MOUTH = {
  X: "closed",
  A: "closed",
  B: "teeth",
  C: "open",
  D: "wide",
  E: "round",
  F: "round",
  G: "teeth",
  H: "open",
};
export const RHUBARB_TO_MOUTH = {
  X: "X",
  A: "A",
  B: "B",
  C: "C",
  D: "D",
  E: "E",
  F: "F",
  G: "G",
  H: "H",
};

const FALLBACK = {
  closed: ["closed", "frown"],
  teeth: ["teeth", "grin", "smirk", "closed"],
  open: ["open", "wide", "round"],
  wide: ["wide", "open", "round"],
  smirk: ["smirk", "grin", "teeth", "open"],
  round: ["round", "open", "wide"],
  grin: ["grin", "smirk", "teeth"],
  snarl: ["snarl", "teeth", "open"],
  frown: ["frown", "closed"],
};

export function mouthForShape(shape, available) {
  const letter = RHUBARB_TO_MOUTH[shape] || shape;
  if (available?.has(letter)) return letter;
  const legacy = LEGACY_MOUTH[shape] || "closed";
  if (!available || available.has(legacy)) return legacy;
  for (const name of FALLBACK[legacy] || ["closed", "open"])
    if (available.has(name)) return name;
  return [...available][0] || legacy;
}

// Quantize to 24 fps, hold every viseme at least two frames, never drop A,
// and lead the audio by one frame.
export function normalizeCues(cues, { fps = 24, lead = 1, text = "" } = {}) {
  if (!cues?.length) return [{ start: 0, end: 2 / fps, value: "X" }];
  const end = cues.at(-1).end;
  const count = Math.max(2, Math.ceil(end * fps));
  const frames = [];
  for (let i = 0; i < count; i++) {
    const t = i / fps;
    const cue = cues.find((item) => t >= item.start - 1e-6 && t < item.end - 1e-6);
    frames.push(cue?.value || "X");
  }
  if (text) {
    const letters = [...text];
    letters.forEach((ch, index) => {
      if (!/[mbp]/i.test(ch)) return;
      const at = Math.round((index / letters.length) * (count - 1));
      frames[at] = "A";
      if (frames[at + 1] !== undefined) frames[at + 1] = "A";
    });
  }
  for (let i = 0; i < frames.length; i++) {
    let j = i;
    while (j + 1 < frames.length && frames[j + 1] === frames[i]) j++;
    const run = j - i + 1;
    if (run === 1 && frames[i] !== "A") frames[i] = i ? frames[i - 1] : frames[i];
    if (frames[i] === "A" && run < 2 && frames[i + 1] !== undefined) frames[i + 1] = "A";
    i = j;
  }
  const shifted = Array(frames.length).fill("X");
  frames.forEach((value, index) => {
    const to = Math.max(0, index - lead);
    shifted[to] = value;
  });
  const out = [];
  shifted.forEach((value, index) => {
    const start = index / fps;
    const endTime = (index + 1) / fps;
    const prev = out.at(-1);
    if (prev && prev.value === value) prev.end = endTime;
    else out.push({ start, end: endTime, value });
  });
  return out;
}

const LETTER = [
  [/^[mbp]/, "A"],
  [/^[fv]/, "G"],
  [/^l/, "H"],
  [/^[o]/, "F"],
  [/^[uw]/, "F"],
  [/^[r]/, "E"],
  [/^[ae]/, "D"],
  [/^[i]/, "B"],
  [/^[sztdcjkghn]/, "B"],
];

// Text-timed cues in Rhubarb's JSON shape. Used when the binary is absent.
export function estimateCues(text = "", duration = 1) {
  const letters = [...String(text).toLowerCase()].filter((ch) =>
    /[a-z.?! ]/.test(ch),
  );
  const span = Math.max(0.2, duration);
  if (!letters.length)
    return [{ start: 0, end: span, value: "X" }];
  const cues = [];
  letters.forEach((ch, index) => {
    const start = (index / letters.length) * span;
    const end = ((index + 1) / letters.length) * span;
    let value = "X";
    if (ch !== " ") {
      value = "C";
      for (const [pattern, shape] of LETTER)
        if (pattern.test(ch)) {
          value = shape;
          break;
        }
    }
    const prev = cues.at(-1);
    if (prev && prev.value === value) prev.end = end;
    else cues.push({ start, end, value });
  });
  return cues;
}

export function cuesToMouthTrack(cues, { target = "mouth", available, step = 1 / 24 } = {}) {
  if (!cues?.length) return { target, keyframes: [{ t: 0, variant: "closed", easing: "hold" }] };
  const end = cues.at(-1).end;
  const keyframes = [];
  for (let t = 0; t <= end + 1e-6; t += step) {
    const cue =
      cues.find((item) => t >= item.start - 1e-6 && t < item.end - 1e-6) ||
      cues.at(-1);
    const variant = mouthForShape(cue.value, available);
    const rounded = Math.round(t * 1000) / 1000;
    const prev = keyframes.at(-1);
    if (!prev || prev.variant !== variant)
      keyframes.push({ t: rounded, variant, easing: "hold" });
  }
  return { target, keyframes };
}

export function shiftTrack(track, at, duration) {
  const keyframes = [];
  for (const frame of track.keyframes) {
    const t = Math.max(0, Math.min(duration, Math.round((frame.t + at) * 1000) / 1000));
    const prev = keyframes.at(-1);
    if (prev && Math.abs(prev.t - t) < 0.0005) {
      prev.variant = frame.variant;
      continue;
    }
    keyframes.push({ ...frame, t });
  }
  return { target: track.target, keyframes };
}

function run(bin, args) {
  return new Promise((resolve, reject) => {
    const child = spawn(bin, args, { stdio: ["ignore", "pipe", "pipe"] });
    let stderr = "";
    child.stderr.on("data", (chunk) => {
      stderr += chunk;
    });
    child.on("error", reject);
    child.on("close", (code) => {
      if (code === 0) resolve(stderr);
      else reject(new Error(stderr.trim() || `Rhubarb exited ${code}.`));
    });
  });
}

// Shells out to the official Rhubarb binary. `res/sphinx` must sit beside it;
// this build recognises speech with the bundled PocketSphinx models.
export async function rhubarbCues(wavPath, { bin, dialog, extended = false } = {}) {
  const executable = bin || process.env.RHUBARB || "rhubarb";
  const dir = await mkdtemp(path.join(os.tmpdir(), "quantimation-rhubarb-"));
  const out = path.join(dir, "cues.json");
  const dialogFile = path.join(dir, "dialog.txt");
  try {
    const args = ["-r", "pocketSphinx", "-f", "json", "-q", "-o", out];
    if (dialog) {
      await writeFile(dialogFile, dialog, "utf8");
      args.push("-d", dialogFile);
    }
    if (extended) args.push("--extendedShapes", "GHX");
    args.push(wavPath);
    await run(executable, args);
    const parsed = JSON.parse(await readFile(out, "utf8"));
    if (!Array.isArray(parsed.mouthCues) || !parsed.mouthCues.length)
      throw new Error("Rhubarb returned no mouth cues.");
    return parsed.mouthCues.map((cue) => ({
      start: cue.start,
      end: cue.end,
      value: cue.value,
    }));
  } finally {
    await rm(dir, { recursive: true, force: true });
  }
}
