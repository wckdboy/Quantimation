// Rhubarb Lip Sync (MIT) mouth shapes, mapped onto Quantimation's nine drawings.
// The Rhubarb process lives in rhubarb.mjs so the sandboxed renderer can import this file.
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
  const end = Number(cues.at(-1).end);
  if (!Number.isFinite(end) || end < 0) return [{ start: 0, end: 2 / fps, value: "X" }];
  const count = Math.min(Math.round(fps * 180), Math.max(2, Math.ceil(Math.min(end, 180) * fps)));
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
  if (text) {
    const letters = [...text];
    letters.forEach((ch, index) => {
      if (!/[mbp]/i.test(ch)) return;
      const at = Math.max(
        0,
        Math.round((index / letters.length) * (count - 1)) - lead,
      );
      shifted[at] = "A";
      if (at + 1 < shifted.length) shifted[at + 1] = "A";
    });
  }
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

export function closureAudit(text, cues, fps = 24) {
  const letters = [...String(text)];
  const end = cues.at(-1)?.end || 1;
  const count = Math.max(2, Math.round(end * fps));
  const misses = [];
  letters.forEach((ch, index) => {
    if (!/[mbp]/i.test(ch)) return;
    const frame = Math.round((index / letters.length) * (count - 1));
    const led = Math.max(0, frame - 1);
    const t0 = led / fps;
    const t1 = (led + 2) / fps;
    const hit = cues.some(
      (cue) => cue.value === "A" && cue.end > t0 - 1 / fps && cue.start < t1 + 1 / fps,
    );
    if (!hit) misses.push({ ch, index, t: Math.round(t0 * 1000) / 1000 });
  });
  return misses;
}

export function cuesToMouthTrack(cues, { target = "mouth", available, step = 1 / 24 } = {}) {
  if (!cues?.length) return { target, keyframes: [{ t: 0, variant: "closed", easing: "hold" }] };
  const end = Math.min(180, Number(cues.at(-1).end) || 0);
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

