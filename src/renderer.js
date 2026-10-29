import { activeShot, interpolate, locate, rejectRetiredCast } from "./model.js";
import { poseAt, motionOffset, speechMouth } from "./pose.js";
import { blinkClosed, squashStretch } from "./rig.js";
import { boundsOf, sampleShape, shadeHex } from "./ink.js";
import {
  LINE_CLASSES,
  fnv1a,
  strokeOutline,
  wobble,
} from "./line-engine.mjs";
import { onTwos, shakeOffset, smearVector, smoothstep } from "./timing.js";
import { jointPositions, onionTimes, TRAIL_JOINTS, worldToCanvas } from "./onion.js";
import { drawCharacter, groundPlacement, MODELS, samplePose } from "./drawn.js";
import { rigFor } from "./plates.js";
import { actorPlacement, cameraRig, projectSet } from "./layout.js";

const rad = (n) => (n * Math.PI) / 180;
const pathCache = new Map();

function roughEllipse(ctx, x, y, rx, ry, seed = 0) {
  for (let i = 0; i <= 60; i++) {
    const a = (i / 60) * Math.PI * 2,
      k = 1 + 0.018 * Math.sin(a * 7 + seed) + 0.012 * Math.cos(a * 13 + seed);
    const px = x + Math.cos(a) * rx * k,
      py = y + Math.sin(a) * ry * k;
    i ? ctx.lineTo(px, py) : ctx.moveTo(px, py);
  }
  ctx.closePath();
}
function roughRect(ctx, x, y, w, h) {
  ctx.moveTo(x, y);
  for (const [ax, ay, bx, by] of [
    [x, y, x + w, y],
    [x + w, y, x + w, y + h],
    [x + w, y + h, x, y + h],
    [x, y + h, x, y],
  ]) {
    const steps = Math.max(2, Math.ceil(Math.hypot(bx - ax, by - ay) / 18));
    for (let i = 1; i <= steps; i++) {
      const u = i / steps,
        k = Math.sin(u * Math.PI) * Math.sin(i * 2.3 + ax) * 1.8;
      ctx.lineTo(
        ax + (bx - ax) * u + (by - ay ? k : 0),
        ay + (by - ay) * u + (bx - ax ? k : 0),
      );
    }
  }
  ctx.closePath();
}

function traceSubs(ctx, subs) {
  ctx.beginPath();
  for (const sub of subs) {
    sub.points.forEach((p, i) => (i ? ctx.lineTo(p.x, p.y) : ctx.moveTo(p.x, p.y)));
    if (sub.closed) ctx.closePath();
  }
}

const baseGeometry = new WeakMap();
function baseSubs(shape) {
  let subs = baseGeometry.get(shape);
  if (!subs) {
    subs = sampleShape({ ...shape, strokeWidth: 0 }, 0).filter(
      (sub) => sub.points.length >= 2,
    );
    baseGeometry.set(shape, subs);
  }
  return subs;
}

function screenWidth(px, acting) {
  const k = Math.max(0.05, acting.k || 1);
  const canvasScale = acting.canvasScale || 1.5;
  const cap = !acting.environment && (acting.lineName === "contour" || acting.lineName === "eye") ? 1.45 : 1.25;
  const clamped = Math.max(0.8, Math.min(cap, k));
  const screenPx = Math.max(1.25, px * clamped);
  return screenPx / (k * canvasScale);
}

function paintShadow(ctx, subs, color, k, angleDeg) {
  const box = boundsOf(subs);
  const rad = (angleDeg * Math.PI) / 180;
  const towardLightX = Math.cos(rad);
  const towardLightY = -Math.sin(rad);
  const shift = Math.max(box.w, box.h) * k;
  ctx.save();
  traceSubs(ctx, subs);
  ctx.clip();
  ctx.beginPath();
  ctx.rect(box.x - box.w, box.y - box.h, box.w * 4, box.h * 4);
  for (const sub of subs) {
    sub.points.forEach((p, i) => {
      const x = p.x + towardLightX * shift;
      const y = p.y + towardLightY * shift;
      if (i) ctx.lineTo(x, y);
      else ctx.moveTo(x, y);
    });
    if (sub.closed) ctx.closePath();
  }
  ctx.fillStyle = color;
  ctx.fill("evenodd");
  ctx.restore();
}

function paintBroadcast(ctx, shape, acting) {
  const subs = baseSubs(shape);
  if (!subs.length) return;
  const fill = shape.fill && shape.fill !== "none" ? shape.fill : null;
  traceSubs(ctx, subs);
  if (fill && fill !== "transparent") {
    ctx.fillStyle = fill;
    ctx.fill();
    const clsName = shape.line;
    const shadowOn =
      shape.shadow === true ||
      (shape.shadow !== false &&
        ["contour", "prop", "bg"].includes(clsName) &&
        !acting.inMouth);
    if (shadowOn && subs.some((sub) => sub.closed)) {
      paintShadow(
        ctx,
        subs.filter((sub) => sub.closed),
        shape.shadowFill || shadeHex(fill, -0.32),
        shape.shadowK ?? 0.14,
        acting.lightAngle ?? 135,
      );
    }
  }
  const lineName =
    shape.line ||
    (acting.environment ? "bg" : (shape.strokeWidth ?? 0) >= 3 ? "contour" : "interior");
  const line = LINE_CLASSES[lineName];
  const inkLine = !acting.environment && ["contour", "eye", "mouth", "interior", "prop"].includes(lineName);
  const stroke = inkLine
    ? "#221D26"
    : shape.stroke && shape.stroke !== "none"
      ? shape.stroke
      : null;
  if (!line?.px || !stroke || stroke === "transparent") return;
  const width = screenWidth(line.px, { ...acting, lineName });
  const amp = (line.wobblePx || 0) / Math.max(0.05, (acting.k || 1) * (acting.canvasScale || 1.5));
  ctx.fillStyle = stroke;
  for (const sub of subs) {
    if (sub.points.length < 2) continue;
    const seed = fnv1a(
      `${acting.assetId || "asset"}/${shape.id || ""}/${shape.seed || 0}/${lineName}/${sub.points.length}`,
    );
    const pts = sub.points.map((p) => [p.x, p.y]);
    const moved = wobble(pts, { amp, seed, closed: sub.closed });
    const rings = strokeOutline(moved, {
      width,
      closed: sub.closed,
      taper: line.taper
        ? { startWidth: line.taper[0], endWidth: line.taper[1] }
        : null,
      mod: line.weightModulation || 0,
      light: acting.lightVector || [0.7, 0.7],
    });
    ctx.beginPath();
    for (const ring of rings) {
      ring.forEach((p, i) => (i ? ctx.lineTo(p[0], p[1]) : ctx.moveTo(p[0], p[1])));
      ctx.closePath();
    }
    ctx.fill(sub.closed ? "evenodd" : "nonzero");
  }
}

export function drawShape(
  ctx,
  s,
  t = 0,
  motion = "still",
  talk = 0,
  acting = {},
) {
  if (s.id === "turn_front" && acting.view && acting.view !== "front") return;
  if (s.id === "turn_three" && acting.view !== "threeQuarter") return;
  if (s.id === "turn_profile" && acting.view !== "profile") return;
  if (s.id === "turn_back" && acting.view !== "back") return;
  if (
    acting.view === "back" &&
    ["eye", "pupil", "mouth", "leftBrow", "rightBrow", "jaw"].includes(s.role)
  )
    return;
  if (s.id === "face_detail" && acting.view === "back") return;
  if (
    acting.view === "profile" &&
    s.role === "eye" &&
    !String(s.id || "").includes("pf_") &&
    !String(s.id || "").includes("tq_") &&
    (s.pivotX || s.x || 0) < (acting.assetWidth || 0) / 2 &&
    !acting.turnaround
  )
    return;
  ctx.save();
  ctx.globalAlpha *= s.opacity ?? 1;
  const px = s.pivotX ?? s.x ?? 0,
    py = s.pivotY ?? s.y ?? 0;
  const track = acting.tracks?.get(s.id);
  const poseTime = acting.poseTime ?? t;
  const pose = poseAt(track, poseTime);
  if (s.role === "mouth") {
    const live = poseAt(track, acting.liveTime ?? t);
    if (live.variant) pose.variant = live.variant;
  }
  if (track) {
    ctx.globalAlpha *= pose.opacity;
    ctx.translate(pose.x + px, pose.y + py);
    ctx.rotate(rad(pose.rotation));
    ctx.scale(pose.scaleX, pose.scaleY);
    ctx.translate(-px, -py);
  }
  let angle = s.rotation || 0;
  if (s.role?.endsWith("Leg") && motion === "walk")
    angle += Math.sin(poseTime * 7) * (s.role === "leftLeg" ? 18 : -18);
  if (s.role?.endsWith("Arm") && motion === "wave" && s.role === "rightArm" && !track)
    angle += -95 + Math.sin(poseTime * 8) * 20;
  if (s.role?.endsWith("Arm") && motion === "walk" && !track)
    angle += Math.sin(poseTime * 7) * (s.role === "leftArm" ? -16 : 16);
  const beat = acting.action,
    weight = acting.weight || 0;
  if (s.role === "head") {
    if (beat === "nod" || beat === "laugh")
      angle += Math.sin(poseTime * 9) * 11 * weight;
    if (beat === "smug") angle -= 8 * weight;
    if (beat === "recoil") angle -= 18 * weight;
  }
  if (s.role === "leftArm" || s.role === "rightArm") {
    const sign = s.role === "leftArm" ? 1 : -1;
    if (beat === "shrug") angle += sign * 45 * weight;
    if (beat === "point" && sign === -1) angle -= 70 * weight;
    if (beat === "laugh") angle += sign * Math.sin(poseTime * 10) * 14 * weight;
  }
  if (s.role === "leftBrow" || s.role === "rightBrow") {
    const sign = s.role === "leftBrow" ? 1 : -1;
    if (beat === "angry") angle += sign * 22 * weight;
    if (beat === "smug") angle += sign * 10 * weight;
    if (beat === "surprised") ctx.translate(0, -8 * weight);
  }
  if (s.line === "fx" && acting.boil) {
    const bucket = Math.floor((acting.liveTime || 0) * 12);
    const n = Math.sin(bucket * 12.9898 + (s.seed || 1)) * 43758.5453;
    const wob = (n - Math.floor(n) - 0.5) * 0.8;
    ctx.translate(wob, wob * 0.4);
  }
  if (angle) {
    ctx.translate(px, py);
    ctx.rotate(rad(angle));
    ctx.translate(-px, -py);
  }
  const drawnTurn = acting.turnaround || s.turnaround;
  if (s.role === "head" && !drawnTurn) {
    if (acting.view === "profile") {
      ctx.translate(px, py);
      ctx.scale(0.62, 1);
      ctx.translate(-px, -py);
    } else if (acting.view === "threeQuarter") {
      ctx.translate(px, py);
      ctx.transform(0.86, 0, -0.05, 1, 0, 0);
      ctx.translate(-px, -py);
    }
  }
  if (s.id === "hair" && acting.view === "profile" && !drawnTurn) {
    ctx.translate(px, py);
    ctx.scale(0.78, 1);
    ctx.translate(16, 0);
    ctx.translate(-px, -py);
  }
  if (s.role === "mouth" && acting.view === "profile" && !drawnTurn) ctx.translate(26, 8);
  if (s.role === "mouth" && acting.view === "threeQuarter" && !drawnTurn)
    ctx.translate(12, 2);
  if (s.role === "eye" && !drawnTurn && acting.blink !== false && !acting.suppressBlink) {
    const closed = blinkClosed(acting.liveTime ?? t, acting.blinkSeed || 1);
    if (closed > 0) {
      ctx.translate(px, py);
      ctx.scale(1, Math.max(0.08, 1 - closed * 0.92));
      ctx.translate(-px, -py);
    }
  }
  if (s.role === "eye" && acting.view === "threeQuarter" && !drawnTurn) {
    if ((s.pivotX || 0) < (acting.assetWidth || 0) / 2) {
      ctx.translate(px, py);
      ctx.scale(0.72, 0.9);
      ctx.translate(-px, -py);
    }
  }
  if (s.scaleX !== undefined || s.scaleY !== undefined) {
    ctx.translate(px, py);
    ctx.scale(s.scaleX ?? 1, s.scaleY ?? 1);
    ctx.translate(-px, -py);
  }
  if (s.role === "eye" && beat === "surprised") {
    ctx.translate(px, py);
    ctx.scale(1 + weight * 0.15, 1 + weight * 0.2);
    ctx.translate(-px, -py);
  }
  if (
    s.role === "mouth" &&
    !s.variants &&
    ["path", "group"].includes(s.type) &&
    acting.ink === "legacy"
  ) {
    ctx.translate(px, py);
    ctx.scale(1, 1 + talk * 1.1);
    ctx.translate(-px, -py);
  }
  const childActing = {
    ...acting,
    inMouth: acting.inMouth || s.role === "mouth",
    turnaround: acting.turnaround || s.turnaround || false,
  };
  if (s.type === "group") {
    ctx.translate(s.x || 0, s.y || 0);
    const name =
      pose.variant && pose.variant !== "auto"
        ? pose.variant
        : s.role === "mouth"
          ? acting.mouth
          : undefined;
    const variant =
      s.variants?.find((v) => v.name === name) ||
      s.variants?.find((v) => v.name === "closed");
    for (const child of variant?.children || s.children || [])
      drawShape(ctx, child, t, motion, talk, childActing);
  } else if (s.type === "text") {
    ctx.fillStyle = s.fill && s.fill !== "none" ? s.fill : "#241f1a";
    ctx.font = `600 ${s.fontSize || 20}px Arial, sans-serif`;
    ctx.fillText(s.text || "", s.x || 0, s.y || 0);
  } else if (acting.ink !== "legacy") {
    paintBroadcast(ctx, s, childActing);
  } else {
    ctx.fillStyle = s.fill && s.fill !== "none" ? s.fill : "transparent";
    ctx.strokeStyle = s.stroke && s.stroke !== "none" ? s.stroke : "transparent";
    ctx.lineWidth = (s.strokeWidth ?? 0) * (acting.lineScale || 1);
    ctx.lineJoin = "round";
    ctx.lineCap = "round";
    ctx.beginPath();
    if (s.type === "ellipse") {
      const rx = s.rx ?? s.radius ?? 10,
        ry =
          s.role === "mouth"
            ? (s.ry ?? 5) + talk * 14
            : (s.ry ?? s.radius ?? 10);
      if (acting.rough && rx > 4)
        roughEllipse(ctx, s.x || 0, s.y || 0, rx, ry, s.x || 0);
      else ctx.ellipse(s.x || 0, s.y || 0, rx, ry, 0, 0, Math.PI * 2);
    } else if (s.type === "rect") {
      if (acting.rough && !s.radius)
        roughRect(ctx, s.x || 0, s.y || 0, s.width || 1, s.height || 1);
      else
        ctx.roundRect(
          s.x || 0,
          s.y || 0,
          s.width || 1,
          s.height || 1,
          s.radius || 0,
        );
    } else if (s.type === "line") {
      ctx.moveTo(s.x || 0, s.y || 0);
      ctx.lineTo(s.x2 || 0, s.y2 || 0);
    } else if (s.type === "polygon") {
      (s.points || []).forEach((p, i) =>
        i ? ctx.lineTo(...p) : ctx.moveTo(...p),
      );
      ctx.closePath();
    } else if (s.type === "path") {
      if (typeof Path2D !== "function") {
        traceSubs(ctx, sampleShape({ ...s, strokeWidth: 0 }, 0));
        ctx.fill();
        if (ctx.lineWidth) ctx.stroke();
      } else {
        let path = pathCache.get(s.path);
        if (!path) {
          path = new Path2D(s.path);
          if (pathCache.size > 2000) pathCache.clear();
          pathCache.set(s.path, path);
        }
        ctx.fill(path);
        if (ctx.lineWidth) ctx.stroke(path);
      }
      ctx.restore();
      return;
    }
    ctx.fill();
    if (ctx.lineWidth) ctx.stroke();
  }
  ctx.restore();
}

export function renderAsset(canvas, asset, options = {}) {
  const ctx = canvas.getContext("2d");
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  const scale =
    Math.min(canvas.width / asset.width, canvas.height / asset.height) * 0.89;
  ctx.save();
  ctx.translate(
    (canvas.width - asset.width * scale) / 2,
    (canvas.height - asset.height * scale) / 2,
  );
  ctx.scale(scale, scale);
  for (const s of asset.shapes)
    drawShape(ctx, s, 0, "still", 0, {
      rough: options.ink === "legacy",
      ink: options.ink || "broadcast",
      view: options.view || "front",
    });
  ctx.restore();
}

function frameOptions(episode, options, t) {
  const twos = options.animOnTwos !== false;
  return {
    ink: options.ink || "broadcast",
    poseTime: twos ? onTwos(t) : t,
    liveTime: t,
    captions: options.captions,
  };
}

export function renderFrame(canvas, episode, time, options = {}) {
  const ctx = canvas.getContext("2d");
  const hit = locate(episode, time);
  if (!hit) return;
  for (const asset of episode.assets || []) rejectRetiredCast(asset);
  const { scene: s, time: t } = hit;
  const timing = frameOptions(episode, options, t);
  ctx.save();
  ctx.setTransform(canvas.width / 1280, 0, 0, canvas.height / 720, 0, 0);
  if (!options.actorsOnly) {
    ctx.fillStyle = s.background;
    ctx.fillRect(0, 0, 1280, 720);
  }
  const shot = activeShot(s, t),
    c = shot.camera,
    ratio = shot.progress,
    zoom = (() => {
      let end = c.zoomEnd ?? c.zoom;
      if (!c.motivated) {
        const span = Math.max(0.01, shot.end - shot.start);
        const limit = Math.abs(c.zoom) * 0.05 * span;
        end = c.zoom + Math.max(-limit, Math.min(limit, end - c.zoom));
      }
      return c.zoom + (end - c.zoom) * smoothstep(ratio);
    })();
  const rough = options.ink === "legacy" && /squiggly|hand.drawn|wicked/i.test(episode.style);
  const shake = shakeOffset(t, c.shake || 0, shot.start || 0);
  const lensOn = s.lens === true && timing.ink !== "legacy";
  const lensCam = lensOn ? cameraRig(shot.label, c.perspective, s.layout || "kitchen") : null;
  ctx.save();
  ctx.translate(640 + shake.x, 360 + shake.y);
  ctx.rotate(rad(lensCam ? 0 : c.rotation || 0));
  ctx.scale(lensCam ? 1 : zoom, lensCam ? 1 : zoom);
  // Low/high camera shear is banned by the art bible. A lens scene uses the 3D camera instead.
  ctx.translate(
    -(lensCam ? 640 : c.x + (c.panX || 0) * ratio),
    -(lensCam ? 360 : c.y + (c.panY || 0) * ratio),
  );
  const envId = c.perspective === "low" && episode.assets.some((a) => a.id === `${s.environment}_low`)
    ? `${s.environment}_low`
    : s.environment;
  const env = episode.assets.find((a) => a.id === envId);
  const shiftX = c.x + (c.panX || 0) * ratio - 640;
  const shiftY = c.y + (c.panY || 0) * ratio - 360;
  const setQueue = lensCam && !options.actorsOnly
    ? projectSet(s.layout === "garage" ? "garage" : s.layout === "market" ? "market" : "kitchen", lensCam)
    : null;
  let setCursor = 0;
  const flushSet = (limit) => {
    if (!setQueue) return;
    while (setCursor < setQueue.length && setQueue[setCursor].z >= limit) {
      drawShape(ctx, setQueue[setCursor], timing.poseTime, "still", 0, {
        rough,
        ink: timing.ink,
        poseTime: timing.poseTime,
        liveTime: timing.liveTime,
        environment: true,
        assetId: env?.id || s.layout || "kitchen",
        k: 1,
        canvasScale: canvas.width / 1280,
        lightAngle: s.lightAngleDeg ?? 90,
      });
      setCursor += 1;
    }
  };
  if (!setQueue && env && !options.actorsOnly) {
    ctx.save();
    ctx.scale(1280 / env.width, 720 / env.height);
    for (const n of env.shapes) {
      ctx.save();
      const factor = n.parallax ?? 1;
      ctx.translate(shiftX * (1 - factor), shiftY * (1 - factor) * 0.65);
      drawShape(ctx, n, timing.poseTime, "still", 0, {
        rough,
        ink: timing.ink,
        poseTime: timing.poseTime,
        liveTime: timing.liveTime,
        environment: true,
        assetId: env.id,
        k: zoom,
        canvasScale: canvas.width / 1280,
        lightAngle: s.lightAngleDeg ?? 90,
      });
      ctx.restore();
    }
    ctx.restore();
  }
  const lines = s.dialogue.filter((d) => t >= d.at && t < d.at + d.duration);
  const cast = lensCam
    ? [...s.instances].sort((a, b) => {
        const depthOf = (actor) =>
          actor.drawingKeys?.length
            ? samplePose(actor.drawingKeys, poseTimeOf(actor), { twos: actor.timing !== "ones" }).wz
            : 0;
        return depthOf(b) - depthOf(a);
      })
    : s.instances;
  function poseTimeOf(actor) {
    return actor.onOnes || options.animOnTwos === false ? t : timing.poseTime;
  }
  for (const p of cast) {
    const asset = episode.assets.find((a) => a.id === p.assetId);
    if (!asset) continue;
    const poseTime =
      p.onOnes || options.animOnTwos === false ? t : timing.poseTime;
    const state = interpolate(
      p,
      asset.kind === "character" || asset.kind === "creature" ? poseTime : t,
    );
    const previous = interpolate(
      p,
      Math.max(0, poseTime - 2 / 24),
    );
    const smear =
      options.smear !== false &&
      (asset.kind === "character" || asset.kind === "creature")
        ? smearVector(previous, state)
        : null;
    if (lensCam) {
      const depth = p.drawingKeys?.length
        ? samplePose(p.drawingKeys, poseTime, { twos: p.timing !== "ones" }).wz
        : 0;
      flushSet(depth);
    }
    ctx.save();
    ctx.globalAlpha = state.opacity;
    const beat = (p.beats || []).find(
        (b) => t >= b.at && t < b.at + b.duration,
      ),
      phase = beat ? (t - beat.at) / beat.duration : 0,
      weight = beat
        ? Math.min(1, phase * 6, (1 - phase) * 6) * beat.intensity
        : 0;
    const bob =
      motionOffset(p.motion, poseTime) +
      (beat?.action === "laugh"
        ? -Math.abs(Math.sin(poseTime * 10)) * 9 * weight
        : beat?.action === "recoil"
          ? -20 * weight
          : 0);
    const velocityY = (state.y - previous.y) * 12;
    const squash =
      asset.kind === "character" || asset.kind === "creature"
        ? squashStretch(velocityY)
        : { x: 1, y: 1 };
    let drawnArt = null;
    let drawX = state.x;
    let drawY = state.y;
    let drawScale = state.scale;
    let bodyLean = 0;
    let bodyWeight = 0;
    let headTilt = 0;
    if (p.drawingKeys?.length && timing.ink !== "legacy") {
      const pitch = lensCam ? lensCam.pitch : c.perspective === "low" ? 16 : c.perspective === "high" ? -14 : 0;
      const pose = samplePose(
        p.drawingKeys.map((key) => ({ ...key, character: p.assetId })),
        poseTime,
        { twos: p.timing !== "ones" },
      );
      pose.pitch = pitch;
      if (!options.suppressBlink)
        pose.blink = Math.max(pose.blink || 0, blinkClosed(timing.liveTime, fnv1a(p.id)));
      const mouthTrack = (p.tracks || []).find((track) => track.target === "mouth");
      if (mouthTrack) {
        const mouthPose = poseAt(mouthTrack, timing.liveTime ?? t);
        if (mouthPose.variant && mouthPose.variant !== "auto") pose.viseme = mouthPose.variant;
      }
      drawnArt = drawCharacter(p.assetId, pose);
      bodyLean = pose.lean || 0;
      bodyWeight = pose.weight || 0;
      headTilt = pose.headTilt || 0;
      const place = lensCam
        ? actorPlacement(lensCam, pose, MODELS[p.assetId] || MODELS.dot, drawnArt.metrics)
        : groundPlacement(s, pose, pitch, rigFor(c.perspective));
      drawX = place.x;
      drawY = place.y;
      const modelHeight = MODELS[p.assetId]?.world;
      drawScale = !lensCam && drawnArt?.metrics?.span && modelHeight
        ? place.scale * (modelHeight / drawnArt.metrics.span)
        : place.scale;
    }
    ctx.translate(drawX + bodyWeight * 26, drawY + bob);
    ctx.rotate(rad(state.rotation + bodyLean * 0.45 + headTilt * 0.25 + (p.motion === "spin" ? poseTime * 50 : 0)));
    ctx.scale(drawScale * (p.flip ? -1 : 1) * squash.x, drawScale * squash.y);
    if (asset.kind === "character" || asset.kind === "creature") {
      const locals = (drawnArt?.metrics?.feet || [[drawnArt?.width / 2 || 0, 0]]).map((foot) => foot[0] - (drawnArt?.width || 0) / 2);
      const mid = locals.reduce((sum, x) => sum + x, 0) / locals.length;
      const span = Math.max(...locals) - Math.min(...locals);
      ctx.save();
      ctx.scale(1, 1 / Math.max(0.2, drawScale));
      ctx.fillStyle = "#5C614E";
      ctx.beginPath();
      ctx.ellipse(mid, 3, Math.max(16, span * 0.55), 4.5, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }
    const footY = drawnArt?.metrics?.feet?.length
      ? Math.max(...drawnArt.metrics.feet.map((foot) => foot[1]))
      : drawnArt?.height || asset.height;
    ctx.translate(-(drawnArt?.width || asset.width) / 2, -footY);
    if (p.motion === "bounce") {
      const cycle = 1 + Math.sin(poseTime * 6) * 0.025;
      ctx.translate(asset.width / 2, asset.height);
      ctx.scale(1 / cycle, cycle);
      ctx.translate(-asset.width / 2, -asset.height);
    }
    const speechLine = lines.find((d) => d.speaker === asset.id);
    const speaking = !!speechLine;
    const talk = speaking
      ? (options.amplitude?.(speechLine.id, t) ??
        0.2 + 0.8 * Math.abs(Math.sin(t * 17)))
      : 0;
    const lightAngle = (s.lightAngleDeg ?? 135) + (p.flip ? 180 : 0);
    const lightRad = (lightAngle * Math.PI) / 180;
    const acting = {
      rough,
      ink: timing.ink,
      view: p.view,
      assetWidth: asset.width,
      assetId: asset.id,
      action: beat?.action,
      weight,
      talk,
      poseTime,
      liveTime: timing.liveTime,
      blinkSeed: fnv1a(p.id),
      k: Math.abs(drawScale) * zoom,
      canvasScale: canvas.width / 1280,
      lightAngle,
      lightVector: [Math.cos(lightRad + Math.PI), -Math.sin(lightRad + Math.PI)],
      suppressBlink: options.suppressBlink,
      mouth: speechMouth(
        speechLine?.text,
        speechLine ? (timing.liveTime - speechLine.at) / speechLine.duration : 0,
        talk,
      ),
      tracks: new Map((p.tracks || []).map((track) => [track.target, track])),
    };
    const drawActor = (ghost) => {
      if (ghost) {
        ctx.save();
        ctx.globalAlpha *= 0.28;
        ctx.translate(-ghost.dx * 0.45, -ghost.dy * 0.45);
        ctx.translate(asset.width / 2, asset.height * 0.42);
        ctx.scale(ghost.scaleX, 1 / Math.sqrt(ghost.scaleX));
        ctx.translate(-asset.width / 2, -asset.height * 0.42);
      }
      for (const node of drawnArt?.shapes || asset.shapes)
        drawShape(ctx, node, poseTime, drawnArt ? "still" : p.motion, talk, {
          ...acting,
          view: drawnArt ? "front" : acting.view,
          turnaround: drawnArt ? true : acting.turnaround,
        });
      if (ghost) ctx.restore();
    };
    if (smear) drawActor(smear);
    drawActor(null);
    if (options.selected === p.id) {
      ctx.strokeStyle = "#e7efb0";
      ctx.lineWidth = 2 / state.scale;
      ctx.setLineDash([7, 5]);
      ctx.strokeRect(-8, -8, asset.width + 16, asset.height + 16);
      ctx.setLineDash([]);
    }
    ctx.restore();
  }
  flushSet(-1e9);
  ctx.restore();
  if (s.grade && timing.ink !== "legacy" && !options.actorsOnly) {
    const strength = s.grade.strength ?? 0.22;
    ctx.save();
    ctx.globalAlpha = strength;
    ctx.fillStyle = s.grade.shadow;
    ctx.fillRect(0, 380, 1280, 340);
    ctx.globalAlpha = strength * 0.7;
    ctx.fillStyle = s.grade.highlight;
    ctx.fillRect(0, 0, 1280, 280);
    ctx.restore();
  }
  if (!options.actorsOnly && options.captions !== false && lines.length) {
    const words = lines[0].text.split(" "),
      rows = [];
    ctx.font = "500 21px Arial, sans-serif";
    let current = "";
    for (const word of words) {
      if (ctx.measureText(current + " " + word).width > 1000) {
        rows.push(current);
        current = word;
      } else current += (current ? " " : "") + word;
    }
    if (current) rows.push(current);
    const visible = rows.slice(0, 3),
      top = 688 - (visible.length - 1) * 27;
    ctx.textAlign = "center";
    ctx.lineJoin = "round";
    ctx.lineWidth = 4;
    ctx.strokeStyle = "#12171bd9";
    ctx.fillStyle = "#fffdf5";
    visible.forEach((row, i) => {
      ctx.strokeText(row, 640, top + i * 27);
      ctx.fillText(row, 640, top + i * 27);
    });
  }
  ctx.restore();
  return hit;
}

function tintCanvas(source, color, amount) {
  const ctx = source.getContext("2d");
  const image = ctx.getImageData(0, 0, source.width, source.height);
  const hex = color.replace("#", "");
  const r = parseInt(hex.slice(0, 2), 16);
  const g = parseInt(hex.slice(2, 4), 16);
  const b = parseInt(hex.slice(4, 6), 16);
  const data = image.data;
  for (let i = 0; i < data.length; i += 4) {
    if (data[i + 3] < 8) continue;
    data[i] = data[i] * (1 - amount) + r * amount;
    data[i + 1] = data[i + 1] * (1 - amount) + g * amount;
    data[i + 2] = data[i + 2] * (1 - amount) + b * amount;
  }
  ctx.putImageData(image, 0, 0);
}

export function renderOnionSkin(canvas, episode, time, options = {}) {
  const ctx = canvas.getContext("2d");
  const before = options.before ?? 2;
  const after = options.after ?? 2;
  const frames = onionTimes(time, {
    before,
    after,
    fps: options.fps || 24,
    twos: options.animOnTwos !== false,
  });
  const factory =
    options.createCanvas ||
    ((w, h) => {
      const off = canvas.ownerDocument.createElement("canvas");
      off.width = w;
      off.height = h;
      return off;
    });
  ctx.save();
  ctx.setTransform(1, 0, 0, 1, 0, 0);
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.fillStyle = "#14181c";
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  const span = Math.max(before, after, 1);
  const ordered = [...frames].sort((a, b) => {
    if (a.index === 0) return -1;
    if (b.index === 0) return 1;
    return Math.abs(b.index) - Math.abs(a.index);
  });
  for (const frame of ordered) {
    const off = factory(canvas.width, canvas.height);
    renderFrame(off, episode, frame.time, {
      ...options,
      captions: false,
      selected: null,
      smear: frame.index === 0,
      actorsOnly: frame.index !== 0,
    });
    if (frame.index < 0)
      tintCanvas(off, options.prevTint || "#6eb6ff", 0.72);
    else if (frame.index > 0)
      tintCanvas(off, options.nextTint || "#ff9d4a", 0.72);
    const distance = Math.abs(frame.index);
    const alpha =
      frame.index === 0
        ? 1
        : (options.opacity ?? 0.45) * (1 - (distance - 1) / (span + 0.25));
    ctx.globalAlpha = Math.max(0.08, alpha);
    ctx.drawImage(off, 0, 0);
  }
  ctx.globalAlpha = 1;
  if (options.trails !== false) {
    const hit = locate(episode, time);
    if (hit) {
      for (const actor of hit.scene.instances) {
        const asset = episode.assets.find((item) => item.id === actor.assetId);
        if (!asset || (asset.kind !== "character" && asset.kind !== "creature"))
          continue;
        for (const joint of TRAIL_JOINTS) {
          ctx.beginPath();
          let started = false;
          frames.forEach((frame, index) => {
            const sample = locate(episode, frame.time);
            if (!sample || sample.scene.id !== hit.scene.id) return;
            const points = jointPositions(asset, actor, onTwos(sample.time));
            if (!points[joint]) return;
            const at = worldToCanvas(
              sample.scene,
              sample.time,
              points[joint].x,
              points[joint].y,
              canvas.width,
              canvas.height,
            );
            if (!started) {
              ctx.moveTo(at.x, at.y);
              started = true;
            } else ctx.lineTo(at.x, at.y);
            ctx.fillStyle = frames[index].index < 0 ? "#8ec8ff" : frames[index].index > 0 ? "#ffb15e" : "#f4f1e4";
            ctx.fillRect(at.x - 2.5, at.y - 2.5, 5, 5);
          });
          ctx.strokeStyle = "#f4f1e8cc";
          ctx.lineWidth = 1.5;
          ctx.stroke();
        }
      }
    }
  }
  ctx.restore();
  return { frames: frames.map((frame) => frame.time) };
}
