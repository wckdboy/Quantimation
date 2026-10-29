// Hard gate for a rendered episode. Every 12th frame has to keep the cast
// on model, on the floor, and clear of the furniture.

import { drawCharacter, groundPlacement, samplePose } from "./drawn.js";
import { activeShot } from "./model.js";
import { KITCHEN_LAYOUT, LOW, EYE } from "./plates.js";
import { drawShape, renderFrame } from "./renderer.js";

const BEARD = { r: [120, 190], g: [50, 120], b: [20, 80] };
const SHADOW = [137, 141, 115];
const DOME = [163, 168, 136];

function plateCam(perspective) {
  return perspective === "low" ? LOW : EYE;
}

function projectPlate(cam, x, y, z) {
  const f = cam.focal / Math.max(16, cam.camZ - z);
  return [cam.vpx + x * f, cam.vpy - (y - cam.eyeY) * f];
}

function viewOf(shot) {
  const zoom = shot.camera.zoom || 1;
  const camX = shot.camera.x ?? 640;
  const camY = shot.camera.y ?? 360;
  return {
    left: camX - 640 / zoom,
    right: camX + 640 / zoom,
    top: camY - 360 / zoom,
    bottom: camY + 360 / zoom,
    zoom,
    camX,
    camY,
  };
}

function inside(poly, x, y) {
  let hit = false;
  for (let i = 0, j = poly.length - 1; i < poly.length; j = i, i += 1) {
    const [xi, yi] = poly[i];
    const [xj, yj] = poly[j];
    const intersect = yi > y !== yj > y && x < ((xj - xi) * (y - yi)) / (yj - yi || 1e-6) + xi;
    if (intersect) hit = !hit;
  }
  return hit;
}

function rectsOverlap(a, b) {
  return a.x1 > b.x0 && b.x1 > a.x0 && a.y1 > b.y0 && b.y1 > a.y0;
}

function bounds(points) {
  return {
    x0: Math.min(...points.map((p) => p[0])),
    x1: Math.max(...points.map((p) => p[0])),
    y0: Math.min(...points.map((p) => p[1])),
    y1: Math.max(...points.map((p) => p[1])),
  };
}

function layoutPolys(perspective) {
  const cam = plateCam(perspective);
  const table = KITCHEN_LAYOUT.table;
  const chair = KITCHEN_LAYOUT.chair;
  const fridge = KITCHEN_LAYOUT.fridge;
  const top = [
    [table.x0, table.top, table.z0],
    [table.x1, table.top, table.z0],
    [table.x1, table.top, table.z1],
    [table.x0, table.top, table.z1],
  ].map(([x, y, z]) => projectPlate(cam, x, y, z));
  const seat = [
    [chair.x0, chair.seat, chair.z0],
    [chair.x1, chair.seat, chair.z0],
    [chair.x1, chair.seat, chair.z1],
    [chair.x0, chair.seat, chair.z1],
  ].map(([x, y, z]) => projectPlate(cam, x, y, z));
  const feet = [
    [chair.x0, 0, chair.z0],
    [chair.x1, 0, chair.z0],
    [chair.x0, 0, chair.z1],
    [chair.x1, 0, chair.z1],
  ].map(([x, y, z]) => projectPlate(cam, x, y, z));
  const ice = [
    [fridge.x0, 0, fridge.z1],
    [fridge.x1, 0, fridge.z1],
    [fridge.x1, fridge.top, fridge.z1],
    [fridge.x0, fridge.top, fridge.z1],
  ].map(([x, y, z]) => projectPlate(cam, x, y, z));
  return { top, seat, feet, ice };
}

function near(rgb, target, tol) {
  return Math.abs(rgb[0] - target[0]) <= tol && Math.abs(rgb[1] - target[1]) <= tol && Math.abs(rgb[2] - target[2]) <= tol;
}

function pathBox(path) {
  const nums = String(path).match(/-?\d*\.?\d+/g)?.map(Number) || [];
  let x0 = Infinity;
  let x1 = -Infinity;
  let y0 = Infinity;
  let y1 = -Infinity;
  for (let i = 0; i + 1 < nums.length; i += 2) {
    x0 = Math.min(x0, nums[i]);
    x1 = Math.max(x1, nums[i]);
    y0 = Math.min(y0, nums[i + 1]);
    y1 = Math.max(y1, nums[i + 1]);
  }
  return { x0, x1, y0, y1 };
}

function beardPixels(canvas, shape) {
  const ctx = canvas.getContext("2d");
  ctx.setTransform(1, 0, 0, 1, 0, 0);
  ctx.fillStyle = "#f4efe4";
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  ctx.save();
  ctx.translate(80, 40);
  drawShape(ctx, shape, 0, "still", 0, { ink: "broadcast", turnaround: true, k: 1, canvasScale: 1, assetId: "teo" });
  ctx.restore();
  const data = ctx.getImageData(0, 0, canvas.width, canvas.height).data;
  let count = 0;
  for (let i = 0; i < data.length; i += 4) {
    if (data[i] > BEARD.r[0] && data[i] < BEARD.r[1] && data[i + 1] > BEARD.g[0] && data[i + 1] < BEARD.g[1] && data[i + 2] > BEARD.b[0] && data[i + 2] < BEARD.b[1]) {
      count += 1;
    }
  }
  return count;
}

function modelFlags(actor, pose, canvas) {
  const flags = [];
  const art = drawCharacter(actor.assetId, pose);
  if (pose.view === "back") return flags;
  if (actor.assetId === "teo") {
    const beard = art.shapes.find((shape) => shape.role === "beard" || shape.id === "beard");
    const sheet = drawCharacter("teo", { view: pose.view, drawing: "stand" });
    const canon = sheet.shapes.find((shape) => shape.role === "beard" || shape.id === "beard");
    const posed = beard ? beardPixels(canvas, beard) : 0;
    const canonical = canon ? beardPixels(canvas, canon) : 0;
    if (!beard || posed < 400 || (canonical && posed < canonical * 0.45)) {
      flags.push(`teo-beard ${posed} vs sheet ${canonical}`);
    }
  }
  if (actor.assetId === "dot") {
    const bob = art.shapes.find((shape) => shape.role === "hair" || shape.id === "bob");
    const head = art.shapes.find((shape) => shape.role === "head");
    const box = bob ? pathBox(bob.path) : null;
    const face = head ? pathBox(head.path) : null;
    const jaw = face ? face.y0 + (face.y1 - face.y0) * 0.72 : 0;
    if (!box || !face || box.y1 < jaw) flags.push(`dot-bob ${box ? Math.round(box.y1) : "missing"}`);
  }
  return flags;
}

function framePoint(px, py, shot, width, height) {
  const zoom = shot.camera.zoom || 1;
  return {
    x: ((px - (shot.camera.x ?? 640)) * zoom + 640) * (width / 1280),
    y: ((py - (shot.camera.y ?? 360)) * zoom + 360) * (height / 720),
  };
}

function scanFrame(canvas, feet) {
  const flags = [];
  const { width, height } = canvas;
  const data = canvas.getContext("2d").getImageData(0, 0, width, height).data;
  let dome = 0;
  const shadowXs = [];
  const y0 = Math.floor(height * 0.72);
  const x0 = Math.floor(width * 0.28);
  const x1 = Math.floor(width * 0.72);
  for (let y = y0; y < height; y += 2) {
    for (let x = x0; x < x1; x += 2) {
      const i = (y * width + x) * 4;
      const rgb = [data[i], data[i + 1], data[i + 2]];
      if (near(rgb, DOME, 14)) dome += 4;
      if (near(rgb, SHADOW, 8)) shadowXs.push(x);
    }
  }
  if (dome > 2500) flags.push(`foreground-blob ${dome}px`);
  if (shadowXs.length) {
    shadowXs.sort((a, b) => a - b);
    let start = shadowXs[0];
    let last = shadowXs[0];
    let count = 1;
    const clusters = [];
    for (const x of shadowXs.slice(1)) {
      if (x - last > 36) {
        clusters.push({ x: (start + last) / 2, count });
        start = x;
        count = 0;
      }
      last = x;
      count += 1;
    }
    clusters.push({ x: (start + last) / 2, count });
    for (const cluster of clusters) {
      if (cluster.count < 12) continue;
      const nearFoot = feet.some((foot) => Math.abs(foot.sx - cluster.x) < 90);
      if (!nearFoot) flags.push(`orphan-shadow x${Math.round(cluster.x)}`);
    }
  }
  return flags;
}

export function reviewEpisode(episode, { createCanvas, step = 12, fps = 24 } = {}) {
  const scene = episode.scenes[0];
  const total = Math.max(1, Math.round(scene.duration * fps));
  const indexes = [];
  for (let index = 1; index <= total; index += step) indexes.push(index);
  const sheet = createCanvas(720, 900);
  const frame = createCanvas(640, 360);
  const failures = [];
  for (const index of indexes) {
    const t = (index - 1) / fps;
    const shot = activeShot(scene, t);
    const rig = { horizonY: plateCam(shot.camera.perspective).vpy, floorY: scene.floorY ?? 706, vanishX: plateCam(shot.camera.perspective).vpx };
    const view = viewOf(shot);
    const props = layoutPolys(shot.camera.perspective);
    const flags = [];
    const feet = [];
    for (const actor of scene.instances) {
      if (!actor.drawingKeys?.length) continue;
      const pose = samplePose(actor.drawingKeys, t, { twos: actor.timing !== "ones", fps });
      flags.push(...modelFlags(actor, pose, sheet));
      const place = groundPlacement(scene, pose, 0, rig);
      const foot = [place.x, place.y];
      const screen = framePoint(foot[0], foot[1], shot, frame.width, frame.height);
      feet.push({ id: actor.id, x: foot[0], y: foot[1], sx: screen.x, sy: screen.y, drawing: pose.drawing || "stand" });
      if (inside(props.top, foot[0], foot[1])) flags.push(`${actor.id}-on-table`);
      if (!String(pose.drawing || "stand").startsWith("sit") && inside(props.seat, foot[0], foot[1])) flags.push(`${actor.id}-on-chair`);
      if (foot[1] < rig.horizonY + 20) flags.push(`${actor.id}-above-floor`);
    }
    const table = bounds(props.top);
    const ice = bounds(props.ice);
    if (rectsOverlap(table, ice)) flags.push("table-fridge");
    const seatIn = props.seat.some(([x, y]) => x > view.left && x < view.right && y > view.top && y < view.bottom);
    const feetOut = props.feet.some(([x, y]) => x > view.left && x < view.right && y > view.bottom + 8);
    if (seatIn && feetOut) flags.push("chair-cropped");
    renderFrame(frame, episode, t, { ink: "broadcast", captions: false, smear: false });
    flags.push(...scanFrame(frame, feet));
    if (flags.length) failures.push({ frame: index, t: Math.round(t * 100) / 100, flags });
  }
  const held = actingFlags(scene, fps);
  if (held.length) failures.push({ frame: 0, t: 0, flags: held });
  return { checked: indexes.length, failures };
}

function poseStamp(pose) {
  return [
    pose.view,
    pose.drawing || "stand",
    Math.sign(Math.round(pose.lean || 0)),
    Math.sign(Math.round(pose.headTilt || 0)),
    (pose.blink || 0) > 0.5 ? "blink" : "open",
  ].join("/");
}

function actingFlags(scene, fps) {
  const flags = [];
  const end = scene.duration;
  for (const actor of scene.instances || []) {
    if (!actor.drawingKeys?.length) continue;
    const samples = [];
    for (let t = 0; t <= end + 1e-6; t += 0.25) {
      const pose = samplePose(actor.drawingKeys, Math.min(t, end), { twos: actor.timing !== "ones", fps });
      samples.push({ t, stamp: poseStamp(pose) });
    }
    for (let t = 0; t <= end - 2 + 1e-6; t += 0.5) {
      const seen = new Set(samples.filter((sample) => sample.t >= t - 1e-6 && sample.t <= t + 2 + 1e-6).map((sample) => sample.stamp));
      if (seen.size < 2) {
        flags.push(`${actor.id}-held@${t.toFixed(1)}`);
        if (flags.length > 6) return flags;
      }
    }
  }
  return flags;
}
