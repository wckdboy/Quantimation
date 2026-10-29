// Smooth closed and open contours. Keys are cubic Béziers. Inbetweens resample
// those curves by arc length, match the phase, and refit a cubic through the blend.

import { sampleSvgPath } from "./ink.js";

function fmt(n) {
  return (Math.round(n * 10) / 10).toFixed(1);
}

export function smoothClosed(points) {
  const p = dedupe(points);
  const n = p.length;
  if (n < 3) throw new Error("A closed drawing needs at least three points.");
  let d = `M${fmt(p[0][0])} ${fmt(p[0][1])}`;
  for (let i = 0; i < n; i++) {
    const p0 = p[(i - 1 + n) % n];
    const p1 = p[i];
    const p2 = p[(i + 1) % n];
    const p3 = p[(i + 2) % n];
    const c1x = p1[0] + (p2[0] - p0[0]) / 6;
    const c1y = p1[1] + (p2[1] - p0[1]) / 6;
    const c2x = p2[0] - (p3[0] - p1[0]) / 6;
    const c2y = p2[1] - (p3[1] - p1[1]) / 6;
    d += `C${fmt(c1x)} ${fmt(c1y)} ${fmt(c2x)} ${fmt(c2y)} ${fmt(p2[0])} ${fmt(p2[1])}`;
  }
  return `${d}Z`;
}

export function smoothOpen(points) {
  const p = dedupe(points);
  if (p.length < 2) throw new Error("An open drawing needs two points.");
  let d = `M${fmt(p[0][0])} ${fmt(p[0][1])}`;
  if (p.length === 2) {
    const c1x = p[0][0] + (p[1][0] - p[0][0]) / 3;
    const c1y = p[0][1] + (p[1][1] - p[0][1]) / 3;
    const c2x = p[0][0] + (2 * (p[1][0] - p[0][0])) / 3;
    const c2y = p[0][1] + (2 * (p[1][1] - p[0][1])) / 3;
    return `${d}C${fmt(c1x)} ${fmt(c1y)} ${fmt(c2x)} ${fmt(c2y)} ${fmt(p[1][0])} ${fmt(p[1][1])}`;
  }
  for (let i = 0; i < p.length - 1; i++) {
    const p0 = p[Math.max(0, i - 1)];
    const p1 = p[i];
    const p2 = p[i + 1];
    const p3 = p[Math.min(p.length - 1, i + 2)];
    const c1x = p1[0] + (p2[0] - p0[0]) / 6;
    const c1y = p1[1] + (p2[1] - p0[1]) / 6;
    const c2x = p2[0] - (p3[0] - p1[0]) / 6;
    const c2y = p2[1] - (p3[1] - p1[1]) / 6;
    d += `C${fmt(c1x)} ${fmt(c1y)} ${fmt(c2x)} ${fmt(c2y)} ${fmt(p2[0])} ${fmt(p2[1])}`;
  }
  return d;
}

function dedupe(points) {
  const out = [];
  for (const point of points) {
    const prev = out[out.length - 1];
    if (prev && Math.hypot(prev[0] - point[0], prev[1] - point[1]) < 0.4) continue;
    out.push(point);
  }
  if (out.length > 2 && Math.hypot(out[0][0] - out.at(-1)[0], out[0][1] - out.at(-1)[1]) < 0.4) out.pop();
  return out;
}

function arcSample(points, count, closed) {
  const n = points.length;
  const lengths = [];
  let total = 0;
  const last = closed ? n : n - 1;
  for (let i = 0; i < last; i++) {
    const a = points[i];
    const b = points[(i + 1) % n];
    const len = Math.hypot(b[0] - a[0], b[1] - a[1]);
    lengths.push(len);
    total += len;
  }
  if (total < 1) return points.slice(0, count);
  const out = [];
  const steps = closed ? count : Math.max(2, count);
  for (let k = 0; k < steps; k++) {
    let dist = closed ? (k / steps) * total : (k / (steps - 1)) * total;
    let i = 0;
    while (i < lengths.length - 1 && dist > lengths[i]) {
      dist -= lengths[i];
      i += 1;
    }
    const a = points[i];
    const b = points[(i + 1) % n];
    const t = lengths[i] ? dist / lengths[i] : 0;
    out.push([a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t]);
  }
  return out;
}

function pathPoints(d, closed) {
  const subs = sampleSvgPath(d, 1.5);
  const sub = subs.find((item) => item.points.length > 2) || subs[0];
  if (!sub) return [];
  const pts = sub.points.map((p) => [p.x, p.y]);
  if (pts.length > 2 && Math.hypot(pts[0][0] - pts.at(-1)[0], pts[0][1] - pts.at(-1)[1]) < 0.6) pts.pop();
  return arcSample(pts, closed ? 36 : Math.max(8, Math.round(pts.length / 2)), closed);
}

function alignClosed(src, dst) {
  const forward = bestShift(src, dst);
  const reversed = bestShift(src, [...dst].reverse());
  return forward.cost <= reversed.cost ? forward.points : reversed.points;
}

function bestShift(src, dst) {
  let best = Infinity;
  let pick = dst;
  for (let shift = 0; shift < dst.length; shift++) {
    let cost = 0;
    for (let i = 0; i < src.length; i++) {
      const p = dst[(i + shift) % dst.length];
      const dx = src[i][0] - p[0];
      const dy = src[i][1] - p[1];
      cost += dx * dx + dy * dy;
    }
    if (cost < best) {
      best = cost;
      pick = dst.map((_, i) => dst[(i + shift) % dst.length]);
    }
  }
  return { cost: best, points: pick };
}

function lerp(a, b, u) {
  return a.map((p, i) => [p[0] + (b[i][0] - p[0]) * u, p[1] + (b[i][1] - p[1]) * u]);
}

export function morphShape(from, to, u) {
  const closed = /z\s*$/i.test(from.path || "");
  const a = pathPoints(from.path, closed);
  const b = pathPoints(to.path, closed);
  if (a.length < 2 || b.length < 2) return { ...from };
  const count = closed ? 36 : Math.min(a.length, b.length);
  const aa = closed ? a : arcSample(a, count, false);
  const bb = closed ? alignClosed(aa, b.length === aa.length ? b : arcSample(b, aa.length, true)) : arcSample(b, count, false);
  const mixed = lerp(aa, bb, u);
  return {
    ...from,
    path: closed ? smoothClosed(mixed) : smoothOpen(mixed),
  };
}

function opaque(drawing) {
  return {
    ...drawing,
    shapes: (drawing.shapes || []).map((shape) => ({ ...shape, opacity: 1 })),
  };
}

export function morphDrawings(from, to, u) {
  const byId = new Map(to.shapes.map((shape) => [shape.id, shape]));
  const same = from.shapes.length === to.shapes.length && from.shapes.every((shape) => byId.has(shape.id));
  if (!same) return opaque(u >= 0.999 ? to : from);
  if (u <= 0.001) return opaque(from);
  if (u >= 0.999) return opaque(to);
  const shapes = [];
  for (const shape of from.shapes) {
    shapes.push({ ...morphShape(shape, byId.get(shape.id), u), opacity: 1 });
  }
  const feet = (from.feet || []).map((foot, i) => {
    const next = (to.feet || [])[i] || foot;
    return [foot[0] + (next[0] - foot[0]) * u, foot[1] + (next[1] - foot[1]) * u];
  });
  return {
    ...from,
    feet,
    shapes,
  };
}
