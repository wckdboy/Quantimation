import { activeShot, interpolate } from "./model.js";
import { poseAt } from "./pose.js";
import { onTwos, smoothstep } from "./timing.js";

export function onionTimes(time, { before = 2, after = 2, fps = 24, twos = true } = {}) {
  const step = (twos ? 2 : 1) / fps;
  const frames = [];
  const countBefore = Math.max(0, Math.min(8, before | 0));
  const countAfter = Math.max(0, Math.min(8, after | 0));
  for (let index = -countBefore; index <= countAfter; index++)
    frames.push({
      index,
      time: Math.max(0, time + index * step),
    });
  return frames;
}

function multiply(a, b) {
  return {
    a: a.a * b.a + a.c * b.b,
    b: a.b * b.a + a.d * b.b,
    c: a.a * b.c + a.c * b.d,
    d: a.b * b.c + a.d * b.d,
    e: a.a * b.e + a.c * b.f + a.e,
    f: a.b * b.e + a.d * b.f + a.f,
  };
}
const ident = () => ({ a: 1, b: 0, c: 0, d: 1, e: 0, f: 0 });
const translated = (x, y) => ({ a: 1, b: 0, c: 0, d: 1, e: x, f: y });
const rotated = (degrees) => {
  const r = (degrees * Math.PI) / 180;
  const c = Math.cos(r);
  const s = Math.sin(r);
  return { a: c, b: s, c: -s, d: c, e: 0, f: 0 };
};
const scaled = (x, y) => ({ a: x, b: 0, c: 0, d: y, e: 0, f: 0 });
const apply = (m, x, y) => ({ x: m.a * x + m.c * y + m.e, y: m.b * x + m.d * y + m.f });

function collect(nodes, into = []) {
  for (const node of nodes || []) {
    into.push(node);
    if (node.children) collect(node.children, into);
    if (node.variants) for (const variant of node.variants) collect(variant.children, into);
  }
  return into;
}

export function jointPositions(asset, instance, time) {
  const tracks = new Map((instance.tracks || []).map((track) => [track.target, track]));
  const nodes = collect(asset.shapes);
  const byId = new Map(nodes.filter((node) => node.id).map((node) => [node.id, node]));
  const parent = new Map();
  const walkParents = (list, owner) => {
    for (const node of list || []) {
      if (owner) parent.set(node, owner);
      if (node.children) walkParents(node.children, node);
    }
  };
  walkParents(asset.shapes, null);
  const state = interpolate(instance, time);
  let root = translated(state.x, state.y + 0);
  root = multiply(root, rotated(state.rotation || 0));
  root = multiply(root, scaled(state.scale * (instance.flip ? -1 : 1), state.scale));
  root = multiply(root, translated(-asset.width / 2, -asset.height));
  const local = new Map();
  const matrixFor = (node) => {
    if (local.has(node)) return local.get(node);
    const owner = parent.get(node);
    let m = owner ? matrixFor(owner) : root;
    const pose = poseAt(node.id ? tracks.get(node.id) : null, time);
    const px = node.pivotX ?? node.x ?? 0;
    const py = node.pivotY ?? node.y ?? 0;
    if (node.id && tracks.has(node.id)) {
      m = multiply(m, translated(pose.x + px, pose.y + py));
      m = multiply(m, rotated(pose.rotation));
      m = multiply(m, scaled(pose.scaleX, pose.scaleY));
      m = multiply(m, translated(-px, -py));
    }
    if (node.rotation) {
      m = multiply(m, translated(px, py));
      m = multiply(m, rotated(node.rotation));
      m = multiply(m, translated(-px, -py));
    }
    if (node.scaleX || node.scaleY)
      m = multiply(
        multiply(multiply(m, translated(px, py)), scaled(node.scaleX || 1, node.scaleY || 1)),
        translated(-px, -py),
      );
    if (node.x || node.y) m = multiply(m, translated(node.x || 0, node.y || 0));
    local.set(node, m);
    return m;
  };
  const points = {};
  for (const [id, node] of byId) {
    const m = matrixFor(node);
    const px = node.pivotX ?? node.x ?? 0;
    const py = node.pivotY ?? node.y ?? 0;
    points[id] = apply(m, px, py);
  }
  return points;
}

export const TRAIL_JOINTS = [
  "head",
  "left_hand",
  "right_hand",
  "pupil_left",
  "pupil_right",
  "eye_left",
  "jaw",
];

export function worldToCanvas(scene, time, x, y, canvasW = 1280, canvasH = 720) {
  const shot = activeShot(scene, time);
  const c = shot.camera;
  const ratio = shot.progress;
  const eased = smoothstep(ratio);
  const zoom = c.zoom + ((c.zoomEnd ?? c.zoom) - c.zoom) * eased;
  let px = x - (c.x + (c.panX || 0) * ratio);
  let py = y - (c.y + (c.panY || 0) * ratio);
  px *= zoom;
  py *= zoom;
  const a = ((c.rotation || 0) * Math.PI) / 180;
  const rx = px * Math.cos(a) - py * Math.sin(a);
  const ry = px * Math.sin(a) + py * Math.cos(a);
  const sx = canvasW / 1280;
  const sy = canvasH / 720;
  return { x: (rx + 640) * sx, y: (ry + 360) * sy };
}

function mean(values) {
  if (!values.length) return 0;
  return values.reduce((sum, n) => sum + n, 0) / values.length;
}

function deviation(values) {
  if (values.length < 2) return 0;
  const avg = mean(values);
  return Math.sqrt(mean(values.map((n) => (n - avg) ** 2)));
}

export function analyzeJoint(samples) {
  const suspects = [];
  const speeds = [];
  const accels = [];
  for (let i = 1; i < samples.length; i++) {
    const dt = Math.max(1 / 48, samples[i].t - samples[i - 1].t);
    const dx = samples[i].x - samples[i - 1].x;
    const dy = samples[i].y - samples[i - 1].y;
    const speed = Math.hypot(dx, dy) / dt;
    speeds.push(speed);
    if (i >= 2) {
      const prevDt = Math.max(1 / 48, samples[i - 1].t - samples[i - 2].t);
      const prev = speeds.at(-2);
      const accel = (speed - prev) / ((dt + prevDt) / 2);
      accels.push(accel);
      const p0 = samples[i - 2];
      const p1 = samples[i - 1];
      const p2 = samples[i];
      const chord = Math.hypot(p2.x - p0.x, p2.y - p0.y) || 1;
      const nx = -(p2.y - p0.y) / chord;
      const ny = (p2.x - p0.x) / chord;
      const arc = (p1.x - p0.x) * nx + (p1.y - p0.y) * ny;
      if (Math.abs(arc) > 42 && speed > 80 && prev > 80)
        suspects.push({
          t: p1.t,
          code: "arc-pop",
          value: Math.round(arc * 10) / 10,
          message: "Joint leaves a smooth arc.",
        });
      if (Math.abs(accel) > 9000)
        suspects.push({
          t: samples[i].t,
          code: "accel-spike",
          value: Math.round(accel),
          message: "Acceleration spike.",
        });
    }
    if (Math.hypot(dx, dy) > 120)
      suspects.push({
        t: samples[i].t,
        code: "frame-jump",
        value: Math.round(Math.hypot(dx, dy) * 10) / 10,
        message: "Frame-to-frame position jump.",
      });
  }
  return {
    speeds,
    accels,
    maxSpeed: speeds.length ? Math.max(...speeds) : 0,
    maxAccel: accels.length ? Math.max(...accels.map(Math.abs)) : 0,
    suspects,
  };
}

export function motionReport(episode, { sceneId, instanceId, step = 1 / 12 } = {}) {
  const scene = episode.scenes.find((item) => item.id === sceneId) || episode.scenes[0];
  const actors = scene.instances.filter((instance) =>
    instanceId ? instance.id === instanceId : true,
  );
  const frames = [];
  const suspects = [];
  let maxSpeed = 0;
  let maxAccel = 0;
  for (const actor of actors) {
    const asset = episode.assets.find((item) => item.id === actor.assetId);
    if (!asset) continue;
    const series = new Map();
    for (let t = 0; t <= scene.duration + 1e-6; t += step) {
      const time = Math.min(scene.duration, Math.round(t * 1000) / 1000);
      const poseTime = onTwos(time);
      const points = jointPositions(asset, actor, poseTime);
      const joints = {};
      for (const name of TRAIL_JOINTS) {
        if (!points[name]) continue;
        joints[name] = points[name];
        if (!series.has(name)) series.set(name, []);
        series.get(name).push({ t: time, ...points[name] });
      }
      frames.push({ t: time, instanceId: actor.id, joints });
    }
    for (const [joint, samples] of series) {
      const report = analyzeJoint(samples);
      maxSpeed = Math.max(maxSpeed, report.maxSpeed);
      maxAccel = Math.max(maxAccel, report.maxAccel);
      for (const suspect of report.suspects)
        suspects.push({ ...suspect, joint, instanceId: actor.id });
    }
  }
  const accelValues = suspects
    .filter((item) => item.code === "accel-spike")
    .map((item) => Math.abs(item.value));
  return {
    sceneId: scene.id,
    step,
    frameCount: frames.length,
    maxSpeed: Math.round(maxSpeed),
    maxAccel: Math.round(maxAccel),
    accelSpread: Math.round(deviation(accelValues)),
    suspectCount: suspects.length,
    suspects: suspects.slice(0, 40),
    samples: frames.filter((_, index) => index % 4 === 0).slice(0, 80),
  };
}
