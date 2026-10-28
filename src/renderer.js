import { interpolate, locate, activeShot } from "./model.js";
import { poseAt, motionOffset, speechMouth } from "./pose.js";
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
export function drawShape(
  ctx,
  s,
  t = 0,
  motion = "still",
  talk = 0,
  acting = {},
) {
  if (
    acting.view === "back" &&
    ["eye", "pupil", "mouth", "leftBrow", "rightBrow"].includes(s.role)
  )
    return;
  if (
    acting.view === "profile" &&
    s.role === "eye" &&
    (s.pivotX || s.x || 0) < acting.assetWidth / 2
  )
    return;
  ctx.save();
  ctx.globalAlpha *= s.opacity ?? 1;
  const px = s.pivotX ?? s.x ?? 0,
    py = s.pivotY ?? s.y ?? 0;
  const track = acting.tracks?.get(s.id);
  const pose = poseAt(track, t);
  if (track) {
    ctx.globalAlpha *= pose.opacity;
    ctx.translate(pose.x + px, pose.y + py);
    ctx.rotate(rad(pose.rotation));
    ctx.scale(pose.scaleX, pose.scaleY);
    ctx.translate(-px, -py);
  }
  let angle = s.rotation || 0;
  if (s.role?.endsWith("Leg") && motion === "walk")
    angle += Math.sin(t * 7) * (s.role === "leftLeg" ? 18 : -18);
  if (s.role?.endsWith("Arm") && motion !== "still" && !track)
    angle +=
      motion === "wave" && s.role === "rightArm"
        ? -95 + Math.sin(t * 8) * 20
        : motion === "walk"
          ? Math.sin(t * 7) * (s.role === "leftArm" ? -16 : 16)
          : Math.sin(t * 2) * 3;
  if (s.role === "head" && motion !== "still" && !track)
    angle += Math.sin(t * 2) * 1.8;
  const beat = acting.action,
    weight = acting.weight || 0;
  if (s.role === "head") {
    angle += talk * Math.sin(t * 9) * 3.5;
    if (beat === "nod" || beat === "laugh")
      angle += Math.sin(t * 9) * 11 * weight;
    if (beat === "smug") angle -= 8 * weight;
    if (beat === "recoil") angle -= 18 * weight;
  }
  if (s.role === "leftArm" || s.role === "rightArm") {
    const sign = s.role === "leftArm" ? 1 : -1;
    if (beat === "shrug") angle += sign * 45 * weight;
    if (beat === "point" && sign === -1) angle -= 70 * weight;
    if (beat === "laugh") angle += sign * Math.sin(t * 10) * 14 * weight;
    angle += talk * sign * Math.sin(t * 5) * 9;
  }
  if (s.role === "leftBrow" || s.role === "rightBrow") {
    const sign = s.role === "leftBrow" ? 1 : -1;
    if (beat === "angry") angle += sign * 22 * weight;
    if (beat === "smug") angle += sign * 10 * weight;
    if (beat === "surprised") {
      ctx.translate(0, -8 * weight);
    }
  }
  if (angle) {
    ctx.translate(px, py);
    ctx.rotate(rad(angle));
    ctx.translate(-px, -py);
  }
  if (s.role === "eye" && Math.sin(t * 1.7 + 0.3) > 0.995) {
    ctx.translate(px, py);
    ctx.scale(1, 0.12);
    ctx.translate(-px, -py);
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
  if (s.role === "mouth" && !s.variants && ["path", "group"].includes(s.type)) {
    ctx.translate(px, py);
    ctx.scale(1, 1 + talk * 1.1);
    ctx.translate(-px, -py);
  }
  ctx.fillStyle = s.fill && s.fill !== "none" ? s.fill : "transparent";
  ctx.strokeStyle = s.stroke && s.stroke !== "none" ? s.stroke : "transparent";
  ctx.lineWidth = s.strokeWidth ?? 0;
  ctx.lineJoin = "round";
  ctx.lineCap = "round";
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
      drawShape(ctx, child, t, motion, talk, acting);
  } else if (s.type === "text") {
    ctx.font = `600 ${s.fontSize || 20}px Arial, sans-serif`;
    ctx.fillText(s.text || "", s.x || 0, s.y || 0);
  } else {
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
      let path = pathCache.get(s.path);
      if (!path) {
        path = new Path2D(s.path);
        if (pathCache.size > 2000) pathCache.clear();
        pathCache.set(s.path, path);
      }
      ctx.fill(path);
      if (ctx.lineWidth) ctx.stroke(path);
      ctx.restore();
      return;
    }
    ctx.fill();
    if (ctx.lineWidth) ctx.stroke();
  }
  ctx.restore();
}
export function renderAsset(canvas, asset) {
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
    drawShape(ctx, s, 0, "still", 0, { rough: true });
  ctx.restore();
}
export function renderFrame(canvas, episode, time, options = {}) {
  const ctx = canvas.getContext("2d");
  const hit = locate(episode, time);
  if (!hit) return;
  const { scene: s, time: t } = hit;
  ctx.save();
  ctx.setTransform(canvas.width / 1280, 0, 0, canvas.height / 720, 0, 0);
  ctx.fillStyle = s.background;
  ctx.fillRect(0, 0, 1280, 720);
  const shot = activeShot(s, t),
    c = shot.camera,
    ratio = shot.progress,
    zoom =
      c.zoom +
      ((c.zoomEnd ?? c.zoom) - c.zoom) * (ratio * ratio * (3 - 2 * ratio));
  const rough = /squiggly|hand.drawn|wicked/i.test(episode.style);
  ctx.save();
  ctx.translate(640, 360);
  ctx.rotate(rad(c.rotation || 0));
  ctx.scale(zoom, zoom);
  if (c.perspective === "low") ctx.transform(1, 0, -0.075, 1.08, 0, -15);
  if (c.perspective === "high") ctx.transform(1, 0, 0.04, 0.82, 0, 35);
  ctx.translate(-(c.x + (c.panX || 0) * ratio), -(c.y + (c.panY || 0) * ratio));
  const env = episode.assets.find((a) => a.id === s.environment);
  if (env) {
    ctx.save();
    ctx.scale(1280 / env.width, 720 / env.height);
    for (const n of env.shapes) drawShape(ctx, n, t, "still", 0, { rough });
    ctx.restore();
  }
  const lines = s.dialogue.filter((d) => t >= d.at && t < d.at + d.duration);
  for (const p of s.instances) {
    const asset = episode.assets.find((a) => a.id === p.assetId);
    if (!asset) continue;
    const state = interpolate(p, t);
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
      motionOffset(p.motion, t) +
      (beat?.action === "laugh"
        ? -Math.abs(Math.sin(t * 10)) * 9 * weight
        : beat?.action === "recoil"
          ? -20 * weight
          : 0);
    ctx.translate(state.x, state.y + bob);
    ctx.rotate(rad(state.rotation + (p.motion === "spin" ? t * 50 : 0)));
    ctx.scale(state.scale * (p.flip ? -1 : 1), state.scale);
    if (asset.kind === "character" || asset.kind === "creature") {
      ctx.save();
      ctx.scale(1, 1 / state.scale);
      ctx.fillStyle = "#18233130";
      ctx.beginPath();
      ctx.ellipse(0, 2, asset.width * 0.4, 10, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }
    ctx.translate(-asset.width / 2, -asset.height);
    if (p.view === "threeQuarter") {
      ctx.translate(asset.width * 0.08, 0);
      ctx.transform(0.86, 0, -0.06, 1, 0, 0);
    } else if (p.view === "profile") {
      ctx.translate(asset.width * 0.16, 0);
      ctx.scale(0.7, 1);
    }
    if (p.motion === "bounce") {
      const squash = 1 + Math.sin(t * 6) * 0.025;
      ctx.translate(asset.width / 2, asset.height);
      ctx.scale(1 / squash, squash);
      ctx.translate(-asset.width / 2, -asset.height);
    }
    const speechLine = lines.find((d) => d.speaker === asset.id);
    const speaking = !!speechLine;
    const talk = speaking
      ? (options.amplitude?.(
          lines.find((d) => d.speaker === asset.id)?.id,
          t,
        ) ?? 0.2 + 0.8 * Math.abs(Math.sin(t * 17)))
      : 0;
    const acting = {
      rough,
      view: p.view,
      assetWidth: asset.width,
      action: beat?.action,
      weight,
      mouth: speechMouth(
        speechLine?.text,
        speechLine ? (t - speechLine.at) / speechLine.duration : 0,
        talk,
      ),
      tracks: new Map((p.tracks || []).map((track) => [track.target, track])),
    };
    for (const node of asset.shapes)
      drawShape(ctx, node, t, p.motion, talk, acting);
    if (options.selected === p.id) {
      ctx.strokeStyle = "#e7efb0";
      ctx.lineWidth = 2 / state.scale;
      ctx.setLineDash([7, 5]);
      ctx.strokeRect(-8, -8, asset.width + 16, asset.height + 16);
      ctx.setLineDash([]);
    }
    ctx.restore();
  }
  ctx.restore();
  if (options.captions !== false && lines.length) {
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
