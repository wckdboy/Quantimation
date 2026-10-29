// Hard gate for a rendered episode. Every 12th frame has to keep the cast
// on model, on the floor, and clear of the furniture.

import { drawCharacter, groundPlacement, samplePose, MODELS } from "./drawn.js";
import { blobFlags } from "./drawings/props.js";
import { activeShot } from "./model.js";
import { KITCHEN_LAYOUT, LOW, EYE } from "./plates.js";
import { drawShape, renderFrame } from "./renderer.js";

const BEARD = { r: [120, 190], g: [50, 120], b: [20, 80] };
const SHADOW = [92, 97, 78];

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
  const counter = KITCHEN_LAYOUT.counter;
  const deck = [
    [counter.x0, counter.top, counter.z0],
    [counter.x1, counter.top, counter.z0],
    [counter.x1, counter.top, counter.z1],
    [counter.x0, counter.top, counter.z1],
  ].map(([x, y, z]) => projectPlate(cam, x, y, z));
  const back = [chair.x0 + 16, chair.x1 - 16].map((x) => projectPlate(cam, x, chair.seat, chair.z0)[0]);
  return { top, seat, feet, ice, deck, back };
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
    const drawing = String(pose.drawing || "stand");
    if (drawing === "stand" || drawing.startsWith("sit")) flags.push(...armBow(art), ...sleeveFlare(art));
    flags.push(...shoulderRoot(art));
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
    flags.push(...shoulderRoot(art));
    if (pose.drawing === "gesture") {
      const hand = art.shapes.find((shape) => shape.id === "handB");
      const torso = art.shapes.find((shape) => shape.id === "blazer");
      const reach = hand && torso ? pathBox(torso.path).x0 - pathBox(hand.path).x0 : 0;
      if (reach < 40) flags.push(`gesture-flat ${Math.round(reach)}`);
    }
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

function scanFrame(canvas, feet, wide) {
  const flags = [];
  const { width, height } = canvas;
  const data = canvas.getContext("2d").getImageData(0, 0, width, height).data;
  const shadowPts = [];
  const y0 = Math.floor(height * 0.72);
  const x0 = Math.floor(width * 0.28);
  const x1 = Math.floor(width * 0.72);
  for (let y = y0; y < height; y += 2) {
    for (let x = x0; x < x1; x += 2) {
      const i = (y * width + x) * 4;
      const rgb = [data[i], data[i + 1], data[i + 2]];
      if (near(rgb, SHADOW, 5)) shadowPts.push([x, y]);
    }
  }
  const luma = (x, y) => {
    const i = (y * width + x) * 4;
    return 0.3 * data[i] + 0.5 * data[i + 1] + 0.2 * data[i + 2];
  };
  const band = (yFrac) => {
    let sum = 0;
    let n = 0;
    const y = Math.floor(height * yFrac);
    for (let x = Math.floor(width * 0.36); x < width * 0.58; x += 3) {
      const value = luma(x, y);
      if (value > 140 && value < 230) {
        sum += value;
        n += 1;
      }
    }
    return n > 8 ? sum / n : null;
  };
  const nearFloor = band(0.93);
  const farFloor = band(0.8);
  if (wide && nearFloor != null && farFloor != null && farFloor - nearFloor < 8) flags.push("flat-floor");
  if (shadowPts.length) {
    shadowPts.sort((a, b) => a[0] - b[0]);
    let run = [shadowPts[0]];
    const clusters = [];
    for (const point of shadowPts.slice(1)) {
      if (point[0] - run.at(-1)[0] > 36) {
        clusters.push(run);
        run = [];
      }
      run.push(point);
    }
    clusters.push(run);
    for (const cluster of clusters) {
      if (cluster.length < 12) continue;
      const xs = cluster.map((point) => point[0]);
      const ys = cluster.map((point) => point[1]);
      const cx = (Math.min(...xs) + Math.max(...xs)) / 2;
      const tall = Math.max(...ys) - Math.min(...ys);
      const wideShadow = Math.max(...xs) - Math.min(...xs);
      const nearFoot = feet.some((foot) => Math.abs(foot.sx - cx) < 90);
      if (!nearFoot && cluster.length > 40) flags.push(`orphan-shadow x${Math.round(cx)}`);
      if (nearFoot && cluster.length > 120 && tall > 40 && wideShadow > 120) {
        flags.push(`shadow-dome ${Math.round(wideShadow)}x${Math.round(tall)}`);
      }
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
    const scales = [];
    for (const actor of scene.instances) {
      if (!actor.drawingKeys?.length) continue;
      const pose = samplePose(actor.drawingKeys, t, { twos: actor.timing !== "ones", fps });
      flags.push(...modelFlags(actor, pose, sheet));
      const place = groundPlacement(scene, pose, 0, rig);
      const model = MODELS[actor.assetId];
      if (model) {
        scales.push({
          id: actor.id,
          world: model.world,
          footY: place.y,
          horizon: place.horizon,
          floorFront: place.floorFront,
          height: model.world * place.scale,
        });
      }
      const foot = [place.x, place.y];
      const screen = framePoint(foot[0], foot[1], shot, frame.width, frame.height);
      feet.push({ id: actor.id, x: foot[0], y: foot[1], sx: screen.x, sy: screen.y, drawing: pose.drawing || "stand" });
      if (inside(props.top, foot[0], foot[1])) flags.push(`${actor.id}-on-table`);
      if (inside(props.deck, foot[0], foot[1])) flags.push(`${actor.id}-on-counter`);
      const seated = String(pose.drawing || "stand").startsWith("sit");
      if (!seated && inside(props.seat, foot[0], foot[1])) flags.push(`${actor.id}-on-chair`);
      if (seated && actor.assetId === "teo") {
        flags.push(...seatFlags(pose, place, props.seat));
        const art = drawCharacter("teo", pose);
        const shirt = art.shapes.find((shape) => shape.id === "shirt");
        if (shirt) {
          const hip = pathBox(shirt.path);
          const drawScale = place.scale * ((MODELS.teo?.world || 380) / Math.max(40, art.metrics.span));
          const hipX = place.x + ((hip.x0 + hip.x1) / 2 - art.width / 2) * drawScale;
          flags.push(...chairStraddle(hipX, props.back));
        }
      }
      if (foot[1] < rig.horizonY + 20) flags.push(`${actor.id}-above-floor`);
    }
    const table = bounds(props.top);
    const ice = bounds(props.ice);
    if (rectsOverlap(table, ice)) flags.push("table-fridge");
    const seatIn = props.seat.some(([x, y]) => x > view.left && x < view.right && y > view.top && y < view.bottom);
    const feetOut = props.feet.some(([x, y]) => x > view.left && x < view.right && y > view.bottom + 8);
    const someoneSeated = feet.some((foot) => String(foot.drawing).startsWith("sit"));
    if (seatIn && feetOut && !someoneSeated) flags.push("chair-cropped");
    flags.push(...horizonScaleFlags(scales));
    const envId = shot.camera.perspective === "low" ? "dot_kitchen_low" : "dot_kitchen";
    const plate = episode.assets.find((asset) => asset.id === envId) || episode.assets.find((asset) => asset.id === "dot_kitchen");
    flags.push(...underfootFlags(flatShapes(plate?.shapes), feet));
    renderFrame(frame, episode, t, { ink: "broadcast", captions: false, smear: false });
    flags.push(...scanFrame(frame, feet, shot.label === "Wide"));
    if (flags.length) failures.push({ frame: index, t: Math.round(t * 100) / 100, flags });
  }
  const held = actingFlags(scene, fps);
  const blobs = blobFlags(flatShapes(episode.assets.find((asset) => asset.id === "dot_kitchen")?.shapes));
  const heldFlags = [...held, ...blobs];
  if (heldFlags.length) failures.push({ frame: 0, t: 0, flags: heldFlags });
  return { checked: indexes.length, failures };
}

function flatShapes(nodes, out = []) {
  for (const node of nodes || []) {
    if (node?.type === "group") flatShapes(node.children, out);
    else if (node) out.push(node);
  }
  return out;
}

function underfootFlags(shapes, feet) {
  const flags = [];
  for (const shape of shapes) {
    if (!shape.path || !shape.fill || shape.fill === "none" || shape.line !== "prop") continue;
    const id = shape.id || "";
    if (id.includes("_") || id.startsWith("chair")) continue;
    const box = pathBox(shape.path);
    const near = feet.some((foot) => foot.x > box.x0 - 36 && foot.x < box.x1 + 36 && foot.y > box.y0 - 20 && foot.y < box.y1 + 90);
    if (near) flags.push(`blob-under ${id}`);
  }
  return flags;
}

function toScreen(art, place, x, y) {
  const footY = Math.max(...art.metrics.feet.map((foot) => foot[1]));
  const drawScale = place.scale * ((MODELS.teo?.world || 380) / Math.max(40, art.metrics.span));
  return [
    place.x + (x - art.width / 2) * drawScale,
    place.y + (y - footY) * drawScale,
  ];
}

function highestPoint(shape) {
  const nums = String(shape?.path || "").match(/-?\d*\.?\d+/g)?.map(Number) || [];
  let best = null;
  for (let i = 0; i + 1 < nums.length; i += 2) {
    if (!best || nums[i + 1] < best[1]) best = [nums[i], nums[i + 1]];
  }
  return best;
}

function centerX(shape) {
  const box = shape ? pathBox(shape.path) : null;
  return box ? (box.x0 + box.x1) / 2 : null;
}

function seatFlags(pose, place, seat) {
  const art = drawCharacter("teo", pose);
  const hips = ["thighL", "thighR"].map((id) => highestPoint(art.shapes.find((shape) => shape.id === id))).filter(Boolean);
  if (hips.length < 2) return ["teo-no-seat"];
  const flags = [];
  const screens = hips.map(([x, y]) => toScreen(art, place, x, y));
  if (screens.some(([x, y]) => !inside(seat, x, y))) {
    flags.push(`teo-no-seat ${screens.map((point) => point.map((n) => Math.round(n)).join(",")).join(" ")}`);
  }
  for (const side of ["L", "R"]) {
    const knee = centerX(art.shapes.find((shape) => shape.id === `knee${side}`));
    const boot = centerX(art.shapes.find((shape) => shape.id === `boot${side}`));
    if (knee == null || boot == null || Math.abs(knee - boot) > 36) flags.push(`teo-foot-knee ${side}`);
  }
  return flags;
}

function horizonScaleFlags(samples) {
  const flags = [];
  for (const sample of samples) {
    const span = Math.max(40, sample.floorFront - sample.horizon);
    const perspective = Math.max(0.18, (sample.footY - sample.horizon) / span);
    const expected = sample.world * (0.58 + 0.78 * perspective);
    if (Math.abs(sample.height - expected) / expected > 0.05) {
      flags.push(`scale-${sample.id} ${Math.round(sample.height)} vs ${Math.round(expected)}`);
    }
  }
  return flags;
}

function chairStraddle(hipX, back) {
  if (!back || back.length < 2) return [];
  const left = Math.min(...back);
  const right = Math.max(...back);
  if (hipX < left - 8 || hipX > right + 8) return [`teo-beside-chair ${Math.round(hipX)}`];
  return [];
}

function shoulderRoot(art) {
  const torso = art.shapes.find((shape) => shape.id === "shirt" || shape.id === "blazer");
  if (!torso) return [];
  const box = pathBox(torso.path);
  const span = box.y1 - box.y0;
  const flags = [];
  for (const shape of art.shapes) {
    if (!/^(sleeve|arm)/.test(shape.id || "")) continue;
    if (shape.line === "interior") continue;
    const sleeve = pathBox(shape.path);
    if (sleeve.y0 > box.y0 + span * 0.34) flags.push(`${shape.id}-root ${Math.round(sleeve.y0 - box.y0)}`);
  }
  return flags;
}

function armBow(art) {
  const flags = [];
  for (const id of ["sleeveL", "sleeveR"]) {
    const shape = art.shapes.find((item) => item.id === id);
    if (!shape) continue;
    const nums = String(shape.path).match(/-?\d*\.?\d+/g)?.map(Number) || [];
    const pts = [];
    for (let i = 0; i + 1 < nums.length; i += 2) pts.push([nums[i], nums[i + 1]]);
    if (pts.length < 4) continue;
    const torso = art.shapes.find((shape) => shape.id === "shirt");
    const hip = torso ? pathBox(torso.path).y1 : Infinity;
    const top = pts.reduce((best, point) => (point[1] < best[1] ? point : best));
    const bottom = pts.reduce((best, point) => (point[1] > best[1] ? point : best));
    if (bottom[1] < hip - 24) continue;
    const dx = bottom[0] - top[0];
    const dy = bottom[1] - top[1];
    const len = Math.hypot(dx, dy) || 1;
    let worst = 0;
    for (const point of pts) {
      const along = ((point[0] - top[0]) * dx + (point[1] - top[1]) * dy) / (len * len);
      if (along < 0.25 || along > 0.75) continue;
      const px = top[0] + dx * along;
      const py = top[1] + dy * along;
      worst = Math.max(worst, Math.hypot(point[0] - px, point[1] - py));
    }
    if (worst > 22) flags.push(`${id}-bow ${Math.round(worst)}`);
  }
  return flags;
}

function sleeveFlare(art) {
  const torso = art.shapes.find((shape) => shape.id === "shirt");
  if (!torso) return [];
  const box = pathBox(torso.path);
  const torsoH = box.y1 - box.y0;
  const flags = [];
  for (const id of ["sleeveL", "sleeveR"]) {
    const shape = art.shapes.find((item) => item.id === id);
    if (!shape) continue;
    const sleeve = pathBox(shape.path);
    if (sleeve.y1 - sleeve.y0 < torsoH * 0.55) continue;
    const outside = id.endsWith("L") ? box.x0 - sleeve.x0 : sleeve.x1 - box.x1;
    if (outside > 34) flags.push(`${id}-flare ${Math.round(outside)}`);
  }
  return flags;
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
