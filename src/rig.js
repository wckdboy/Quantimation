import { DOT_LIMBS } from "./cast.js";

const clamp = (n, min, max) => Math.max(min, Math.min(max, n));
const deg = (r) => (r * 180) / Math.PI;

// Two-bone IK in the rig's local space. Angles are deltas from the rest pose,
// which is what pose tracks add on top of the drawn limb.
export function solveTwoBone(shoulder, elbow, wrist, target) {
  const L1 = Math.hypot(elbow.x - shoulder.x, elbow.y - shoulder.y);
  const L2 = Math.hypot(wrist.x - elbow.x, wrist.y - elbow.y);
  const rawX = target.x - shoulder.x;
  const rawY = target.y - shoulder.y;
  const raw = Math.hypot(rawX, rawY) || 1;
  let reach = raw;
  reach = clamp(reach, Math.abs(L1 - L2) + 0.5, L1 + L2 - 0.5);
  const dx = (rawX / raw) * reach;
  const dy = (rawY / raw) * reach;
  const base = Math.atan2(dy, dx);
  const cosShoulder = clamp(
    (L1 * L1 + reach * reach - L2 * L2) / (2 * L1 * reach),
    -1,
    1,
  );
  const bend =
    -Math.sign(
      (elbow.x - shoulder.x) * (wrist.y - shoulder.y) -
        (elbow.y - shoulder.y) * (wrist.x - shoulder.x),
    ) || 1;
  const shoulderWorld = base + bend * Math.acos(cosShoulder);
  const elbowPoint = {
    x: shoulder.x + Math.cos(shoulderWorld) * L1,
    y: shoulder.y + Math.sin(shoulderWorld) * L1,
  };
  const wristWorld = Math.atan2(
    shoulder.y + dy - elbowPoint.y,
    shoulder.x + dx - elbowPoint.x,
  );
  const restUpper = Math.atan2(elbow.y - shoulder.y, elbow.x - shoulder.x);
  const restLower = Math.atan2(wrist.y - elbow.y, wrist.x - elbow.x);
  let upper = deg(shoulderWorld - restUpper);
  let lower = deg(wristWorld - shoulderWorld - (restLower - restUpper));
  upper = ((upper + 540) % 360) - 180;
  lower = ((lower + 540) % 360) - 180;
  return { upper, lower, elbow: elbowPoint };
}

export function solveArm(side, target, limbs = DOT_LIMBS) {
  const limb = limbs[side];
  if (!limb) throw new Error("Unknown arm.");
  return solveTwoBone(limb.shoulder, limb.elbow, limb.wrist, target);
}

export function blinkClosed(time, seed = 1) {
  const n = seed >>> 0 || 1;
  const interval = 2.5 + (n % 3500) / 1000;
  const phase = ((n >>> 8) % 1000) / 1000 * interval;
  const span = 5 / 24;
  const u = (((time + phase) % interval) + interval) % interval;
  const starts = [0.35];
  if (n % 6 === 0) starts.push(0.35 + 8 / 24);
  for (const start of starts) {
    const d = u - start;
    if (d < 0 || d >= span) continue;
    return [0.45, 1, 1, 0.45, 0][Math.floor(d * 24)] ?? 0;
  }
  return 0;
}
export function blinkAt(time, seed = 0) {
  return blinkClosed(time, Math.floor(Math.abs(seed) * 1000) + 1);
}

export function dartAt(time, seed = 0) {
  const step = Math.floor(Math.max(0, time) / 0.5 + Math.abs(seed) * 0.02);
  let h = Math.imul(step + Math.floor(seed * 10) + 17, 2246822519);
  h = Math.imul(h ^ (h >>> 13), 3266489917);
  const x = ((h >>> 0) % 7) - 3;
  const y = (((h >>> 5) >>> 0) % 5) - 2;
  return { x: x * 1.7, y: y * 1.25 };
}

export function squashStretch(velocityY) {
  const k = clamp(velocityY / 140, -1, 1);
  return { x: 1 + k * 0.07, y: 1 - k * 0.09 };
}

export const POSE_NAMES = [
  "neutral",
  "smug",
  "shocked",
  "angry",
  "talking",
  "anticipate",
  "squash",
  "stretch",
  "blink",
];

function key(target, values, t = 0) {
  return { target, keyframes: [{ t, easing: "hold", ...values }] };
}

export function poseTracks(pose = "neutral", at = 0) {
  const poses = {
    neutral: [key("mouth", { variant: "X" }, at)],
    smug: [
      key("head", { rotation: -6 }, at),
      key("brow_left", { rotation: -8 }, at),
      key("mouth", { variant: "E" }, at),
    ],
    shocked: [
      key("head", { y: -4, rotation: 4 }, at),
      key("mouth", { variant: "D" }, at),
    ],
    angry: [
      key("brow_left", { rotation: 14 }, at),
      key("brow_right", { rotation: -14 }, at),
      key("mouth", { variant: "A" }, at),
    ],
    talking: [key("mouth", { variant: "C" }, at)],
    anticipate: [
      key("head", { rotation: 6, y: 4 }, at),
      key("left_upper_arm", { rotation: 8 }, at),
      key("right_upper_arm", { rotation: -8 }, at),
    ],
    squash: [key("head", { scaleX: 1.06, scaleY: 0.92, y: 6 }, at)],
    stretch: [key("head", { scaleX: 0.96, scaleY: 1.06, y: -8 }, at)],
    blink: [
      key("eye_left", { scaleY: 0.12 }, at),
      key("eye_right", { scaleY: 0.12 }, at),
    ],
  };
  if (!poses[pose]) throw new Error("Unknown family pose.");
  return poses[pose];
}

export function talkCycle(duration, at = 0) {
  const keyframes = [];
  const end = Math.max(0.4, duration);
  for (let t = 0; t <= end + 0.001; t += 0.5) {
    const phase = Math.floor(t / 0.5);
    keyframes.push({
      t: Math.round((at + t) * 1000) / 1000,
      rotation: phase % 2 === 0 ? -3.5 : 2.5,
      y: phase % 2 === 0 ? 0 : 2,
      easing: "smooth",
    });
  }
  return { target: "head", keyframes };
}

export function armTracks(side, angles, { at = 0, anticipate = 0.16, settle = 0.4, hand = "point" } = {}) {
  const upper = `${side}_upper_arm`;
  const fore = `${side}_forearm`;
  const palm = `${side}_hand`;
  const prep = Math.max(0, at - anticipate);
  return [
    {
      target: upper,
      keyframes: [
        { t: 0, rotation: 0, easing: "smooth" },
        { t: prep, rotation: -angles.upper * 0.18, easing: "smooth" },
        { t: at, rotation: angles.upper, easing: "hold" },
        { t: at + settle, rotation: angles.upper * 0.94 },
      ],
    },
    {
      target: fore,
      keyframes: [
        { t: 0, rotation: 0, easing: "smooth" },
        { t: prep, rotation: -8, easing: "smooth" },
        { t: at, rotation: angles.lower, easing: "hold" },
        { t: at + settle, rotation: angles.lower * 0.96 },
      ],
    },
    {
      target: palm,
      keyframes: [
        { t: 0, variant: "relaxed", easing: "hold" },
        { t: at, variant: hand, easing: "hold" },
      ],
    },
  ];
}

export function mergeTracks(existing = [], added = []) {
  const map = new Map(existing.map((track) => [track.target, track]));
  for (const track of added) map.set(track.target, track);
  return [...map.values()];
}
