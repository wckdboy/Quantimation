// Construction drawings. A pose is volumes and a gesture; each drawing is rebuilt
// from the head, rib cage, pelvis and tapered limbs. Holds repeat a drawing.
// Twos advance the drawing every second frame.
import { constructCharacter } from "./construct.js";
import { posedDrawing } from "./drawings.js";
import { activeShot } from "./model.js";
import { rigFor } from "./plates.js";

const SUP = 2;

export const MODELS = {
  dot: {
    name: "Dot Lind",
    heads: 4.25,
    world: 340,
    head: 80,
    skin: ["#8A5B3A", "#6B432B"],
    hair: ["#211C24", "#151218"],
    cloth: ["#4A6385", "#35496A"],
    shirt: ["#EDE3CC", "#CDBE9E"],
    pants: ["#3B3E46", "#2A2C33"],
    shoes: ["#1F1E23", "#151418"],
    prop: "#2C3038",
    cm: 165,
  },
  teo: {
    name: "Teo Lind",
    heads: 4.75,
    world: 380,
    head: 80,
    skin: ["#EBC3A0", "#CC9E7E"],
    hair: ["#9A4E2C", "#783A1F"],
    cloth: ["#66704A", "#4C5536"],
    shirt: ["#8E9092", "#707274"],
    pants: ["#66704A", "#4C5536"],
    shoes: ["#7A5233", "#5B3C24"],
    buckle: "#B9A46A",
    cm: 183,
  },
  gloam: {
    name: "Gloam",
    heads: 2.05,
    world: 236,
    head: 115,
    skin: ["#8AB3A2", "#6B9282"],
    hair: ["#8AB3A2", "#6B9282"],
    cloth: ["#7A5A44", "#5D4332"],
    shirt: ["#8AB3A2", "#6B9282"],
    pants: ["#8AB3A2", "#6B9282"],
    shoes: ["#6B9282", "#567568"],
    cm: 112,
  },
};

const MAT = { shoe: 1, pants: 2, shirt: 3, jacket: 4, skin: 5, beard: 6, hair: 7, vest: 8, hand: 9, prop: 10 };
const DEPTH = { 1: 1, 2: 2, 3: 3, 4: 4, 5: 5, 6: 6, 7: 7, 8: 8, 9: 9, 10: 10 };

const HANDS = ["relaxed", "grip", "point", "open"];
const VISEMES = ["A", "B", "C", "D", "E", "F", "G", "H", "X"];

export function defaultPose(id = "dot") {
  return {
    view: "front",
    lean: 0,
    weight: 0,
    squash: 1,
    headTilt: 0,
    viseme: "X",
    blink: 0,
    lShoulder: 6,
    lElbow: 2,
    rShoulder: -6,
    rElbow: 2,
    lHip: 2,
    lKnee: 2,
    rHip: -2,
    rKnee: 2,
    handL: "relaxed",
    handR: "relaxed",
    prop: "",
    plantL: 1,
    plantR: 1,
    depth: 0.25,
    groundX: 0,
    wx: 220,
    wz: 180,
    facing: 1,
    arc: 0,
    pitch: 0,
    hairLag: 0,
    clothLag: 0,
    beardLag: 0,
    boil: 0,
  };
}

function num(pose, key, fallback = 0) {
  const value = pose?.[key];
  return Number.isFinite(value) ? value : fallback;
}

export function normalizePose(id, pose = {}) {
  const base = defaultPose(id);
  const next = { ...base, ...pose, view: pose.view || base.view };
  if (!["front", "threeQuarter", "profile", "back"].includes(next.view)) next.view = "front";
  if (!HANDS.includes(next.handL)) next.handL = "relaxed";
  if (!HANDS.includes(next.handR)) next.handR = "relaxed";
  if (!VISEMES.includes(next.viseme)) next.viseme = "X";
  next.squash = Math.max(0.82, Math.min(1.16, num(next, "squash", 1)));
  next.pitch = Math.max(-28, Math.min(28, num(next, "pitch", 0)));
  next.facing = num(next, "facing", 1) < 0 ? -1 : 1;
  return next;
}

function smoothstep(u) {
  const t = Math.max(0, Math.min(1, u));
  return t * t * (3 - 2 * t);
}

export function samplePose(keys = [], time = 0, { twos = true, fps = 24 } = {}) {
  if (!keys.length) return normalizePose("dot");
  const frame = Math.max(0, Math.floor(time * fps + 1e-4));
  const drawing = twos ? frame - (frame % 2) : frame;
  const t = drawing / fps;
  const pose = poseAt(keys, t);
  const lagged = poseAt(keys, Math.max(0, t - 2 / fps));
  pose.hairLag = (lagged.lean - pose.lean) * 0.9 + (lagged.headTilt - pose.headTilt) * 0.45;
  pose.clothLag = (lagged.lean - pose.lean) * 1.15 + ((lagged.squash || 1) - (pose.squash || 1)) * 8;
  pose.beardLag = (lagged.lean - pose.lean) * 1.25 + (lagged.headTilt - pose.headTilt) * 0.7;
  pose.boil = drawing;
  return pose;
}

function poseAt(keys, t) {
  const id = keys[0].character || "dot";
  let a = keys[0];
  let b = null;
  for (const key of keys) {
    if ((key.t ?? 0) <= t + 1e-6) a = key;
    else {
      b = key;
      break;
    }
  }
  if (!b) return normalizePose(a.character || id, a);
  const span = Math.max(1e-4, b.t - a.t);
  const u = smoothstep((t - a.t) / span);
  const pose = normalizePose(a.character || id, {});
  for (const key of Object.keys(pose)) {
    if (key === "facing") continue;
    if (typeof a[key] === "number" || typeof b[key] === "number") {
      const av = typeof a[key] === "number" ? a[key] : pose[key];
      const bv = typeof b[key] === "number" ? b[key] : av;
      pose[key] = av + (bv - av) * u;
    }
  }
  pose.view = u < 0.5 ? a.view || pose.view : b.view || a.view || pose.view;
  pose.handL = u < 0.5 ? a.handL || "relaxed" : b.handL || a.handL || "relaxed";
  pose.handR = u < 0.5 ? a.handR || "relaxed" : b.handR || a.handR || "relaxed";
  pose.viseme = u < 0.5 ? a.viseme || "X" : b.viseme || a.viseme || "X";
  pose.prop = u < 0.5 ? a.prop || "" : b.prop || a.prop || "";
  pose.facing = u < 0.5 ? a.facing ?? 1 : b.facing ?? a.facing ?? 1;
  pose.character = a.character || id;
  const drawingA = a.drawing || "";
  const drawingB = b.drawing || drawingA;
  pose.drawing = drawingA;
  pose.drawingTo = drawingB;
  if (drawingA && drawingB && drawingA !== drawingB) pose.drawU = u;
  else if (typeof a.drawU === "number" || typeof b.drawU === "number") {
    const from = typeof a.drawU === "number" ? a.drawU : 0;
    const to = typeof b.drawU === "number" ? b.drawU : from;
    pose.drawU = from + (to - from) * u;
  } else pose.drawU = 0;
  const bow = Math.sin(u * Math.PI) * (b.arc || a.arc || 0);
  pose.groundX += bow;
  pose.wx += bow * 0.35;
  return normalizePose(pose.character, pose);
}

export function inbetweenKeys(keys, { step = 2 / 24, arc = 0 } = {}) {
  const ordered = [...keys].sort((a, b) => a.t - b.t);
  if (ordered.length < 2) return ordered;
  const out = [];
  for (let i = 0; i < ordered.length - 1; i++) {
    const a = ordered[i];
    const b = ordered[i + 1];
    out.push({ ...a, arc: a.arc ?? arc });
    for (let t = a.t + step; t < b.t - step * 0.25; t += step) {
      const pose = poseAt(
        [
          { ...a, character: a.character },
          { ...b, character: b.character || a.character, arc: b.arc ?? arc },
        ],
        t,
      );
      out.push({ ...pose, t: Math.round(t * 1000) / 1000, character: a.character });
    }
  }
  out.push(ordered.at(-1));
  const unique = [];
  for (const key of out) {
    const prev = unique.at(-1);
    if (prev && Math.abs(prev.t - key.t) < 0.01) unique[unique.length - 1] = key;
    else unique.push(key);
  }
  return unique;
}

function mask(w, h) {
  return { w, h, ids: new Uint8Array(w * h), depth: DEPTH };
}

function stamp(grid, x, y, mat) {
  const ix = x | 0;
  const iy = y | 0;
  if (ix < 0 || iy < 0 || ix >= grid.w || iy >= grid.h) return;
  grid.ids[iy * grid.w + ix] = mat;
}

function stampDisc(grid, cx, cy, rx, ry, mat) {
  const x0 = Math.max(0, Math.floor(cx - rx - 1));
  const x1 = Math.min(grid.w - 1, Math.ceil(cx + rx + 1));
  const y0 = Math.max(0, Math.floor(cy - ry - 1));
  const y1 = Math.min(grid.h - 1, Math.ceil(cy + ry + 1));
  for (let y = y0; y <= y1; y++) {
    for (let x = x0; x <= x1; x++) {
      const u = (x + 0.5 - cx) / rx;
      const v = (y + 0.5 - cy) / ry;
      if (u * u + v * v <= 1) stamp(grid, x, y, mat);
    }
  }
}

function stampCapsule(grid, ax, ay, bx, by, r0, r1, mat) {
  const dx = bx - ax;
  const dy = by - ay;
  const len2 = dx * dx + dy * dy || 1;
  const rad = Math.max(r0, r1);
  const x0 = Math.max(0, Math.floor(Math.min(ax, bx) - rad - 1));
  const x1 = Math.min(grid.w - 1, Math.ceil(Math.max(ax, bx) + rad + 1));
  const y0 = Math.max(0, Math.floor(Math.min(ay, by) - rad - 1));
  const y1 = Math.min(grid.h - 1, Math.ceil(Math.max(ay, by) + rad + 1));
  for (let y = y0; y <= y1; y++) {
    for (let x = x0; x <= x1; x++) {
      const t = Math.max(0, Math.min(1, ((x + 0.5 - ax) * dx + (y + 0.5 - ay) * dy) / len2));
      const px = ax + dx * t;
      const py = ay + dy * t;
      const r = r0 + (r1 - r0) * t;
      const ex = x + 0.5 - px;
      const ey = y + 0.5 - py;
      if (ex * ex + ey * ey <= r * r) stamp(grid, x, y, mat);
    }
  }
}

function stampPoly(grid, pts, mat) {
  if (pts.length < 3) return;
  let y0 = Infinity;
  let y1 = -Infinity;
  for (const p of pts) {
    y0 = Math.min(y0, p[1]);
    y1 = Math.max(y1, p[1]);
  }
  y0 = Math.max(0, Math.floor(y0));
  y1 = Math.min(grid.h - 1, Math.ceil(y1));
  for (let y = y0; y <= y1; y++) {
    const hits = [];
    for (let i = 0; i < pts.length; i++) {
      const a = pts[i];
      const b = pts[(i + 1) % pts.length];
      if ((a[1] <= y && b[1] > y) || (b[1] <= y && a[1] > y)) {
        const u = (y - a[1]) / (b[1] - a[1] || 1e-6);
        hits.push(a[0] + (b[0] - a[0]) * u);
      }
    }
    hits.sort((m, n) => m - n);
    for (let i = 0; i + 1 < hits.length; i += 2) {
      const x0 = Math.max(0, Math.ceil(hits[i]));
      const x1 = Math.min(grid.w - 1, Math.floor(hits[i + 1]));
      for (let x = x0; x <= x1; x++) stamp(grid, x, y, mat);
    }
  }
}

function limb(origin, shoulder, elbow, upper, lower) {
  const s = (shoulder * Math.PI) / 180;
  const e = ((shoulder + elbow) * Math.PI) / 180;
  const joint = [origin[0] + Math.sin(s) * upper, origin[1] + Math.cos(s) * upper];
  const end = [joint[0] + Math.sin(e) * lower, joint[1] + Math.cos(e) * lower];
  return { joint, end, angle: e };
}

function handPoly(wrist, angle, side, pose, len) {
  const ux = Math.sin(angle);
  const uy = Math.cos(angle);
  const nx = Math.cos(angle) * side;
  const ny = -Math.sin(angle) * side;
  const p = (along, across) => [wrist[0] + ux * along + nx * across, wrist[1] + uy * along + ny * across];
  if (pose === "point") {
    return [p(0, -7), p(len * 0.35, -8), p(len, -3), p(len, 3), p(len * 0.4, 7), p(len * 0.15, 12), p(-2, 8), p(-4, 0)];
  }
  if (pose === "grip") {
    return [p(0, -9), p(8, -11), p(16, -6), p(18, 2), p(12, 8), p(4, 11), p(-2, 6), p(-4, -2)];
  }
  if (pose === "open") {
    return [
      p(0, -8),
      p(len * 0.45, -16),
      p(len * 0.9, -12),
      p(len * 0.5, -6),
      p(len * 0.95, -2),
      p(len * 0.5, 4),
      p(len * 0.9, 10),
      p(len * 0.4, 8),
      p(6, 14),
      p(-3, 4),
    ];
  }
  return [
    p(-4, -11),
    p(len * 0.45, -16),
    p(len * 0.95, -10),
    p(len * 0.5, -2),
    p(len, 2),
    p(len * 0.5, 8),
    p(len * 0.92, 14),
    p(len * 0.35, 16),
    p(6, 18),
    p(-6, 6),
  ];
}

function linkSegments(segs) {
  const key = (p) => `${p[0].toFixed(2)},${p[1].toFixed(2)}`;
  const next = new Map();
  for (const [a, b] of segs) {
    const k = key(a);
    if (!next.has(k)) next.set(k, []);
    next.get(k).push(b);
  }
  const used = new Set();
  const loops = [];
  for (const [a, b] of segs) {
    if (used.has(`${key(a)}>${key(b)}`)) continue;
    const loop = [a];
    let cur = a;
    for (let guard = 0; guard < segs.length + 2; guard++) {
      const options = next.get(key(cur)) || [];
      let nxt = null;
      for (const point of options) {
        const mark = `${key(cur)}>${key(point)}`;
        if (used.has(mark)) continue;
        used.add(mark);
        nxt = point;
        break;
      }
      if (!nxt) break;
      if (key(nxt) === key(loop[0]) && loop.length > 4) {
        loops.push(loop);
        break;
      }
      loop.push(nxt);
      cur = nxt;
    }
  }
  return loops;
}

function chains(grid, mat) {
  const { w, h, ids } = grid;
  const on = (x, y) => {
    if (x < 0 || y < 0 || x >= w || y >= h) return false;
    return mat === 0 ? ids[y * w + x] !== 0 : ids[y * w + x] === mat;
  };
  const segs = [];
  const add = (p, q) => segs.push([p, q]);
  for (let y = 0; y < h - 1; y++) {
    for (let x = 0; x < w - 1; x++) {
      let code = 0;
      if (on(x, y)) code |= 1;
      if (on(x + 1, y)) code |= 2;
      if (on(x + 1, y + 1)) code |= 4;
      if (on(x, y + 1)) code |= 8;
      const t = [x + 0.5, y];
      const r = [x + 1, y + 0.5];
      const b = [x + 0.5, y + 1];
      const l = [x, y + 0.5];
      switch (code) {
        case 1: add(l, t); break;
        case 2: add(t, r); break;
        case 3: add(l, r); break;
        case 4: add(r, b); break;
        case 5: add(l, t); add(r, b); break;
        case 6: add(t, b); break;
        case 7: add(l, b); break;
        case 8: add(b, l); break;
        case 9: add(b, t); break;
        case 10: add(b, l); add(t, r); break;
        case 11: add(b, r); break;
        case 12: add(r, l); break;
        case 13: add(r, t); break;
        case 14: add(t, l); break;
        default: break;
      }
    }
  }
  return linkSegments(segs).filter((loop) => loop.length > 12);
}

function rdp(points, epsilon) {
  if (points.length < 3) return points;
  const a = points[0];
  const b = points[points.length - 1];
  let max = 0;
  let index = 0;
  const dx = b[0] - a[0];
  const dy = b[1] - a[1];
  const len = Math.hypot(dx, dy) || 1;
  for (let i = 1; i < points.length - 1; i++) {
    const dist = Math.abs(dy * points[i][0] - dx * points[i][1] + b[0] * a[1] - b[1] * a[0]) / len;
    if (dist > max) {
      max = dist;
      index = i;
    }
  }
  if (max > epsilon) {
    return rdp(points.slice(0, index + 1), epsilon).slice(0, -1).concat(rdp(points.slice(index), epsilon));
  }
  return [a, b];
}

function chaikin(points, closed) {
  if (points.length < 3) return points;
  const out = [];
  const n = points.length;
  const last = closed ? n : n - 1;
  if (!closed) out.push(points[0]);
  for (let i = 0; i < last; i++) {
    const a = points[i];
    const b = points[(i + 1) % n];
    out.push([a[0] * 0.75 + b[0] * 0.25, a[1] * 0.75 + b[1] * 0.25]);
    out.push([a[0] * 0.25 + b[0] * 0.75, a[1] * 0.25 + b[1] * 0.75]);
  }
  if (!closed) out.push(points[n - 1]);
  return out;
}

function area(points) {
  let sum = 0;
  for (let i = 0; i < points.length; i++) {
    const a = points[i];
    const b = points[(i + 1) % points.length];
    sum += a[0] * b[1] - b[0] * a[1];
  }
  return Math.abs(sum) / 2;
}

function pathFrom(points) {
  return `${points
    .map((p, i) => `${i ? "L" : "M"}${p[0].toFixed(1)} ${p[1].toFixed(1)}`)
    .join(" ")} Z`;
}

function contourShape(points, fill, shadow, line = "contour") {
  return {
    type: "path",
    path: pathFrom(points),
    fill,
    stroke: "#221D26",
    strokeWidth: 0,
    line,
    shadow: true,
    shadowFill: shadow,
    shadowK: 0.1,
    seed: 1,
  };
}

function ellipseShape(x, y, rx, ry, fill, line, extra = {}) {
  return {
    type: "ellipse",
    x,
    y,
    rx,
    ry,
    fill,
    stroke: line === "none" ? "none" : "#221D26",
    strokeWidth: 0,
    line,
    shadow: false,
    seed: extra.seed ?? 2,
    ...(extra.id ? { id: extra.id } : {}),
  };
}

function openStroke(points, line) {
  const body = points.map((p, i) => `${i ? "L" : "M"}${p[0].toFixed(1)} ${p[1].toFixed(1)}`).join(" ");
  return {
    type: "path",
    path: body,
    fill: "transparent",
    stroke: "#221D26",
    strokeWidth: 0,
    line,
    shadow: false,
    seed: 3,
  };
}

function layoutOf(model, pose) {
  const head = model.head * SUP;
  const pitch = pose.pitch || 0;
  const low = 1 + pitch / 90;
  const heads = model.heads;
  const total = head * heads * (pose.squash > 1 ? 1 + (pose.squash - 1) * 0.4 : 1);
  const top = 18 * SUP;
  const foot = top + total;
  const cx = 240 * SUP + pose.weight * head * 0.08;
  const yOf = (hh) => {
    const t = hh / heads;
    const warped = Math.pow(Math.max(0.001, t), 1 - pitch / 140);
    return top + warped * total;
  };
  const lean = (pose.lean * Math.PI) / 180;
  const hipY = yOf(model === MODELS.gloam ? 1.15 : model === MODELS.teo ? 2.55 : 2.32);
  const shoulderY = yOf(model === MODELS.gloam ? 1.05 : 1.22);
  const shift = (y) => Math.sin(lean) * (y - hipY) * 0.15;
  return { head, top, foot, cx, yOf, hipY, shoulderY, shift, total, low, sup: SUP };
}

function rasterize(id, pose) {
  const model = MODELS[id];
  const L = layoutOf(model, pose);
  const w = 480 * SUP;
  const h = Math.ceil(L.foot) + 28 * SUP;
  const grid = mask(w, h);
  grid.overlays = [];
  const view = pose.view;
  const profile = view === "profile";
  const three = view === "threeQuarter";
  const back = view === "back";
  const k = pose.squash;
  const thick = (n) => n * L.head * L.low * (k < 1 ? 1 + (1 - k) * 0.35 : 1);
  const anchors = {};
  const place = (x, y) => [x + L.shift(y), y];

  const shoulder = (side) => {
    const sign = side === "left" ? -1 : 1;
    const spread = id === "gloam" ? 0.34 : id === "teo" ? 0.46 : 0.52;
    const tuck = three && side === "left" ? 0.18 : profile ? 0.06 : 0;
    return place(L.cx + sign * L.head * (spread - tuck), L.shoulderY);
  };
  const hip = (side) => {
    const sign = side === "left" ? -1 : 1;
    return place(L.cx + sign * L.head * (id === "gloam" ? 0.16 : 0.16), L.hipY);
  };

  const armLen = L.head * (id === "gloam" ? 0.42 : 0.78);
  const foreLen = L.head * (id === "gloam" ? 0.36 : 0.7);
  const thigh = L.head * (id === "gloam" ? 0.28 : id === "teo" ? 1.05 : 0.95);
  const shin = L.head * (id === "gloam" ? 0.22 : id === "teo" ? 0.95 : 0.82);

  const drawArm = (side) => {
    if (profile && side === "left") return;
    const sign = side === "left" ? -1 : 1;
    const angles = side === "left"
      ? [pose.lShoulder * (three ? 0.65 : 1), pose.lElbow]
      : [pose.rShoulder, pose.rElbow];
    const origin = shoulder(side);
    const arm = limb(origin, angles[0] * sign, angles[1] * sign, armLen, foreLen);
    const cloth = id === "teo" ? MAT.shirt : id === "gloam" ? MAT.skin : MAT.jacket;
    const r0 = thick(id === "gloam" ? 0.16 : id === "dot" ? 0.2 : 0.16);
    const r1 = r0 * 0.62;
    stampCapsule(grid, origin[0], origin[1], arm.joint[0], arm.joint[1], r0, r0 * 0.9, cloth);
    stampCapsule(grid, arm.joint[0], arm.joint[1], arm.end[0], arm.end[1], r0 * 0.9, r1, cloth);
    const hand = handPoly(arm.end, arm.angle, sign, side === "left" ? pose.handL : pose.handR, L.head * (id === "gloam" ? 0.34 : 0.5));
    stampPoly(grid, hand, MAT.hand);
    anchors[`${side}Wrist`] = arm.end;
    anchors[`${side}Hand`] = hand;
    if ((side === "left" ? pose.handL : pose.handR) === "grip" && pose.prop) {
      const prop = [
        [arm.end[0] - 16 * SUP, arm.end[1] - 10 * SUP],
        [arm.end[0] + 18 * SUP, arm.end[1] - 14 * SUP],
        [arm.end[0] + 22 * SUP, arm.end[1] + 18 * SUP],
        [arm.end[0] - 12 * SUP, arm.end[1] + 22 * SUP],
      ];
      stampPoly(grid, prop, MAT.prop);
      anchors.prop = prop;
    }
  };

  const drawLeg = (side) => {
    if (profile && side === "left") return;
    const sign = side === "left" ? -1 : 1;
    const hipA = side === "left" ? pose.lHip : pose.rHip;
    const kneeA = side === "left" ? pose.lKnee : pose.rKnee;
    const origin = hip(side);
    const leg = limb(origin, hipA * sign, kneeA * sign, thigh, shin);
    const mat = id === "gloam" ? MAT.skin : id === "teo" ? MAT.jacket : MAT.pants;
    const r0 = thick(id === "gloam" ? 0.14 : 0.2);
    stampCapsule(grid, origin[0], origin[1], leg.joint[0], leg.joint[1], r0, r0 * 0.92, mat);
    stampCapsule(grid, leg.joint[0], leg.joint[1], leg.end[0], leg.end[1], r0 * 0.92, r0 * 0.78, mat);
    stampDisc(grid, leg.end[0] + sign * r0 * 0.2, leg.end[1] + r0 * 0.15, r0 * 1.15, r0 * 0.55, MAT.shoe);
    anchors[`${side}Foot`] = [leg.end[0], leg.end[1] + r0 * 0.4];
  };

  if (id === "gloam") {
    const rx = L.head * (profile ? 0.72 : three ? 0.92 : 1);
    stampDisc(grid, L.cx, L.yOf(0.48), rx * 0.52, L.head * 0.5, MAT.skin);
    stampDisc(grid, L.cx, L.yOf(1.35), rx * 0.48, L.head * 0.42, MAT.skin);
    stampCapsule(grid, L.cx - rx * 0.16, L.yOf(1.5), L.cx - rx * 0.18, L.foot - 6 * SUP, rx * 0.16, rx * 0.14, MAT.skin);
    stampCapsule(grid, L.cx + rx * 0.16, L.yOf(1.5), L.cx + rx * 0.18, L.foot - 6 * SUP, rx * 0.16, rx * 0.14, MAT.skin);
    anchors.leftFoot = place(L.cx - rx * 0.18, L.foot - 4 * SUP);
    anchors.rightFoot = place(L.cx + rx * 0.18, L.foot - 4 * SUP);
    const vest = [
      place(L.cx - rx * 0.42, L.yOf(1.12)),
      place(L.cx - rx * 0.16, L.yOf(1.28)),
      place(L.cx, L.yOf(1.2)),
      place(L.cx + rx * 0.16, L.yOf(1.28)),
      place(L.cx + rx * 0.42, L.yOf(1.12)),
      place(L.cx + rx * 0.38, L.yOf(1.55)),
      place(L.cx - rx * 0.38, L.yOf(1.55)),
    ];
    if (!back) grid.overlays.push(vest);
    drawArm("left");
    drawArm("right");
  } else {
    drawLeg("left");
    drawLeg("right");
    stampDisc(grid, L.cx + L.shift(L.hipY), L.hipY, thick(0.34), thick(0.16), id === "teo" ? MAT.jacket : MAT.pants);
    const torsoTop = L.shoulderY - L.head * 0.08;
    const torsoBot = L.hipY + L.head * (id === "teo" ? 0.35 : 0.22);
    const half = thick(profile ? 0.28 : three ? 0.42 : 0.48);
    const torso = [
      place(L.cx - half, torsoTop + 8 * SUP),
      place(L.cx - half * 0.92, torsoTop),
      place(L.cx - L.head * 0.16, torsoTop + 4 * SUP),
      place(L.cx + L.head * 0.16, torsoTop + 4 * SUP),
      place(L.cx + half * 0.92, torsoTop),
      place(L.cx + half, torsoTop + 8 * SUP),
      place(L.cx + half * 0.82, torsoBot),
      place(L.cx - half * 0.82, torsoBot),
    ];
    stampPoly(grid, torso, id === "teo" ? MAT.shirt : MAT.jacket);
    if (id === "teo") {
      const bib = [
        place(L.cx - thick(0.28), L.shoulderY + L.head * 0.15),
        place(L.cx + thick(0.28), L.shoulderY + L.head * 0.15),
        place(L.cx + thick(0.34), torsoBot + L.head * 0.15),
        place(L.cx - thick(0.34), torsoBot + L.head * 0.15),
      ];
      stampPoly(grid, bib, MAT.jacket);
    }
    drawArm("left");
    drawArm("right");
    const skullW = L.head * (profile ? 0.78 : three ? 0.9 : 0.96);
    const skullTop = L.yOf(0.02);
    const skullBot = L.yOf(1.02);
    if (profile) {
      const face = [
        place(L.cx - skullW * 0.15, skullBot),
        place(L.cx - skullW * 0.05, L.yOf(0.35)),
        place(L.cx + skullW * 0.35, skullTop),
        place(L.cx + skullW * 0.62, L.yOf(0.22)),
        place(L.cx + skullW * 0.5, L.yOf(0.5)),
        place(L.cx + skullW * 0.78, L.yOf(0.6)),
        place(L.cx + skullW * 0.48, L.yOf(0.72)),
        place(L.cx + skullW * 0.28, skullBot),
      ];
      stampPoly(grid, face, MAT.skin);
      anchors.nose = place(L.cx + skullW * 0.78, L.yOf(0.6));
    } else {
      stampDisc(grid, L.cx + L.shift(skullTop) + (three ? L.head * 0.06 : 0), (skullTop + skullBot) / 2, skullW * 0.5, (skullBot - skullTop) / 2, MAT.skin);
    }
    const hairY = L.yOf(-0.08) + pose.hairLag * SUP;
    if (id === "dot") {
      stampDisc(grid, L.cx + L.shift(hairY) + (three ? 4 * SUP : 0), L.yOf(0.22), skullW * 0.78, L.head * 0.42, MAT.hair);
      if (!back && !profile) {
        stampPoly(
          grid,
          [
            place(L.cx - skullW * 0.7, L.yOf(0.02)),
            place(L.cx + skullW * 0.7, L.yOf(0.04)),
            place(L.cx + skullW * 0.62, L.yOf(0.36)),
            place(L.cx - skullW * 0.62, L.yOf(0.34)),
          ],
          MAT.hair,
        );
      }
      if (!back) {
        stampDisc(
          grid,
          L.cx + (profile ? skullW * 0.12 : three ? L.head * 0.06 : 0),
          L.yOf(0.62),
          skullW * (profile ? 0.42 : 0.46),
          L.head * 0.4,
          MAT.skin,
        );
      }
    } else {
      const curls = profile
        ? [[0.05, -0.02], [0.28, -0.12], [0.4, 0.08]]
        : [[-0.34, -0.02], [-0.12, -0.16], [0.12, -0.14], [0.34, -0.02], [-0.28, 0.12], [0.3, 0.14]];
      for (const [dx, dy] of curls) {
        stampDisc(grid, L.cx + dx * L.head + L.shift(L.yOf(dy)), L.yOf(dy + 0.12) + pose.hairLag, L.head * 0.16, L.head * 0.15, MAT.hair);
      }
      if (!back) {
        stampPoly(
          grid,
          [
            place(L.cx - skullW * 0.42, L.yOf(0.62)),
            place(L.cx - skullW * 0.2, skullBot + L.head * 0.08),
            place(L.cx + skullW * 0.15, skullBot + L.head * 0.1),
            place(L.cx + skullW * 0.46, L.yOf(0.6)),
            place(L.cx + skullW * 0.1, L.yOf(0.78)),
            place(L.cx - skullW * 0.12, L.yOf(0.76)),
          ],
          MAT.beard,
        );
      }
    }
    anchors.skullTop = [L.cx, skullTop];
    anchors.chin = [L.cx, skullBot];
    anchors.mouth = place(L.cx + (profile ? skullW * 0.35 : three ? -L.head * 0.08 : 0), L.yOf(id === "teo" ? 0.8 : 0.78));
    anchors.eyeY = L.yOf(id === "teo" ? 0.4 : 0.42);
    anchors.eyeX = L.cx + (three ? L.head * 0.08 : 0);
    anchors.skullW = skullW;
  }

  if (id === "gloam") {
    anchors.mouth = place(L.cx + (profile ? L.head * 0.2 : 0), L.yOf(0.7));
    anchors.eyeY = L.yOf(0.45);
    anchors.eyeX = L.cx;
    anchors.skullW = L.head;
    anchors.skullTop = [L.cx, L.yOf(0)];
    anchors.chin = [L.cx, L.yOf(0.95)];
  }

  let ink = 0;
  let cx = 0;
  let cy = 0;
  let minY = h;
  let maxY = 0;
  let headMin = h;
  let headMax = 0;
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const mat = grid.ids[y * w + x];
      if (!mat) continue;
      ink++;
      cx += x;
      cy += y;
      minY = Math.min(minY, y);
      maxY = Math.max(maxY, y);
      if (mat === MAT.skin && y < L.yOf(1.15)) {
        headMin = Math.min(headMin, y);
        headMax = Math.max(headMax, y);
      }
    }
  }
  anchors.com = ink ? [cx / ink, cy / ink] : [L.cx, L.hipY];
  anchors.volume = ink;
  anchors.pixelHeight = maxY - minY;
  anchors.headPixels = headMax > headMin ? headMax - headMin : L.head * SUP;
  anchors.feetY = maxY;
  return { grid, anchors, layout: L, model, pose, out: 1 / SUP };
}

const FILL = {
  1: (m) => m.shoes,
  2: (m) => m.pants,
  3: (m) => m.shirt,
  4: (m) => m.cloth,
  5: (m) => m.skin,
  6: (m) => m.hair,
  7: (m) => m.hair,
  8: (m) => m.cloth,
  9: (m) => m.skin,
  10: () => ["#2C3038", "#1B1E24"],
};

function features(built) {
  const { anchors: a, layout: L, model, pose, out } = built;
  const shapes = [];
  const sc = (p) => [p[0] * out, p[1] * out];
  if (pose.view === "back") return shapes;
  const eyeY = (a.eyeY || L.yOf(0.42)) * out;
  const eyeX = (a.eyeX || L.cx) * out;
  const skull = (a.skullW || L.head) * out;
  const r = skull * (model === MODELS.teo ? 0.16 : model === MODELS.gloam ? 0.16 : 0.15);
  const blink = Math.max(0, Math.min(1, pose.blink || 0));
  const eyes = pose.view === "profile" ? ["near"] : ["far", "near"];
  for (const which of eyes) {
    const far = which === "far";
    let x = eyeX + (far ? -r * 1.05 : r * 1.05);
    let rx = r;
    if (pose.view === "threeQuarter" && far) {
      x = eyeX - r * 0.35;
      rx = r * 0.7;
    }
    if (pose.view === "profile") x = eyeX + skull * 0.18;
    const ry = Math.max(1.2, rx * (1 - blink * 0.92));
    shapes.push(ellipseShape(x, eyeY, rx, ry, "#F4F0E4", "eye"));
    if (blink < 0.85) {
      shapes.push(ellipseShape(x + (pose.view === "threeQuarter" && !far ? rx * 0.12 : 0), eyeY, Math.max(2.2, rx * 0.22), Math.max(2.2, rx * 0.22), "#221D26", "none"));
    }
    if (blink > 0.2 && model !== MODELS.gloam) {
      shapes.push(openStroke([[x - rx, eyeY - ry * 0.15], [x + rx, eyeY - ry * 0.15]], "interior"));
    }
  }
  const mouth = a.mouth ? sc(a.mouth) : [eyeX, eyeY + skull * 0.35];
  const mw = skull * (model === MODELS.gloam ? 0.16 : 0.22);
  const vis = pose.viseme || "X";
  if (vis === "A") shapes.push(openStroke([[mouth[0] - mw, mouth[1]], [mouth[0] + mw, mouth[1]]], "mouth"));
  else if (vis === "F") shapes.push(ellipseShape(mouth[0], mouth[1], mw * 0.28, mw * 0.18, "#33282E", "mouth"));
  else if (vis === "E") shapes.push(ellipseShape(mouth[0], mouth[1] + 2, mw * 0.42, mw * 0.28, "#33282E", "mouth"));
  else if (vis === "D" || vis === "C" || vis === "H") {
    shapes.push(ellipseShape(mouth[0], mouth[1] + 3, mw * (vis === "D" ? 0.55 : 0.4), mw * (vis === "D" ? 0.4 : 0.26), "#33282E", "mouth"));
  } else shapes.push(openStroke([[mouth[0] - mw * 0.7, mouth[1]], [mouth[0], mouth[1] + mw * 0.12], [mouth[0] + mw * 0.7, mouth[1]]], "mouth"));
  if (model !== MODELS.gloam && pose.view !== "back") {
    const nose = a.nose ? sc(a.nose) : [mouth[0] + (pose.view === "threeQuarter" ? -6 : 4), mouth[1] - skull * 0.22];
    if (pose.view === "profile") {
      shapes.push(openStroke([[nose[0] - 8, nose[1] - 6], nose, [nose[0] - 10, nose[1] + 8]], "interior"));
    } else {
      shapes.push(openStroke([[nose[0] - 2, nose[1] - 8], [nose[0] + 7, nose[1]], [nose[0] - 1, nose[1] + 6]], "interior"));
    }
    const browY = eyeY - r * 1.35;
    shapes.push(openStroke([[eyeX - skull * 0.28, browY], [eyeX - skull * 0.05, browY - 1]], "interior"));
    if (pose.view !== "profile") shapes.push(openStroke([[eyeX + skull * 0.05, browY - 1], [eyeX + skull * 0.28, browY]], "interior"));
  }
  return shapes;
}

const cache = new Map();

export function drawCharacter(characterId = "dot", pose = {}) {
  const id = MODELS[characterId] ? characterId : "dot";
  const normal = normalizePose(id, { ...pose, character: id });
  const key = JSON.stringify([
    id, normal.view, normal.facing, Math.round(normal.lean), Math.round(normal.lShoulder), Math.round(normal.lElbow),
    Math.round(normal.rShoulder), Math.round(normal.rElbow), Math.round(normal.lHip), Math.round(normal.lKnee),
    Math.round(normal.rHip), Math.round(normal.rKnee), normal.handL, normal.handR, normal.viseme,
    Math.round(normal.squash * 20), Math.round(normal.pitch), Math.round(normal.weight * 4), normal.prop,
    Math.round(normal.blink * 4), Math.round(normal.hairLag * 4), Math.round(normal.clothLag * 4), Math.round(normal.beardLag * 4),
    Math.round(normal.plantL * 4), Math.round(normal.plantR * 4),
  ]);
  const authored = posedDrawing(id, normal.view, normal.drawing || "stand", normal.drawingTo, normal.drawU || 0);
  if (authored) {
    const footY = Math.max(...(authored.feet || [[0, authored.height || 0]]).map((foot) => foot[1]));
    const crown = authored.crown ?? 40;
    const chin = authored.chin ?? crown + 80;
    const hands = authored.shapes.filter((shape) => shape.role === "hand").length;
    return {
      width: authored.width || 560,
      height: footY + 4,
      shapes: authored.shapes.map((shape) => ({ ...shape, type: "path", strokeWidth: 0, opacity: 1, seed: (shape.seed || 1) + normal.boil })),
      metrics: {
        heads: MODELS[id].heads,
        measuredHeads: (footY - crown) / Math.max(24, chin - crown),
        volume: 90000,
        handLoops: hands,
        jacketLoops: 1,
        com: [(authored.width || 560) / 2, (chin + footY) / 2],
        feet: authored.feet || [[authored.width / 2, footY]],
        height: footY - crown,
        span: footY - crown,
      },
    };
  }
  let built = cache.get(key);
  if (!built) {
    built = constructCharacter(id, normal, MODELS[id]);
    if (cache.size > 240) cache.clear();
    cache.set(key, built);
  }
  return {
    ...built,
    shapes: built.shapes.map((shape) => ({ ...shape, seed: (shape.seed || 1) + normal.boil })),
  };
}

export function groundPlacement(scene = {}, pose = {}, pitch = 0, rig = null) {
  const horizon = (rig?.horizonY ?? (scene.horizon ?? 0.4) * 720) - pitch * 2.2;
  const floorFront = rig?.floorY ?? scene.floorY ?? 690;
  const vanishX = rig?.vanishX ?? scene.vanishX ?? 640;
  const depth = Math.max(0, Math.min(0.92, pose.depth ?? 0.3));
  const span = Math.max(40, floorFront - horizon);
  const y = horizon + span * (1 - depth);
  const perspective = Math.max(0.18, (y - horizon) / span);
  const x = vanishX + ((pose.groundX ?? 0) - vanishX) * perspective;
  return { x, y, scale: 0.42 + 0.78 * perspective, depth, horizon, floorFront };
}

export function scaleCheck(scene, { fps = 24 } = {}) {
  const flags = [];
  const times = [];
  const steps = Math.max(1, Math.round(scene.duration * fps));
  for (let frame = 0; frame < steps; frame += 4) times.push(frame / fps);
  const heights = [];
  for (const actor of scene.instances || []) {
    if (!actor.drawingKeys?.length) continue;
    const model = MODELS[actor.assetId];
    if (!model) continue;
    for (const time of times) {
      const pose = samplePose(actor.drawingKeys, time, { twos: actor.timing !== "ones", fps });
      const pitch = pose.pitch || 0;
      const shot = activeShot(scene, time);
      const place = groundPlacement(scene, pose, pitch, rigFor(shot.camera?.perspective));
      if (pose.depth < 0 || pose.depth > 0.92) {
        flags.push({ code: "depth", instanceId: actor.id, t: time });
      }
      const art = drawCharacter(actor.assetId, pose);
      const lowest = art.metrics.feet.reduce((m, foot) => Math.max(m, foot[1]), 0);
      if (art.metrics.feet.length && art.height - lowest > 18) {
        flags.push({ code: "float", instanceId: actor.id, t: time, gap: Math.round(art.height - lowest) });
      }
      if (art.metrics.feet.length && lowest - art.height > 4) {
        flags.push({ code: "sink", instanceId: actor.id, t: time });
      }
      const screen = model.world * place.scale * (actor.scale || 1);
      const expected = model.world * place.scale;
      if (Math.abs(screen - expected) / expected > 0.12) {
        flags.push({ code: "scale", instanceId: actor.id, t: time, screen: Math.round(screen), expected: Math.round(expected) });
      }
      heights.push({ id: actor.assetId, world: screen / place.scale, t: time });
    }
  }
  const dot = MODELS.dot.world;
  for (const item of heights) {
    const model = MODELS[item.id];
    if (!model) continue;
    const ratio = item.world / dot;
    const expected = model.world / dot;
    if (Math.abs(ratio - expected) > 0.1) {
      flags.push({ code: "cast-scale", instanceId: item.id, t: item.t, ratio: Math.round(ratio * 100) / 100, expected: Math.round(expected * 100) / 100 });
    }
  }
  return { flags: flags.slice(0, 40), checked: times.length };
}

export function stagingCheck(scene, { fps = 24 } = {}) {
  const flags = [];
  const times = [0.15];
  for (const shot of scene.shots || []) times.push(Math.min(scene.duration - 0.05, shot.at + 0.2));
  const actors = (scene.instances || []).filter((actor) => MODELS[actor.assetId] && actor.drawingKeys?.length);
  for (const time of times) {
    const shot = activeShot(scene, time);
    const rig = rigFor(shot.camera?.perspective);
    const boxes = actors.map((actor) => {
      const pose = samplePose(actor.drawingKeys, time, { twos: actor.timing !== "ones", fps });
      const art = drawCharacter(actor.assetId, pose);
      const place = groundPlacement(scene, pose, 0, rig);
      const span = Math.max(40, art.metrics?.span || art.height);
      const drawScale = place.scale * (MODELS[actor.assetId].world / span);
      let minX = Infinity;
      let maxX = -Infinity;
      for (const shape of art.shapes) {
        const nums = String(shape.path || "").match(/-?\d*\.?\d+/g);
        if (!nums) continue;
        for (let i = 0; i + 1 < nums.length; i += 2) {
          const x = Number(nums[i]);
          if (x < minX) minX = x;
          if (x > maxX) maxX = x;
        }
      }
      const origin = art.width / 2;
      return {
        id: actor.id,
        left: place.x + (minX - origin) * drawScale,
        right: place.x + (maxX - origin) * drawScale,
        top: place.y - span * drawScale,
        bottom: place.y,
      };
    });
    for (const box of boxes) {
      if (box.left < 16) flags.push({ code: "edge", instanceId: box.id, t: time, edge: "left", at: Math.round(box.left) });
      if (box.right > 1264) flags.push({ code: "edge", instanceId: box.id, t: time, edge: "right", at: Math.round(box.right) });
      if (box.top < 4) flags.push({ code: "edge", instanceId: box.id, t: time, edge: "top", at: Math.round(box.top) });
      if (box.bottom > 712 || box.bottom < rig.horizonY + 8) {
        flags.push({ code: "floor", instanceId: box.id, t: time, foot: Math.round(box.bottom) });
      }
    }
    for (let i = 0; i < boxes.length; i += 1) {
      for (let j = i + 1; j < boxes.length; j += 1) {
        const a = boxes[i];
        const b = boxes[j];
        const overlapX = Math.min(a.right, b.right) - Math.max(a.left, b.left);
        const overlapY = Math.min(a.bottom, b.bottom) - Math.max(a.top, b.top);
        if (overlapX > 6 && overlapY > 20) {
          flags.push({
            code: "overlap",
            instanceId: a.id,
            other: b.id,
            t: time,
            overlapX: Math.round(overlapX),
            overlapY: Math.round(overlapY),
          });
        }
      }
    }
  }
  return { flags, checked: times.length };
}

export function modelCheck(characterId, pose = {}) {
  const art = drawCharacter(characterId, pose);
  const expected = MODELS[characterId]?.heads || 4.25;
  const measured = art.metrics.measuredHeads;
  const off = Math.abs(measured - expected) / expected;
  return {
    characterId,
    expected,
    measured: Math.round(measured * 100) / 100,
    offModel: off > 0.12,
    handLoops: art.metrics.handLoops,
    volume: Math.round(art.metrics.volume),
  };
}

export function physicalityReport(actor, { fps = 24, twos = true } = {}) {
  const keys = actor.drawingKeys || [];
  if (keys.length < 2) return { notes: [], plantedSlides: 0, balance: [] };
  const end = keys.at(-1).t;
  const samples = [];
  for (let frame = 0; frame <= Math.round(end * fps); frame += twos ? 2 : 1) {
    const pose = samplePose(keys, frame / fps, { twos, fps });
    const art = drawCharacter(actor.assetId, pose);
    const place = { x: pose.groundX || 0, y: 0, scale: 1 };
    const foot = (index) => {
      const local = art.metrics.feet[index];
      if (!local) return null;
      return { x: place.x + local[0] * 0.01, y: local[1] };
    };
    samples.push({
      t: frame / fps,
      com: art.metrics.com[0],
      feet: art.metrics.feet,
      planted: [pose.plantL !== 0, pose.plantR !== 0],
      volume: art.metrics.volume,
      head: pose.headTilt,
    });
  }
  const notes = [];
  let slides = 0;
  for (let i = 1; i < samples.length; i++) {
    for (const index of [0, 1]) {
      const a = samples[i - 1].feet[index];
      const b = samples[i].feet[index];
      if (!a || !b || !samples[i].planted[index] || !samples[i - 1].planted[index]) continue;
      if (Math.hypot(a[0] - b[0], a[1] - b[1]) > 6) {
        slides++;
        notes.push({ t: samples[i].t, code: "foot-slide", foot: index ? "right" : "left" });
      }
    }
    const feet = samples[i].feet.filter(Boolean);
    if (feet.length === 2 && samples[i].planted[0] && samples[i].planted[1]) {
      const min = Math.min(feet[0][0], feet[1][0]) - 10;
      const max = Math.max(feet[0][0], feet[1][0]) + 10;
      if (samples[i].com < min || samples[i].com > max) {
        notes.push({ t: samples[i].t, code: "off-balance" });
      }
    }
    const volumeDelta = Math.abs(samples[i].volume - samples[i - 1].volume) / (samples[i - 1].volume || 1);
    if (volumeDelta > 0.18) notes.push({ t: samples[i].t, code: "volume-pop", amount: Math.round(volumeDelta * 100) / 100 });
  }
  return { plantedSlides: slides, notes: notes.slice(0, 30), samples: samples.length };
}

export const DRAWING_CHARACTERS = Object.keys(MODELS);
