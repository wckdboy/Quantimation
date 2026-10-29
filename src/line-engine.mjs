// Quantimation line engine reference (no dependencies). Port target: src/renderer.js.
// Input: polyline points in screen px at 1920x1080. Output: filled outline polygons (SVG path or canvas Path2D).
export function fnv1a(str) {
  let h = 0x811c9dc5;
  for (let i = 0; i < str.length; i++) { h ^= str.charCodeAt(i); h = Math.imul(h, 0x01000193) >>> 0; }
  return h >>> 0;
}
export function rng(seed) { // mulberry32
  let a = seed >>> 0;
  return () => { a = (a + 0x6d2b79f5) >>> 0; let t = a; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
}
function noise1D(seed) { // smooth value noise in [-1,1], lattice cached
  const r = rng(seed), lat = [];
  const v = (i) => { while (lat.length <= i) lat.push(r() * 2 - 1); return lat[i]; };
  return (x) => { x = Math.abs(x); const i = Math.floor(x), f = x - i, u = f * f * (3 - 2 * f); return v(i) * (1 - u) + v(i + 1) * u; };
}
export function resample(pts, step = 3, closed = false) {
  const src = closed ? [...pts, pts[0]] : pts, out = [src[0]];
  let carry = 0;
  for (let i = 1; i < src.length; i++) {
    const [ax, ay] = src[i - 1], [bx, by] = src[i], len = Math.hypot(bx - ax, by - ay);
    let d = step - carry;
    while (d <= len) { const u = d / len; out.push([ax + (bx - ax) * u, ay + (by - ay) * u]); d += step; }
    carry = len - (d - step);
  }
  if (!closed) { const last = src.at(-1), p = out.at(-1); if (Math.hypot(last[0] - p[0], last[1] - p[1]) > 0.5) out.push(last); }
  else if (out.length > 1) out.pop();
  return out;
}
function normals(pts, closed) {
  return pts.map((p, i) => {
    const a = pts[closed ? (i - 1 + pts.length) % pts.length : Math.max(0, i - 1)];
    const b = pts[closed ? (i + 1) % pts.length : Math.min(pts.length - 1, i + 1)];
    const dx = b[0] - a[0], dy = b[1] - a[1], l = Math.hypot(dx, dy) || 1;
    return [-dy / l, dx / l];
  });
}
function arcLengths(pts, closed) {
  const s = [0];
  for (let i = 1; i < pts.length; i++) s.push(s[i - 1] + Math.hypot(pts[i][0] - pts[i - 1][0], pts[i][1] - pts[i - 1][1]));
  const total = s.at(-1) + (closed ? Math.hypot(pts[0][0] - pts.at(-1)[0], pts[0][1] - pts.at(-1)[1]) : 0);
  return { s, total };
}
// corners: original vertices whose turn angle exceeds cornerAngleDeg keep zero wobble within falloff px
function cornerMask(orig, pts, closed, angleDeg = 35, falloff = 6) {
  const corners = [];
  for (let i = 0; i < orig.length; i++) {
    if (!closed && (i === 0 || i === orig.length - 1)) continue;
    const a = orig[(i - 1 + orig.length) % orig.length], b = orig[i], c = orig[(i + 1) % orig.length];
    const v1 = [b[0] - a[0], b[1] - a[1]], v2 = [c[0] - b[0], c[1] - b[1]];
    const ang = Math.abs(Math.atan2(v1[0] * v2[1] - v1[1] * v2[0], v1[0] * v2[0] + v1[1] * v2[1])) * 180 / Math.PI;
    if (ang > angleDeg) corners.push(b);
  }
  return pts.map((p) => { let m = 1; for (const c of corners) { const d = Math.hypot(p[0] - c[0], p[1] - c[1]); if (d < falloff) m = Math.min(m, d / falloff); } return m; });
}
export function wobble(orig, { amp = 0.7, seed = 1, closed = false, octaves = [[90, 0.7], [32, 0.3]], step = 3, cornerAngle = 35, cornerFalloff = 6 } = {}) {
  const pts = resample(orig, step, closed);
  if (!amp) return pts;
  const n = normals(pts, closed), { s } = arcLengths(pts, closed), mask = cornerMask(orig, pts, closed, cornerAngle, cornerFalloff);
  const fields = octaves.map(([wl, w], k) => [noise1D(seed + k * 7919), wl, w]);
  return pts.map((p, i) => {
    let d = 0; for (const [f, wl, w] of fields) d += f(s[i] / wl) * w;
    d *= amp * mask[i];
    return [p[0] + n[i][0] * d, p[1] + n[i][1] * d];
  });
}
const smooth = (x) => { x = Math.max(0, Math.min(1, x)); return x * x * (3 - 2 * x); };
export function taperWidth(u, { startWidth = 0.3, startRamp = 0.18, endRamp = 0.22, endWidth = 0.45 } = {}) {
  if (u < startRamp) return startWidth + (1 - startWidth) * smooth(u / startRamp);
  if (u > 1 - endRamp) return endWidth + (1 - endWidth) * smooth((1 - u) / endRamp);
  return 1;
}
// width: px; taper: null (closed/contour) or {startWidth,endWidth,...}; light: unit vector pointing FROM the light (shadow side gets +mod)
export function strokeOutline(points, { width = 4, closed = false, taper = null, mod = 0, light = [0.7071, 0.7071] } = {}) {
  const n = normals(points, closed), { s, total } = arcLengths(points, closed);
  const w = points.map((p, i) => {
    let k = 1;
    if (taper && !closed) k *= taperWidth(s[i] / total, taper);
    if (mod) { const facing = n[i][0] * light[0] + n[i][1] * light[1]; k *= 1 + mod * facing; }
    return (width * k) / 2;
  });
  const L = points.map((p, i) => [p[0] + n[i][0] * w[i], p[1] + n[i][1] * w[i]]);
  const R = points.map((p, i) => [p[0] - n[i][0] * w[i], p[1] - n[i][1] * w[i]]);
  return closed ? [L, R] : [[...L, ...capArc(points.at(-1), n.at(-1), w.at(-1)), ...R.reverse(), ...capArc(points[0], n[0].map((v) => -v), w[0])]];
}
function capArc(c, nrm, r) { const out = [], a0 = Math.atan2(nrm[1], nrm[0]); for (let k = 1; k < 6; k++) { const a = a0 - (Math.PI * k) / 6; out.push([c[0] + Math.cos(a) * r, c[1] + Math.sin(a) * r]); } return out; }
export const LINE_CLASSES = {
  contour: { px: 4, wobblePx: 0.7, taper: null, weightModulation: 0.15 },
  eye: { px: 3.5, wobblePx: 0.9, taper: null, weightModulation: 0.1 },
  prop: { px: 3.25, wobblePx: 0.6, taper: null, weightModulation: 0.1 },
  mouth: { px: 3, wobblePx: 0.4, taper: [0.5, 0.5], weightModulation: 0 },
  interior: { px: 2.75, wobblePx: 0.6, taper: [0.3, 0.45], weightModulation: 0 },
  detail: { px: 2, wobblePx: 0.5, taper: [0.25, 0.25], weightModulation: 0 },
  bg: { px: 2.5, wobblePx: 0.5, taper: null, weightModulation: 0 },
  bgDetail: { px: 1.5, wobblePx: 0.4, taper: [0.4, 0.4], weightModulation: 0 },
  bgFar: { px: 1, wobblePx: 0, taper: null, weightModulation: 0 },
  fx: { px: 0, wobblePx: 0.8, taper: null, weightModulation: 0 },
  none: { px: 0, wobblePx: 0, taper: null, weightModulation: 0 },
};
export const toPath = (rings) => rings.map((r) => 'M' + r.map((p) => p[0].toFixed(2) + ' ' + p[1].toFixed(2)).join('L') + 'Z').join('');
export function styledStroke(points, cls, { closed = false, seed = 1, light } = {}) {
  const pts = wobble(points, { amp: cls.wobblePx ?? 0, seed, closed });
  return toPath(strokeOutline(pts, { width: cls.px, closed, taper: cls.taper ? { startWidth: cls.taper[0], endWidth: cls.taper[1] } : null, mod: cls.weightModulation || 0, light }));
}
// helpers to build polylines
export function ellipsePts(cx, cy, rx, ry, n = 96, rot = 0) { const c = Math.cos(rot), s = Math.sin(rot); return Array.from({ length: n }, (_, i) => { const a = (i / n) * Math.PI * 2, x = Math.cos(a) * rx, y = Math.sin(a) * ry; return [cx + x * c - y * s, cy + x * s + y * c]; }); }
export function quadPts(p0, p1, p2, n = 24) { return Array.from({ length: n + 1 }, (_, i) => { const t = i / n, a = (1 - t) ** 2, b = 2 * (1 - t) * t, c = t * t; return [a * p0[0] + b * p1[0] + c * p2[0], a * p0[1] + b * p1[1] + c * p2[1]]; }); }
export function cubicPts(p0, p1, p2, p3, n = 32) { return Array.from({ length: n + 1 }, (_, i) => { const t = i / n, a = (1 - t) ** 3, b = 3 * (1 - t) ** 2 * t, c = 3 * (1 - t) * t * t, d = t ** 3; return [a * p0[0] + b * p1[0] + c * p2[0] + d * p3[0], a * p0[1] + b * p1[1] + c * p2[1] + d * p3[1]]; }); }
export function roundRectPts(x, y, w, h, rt, rb, n = 10) {
  const pts = [], arc = (cx, cy, r, a0, a1) => { for (let i = 0; i <= n; i++) { const a = a0 + ((a1 - a0) * i) / n; pts.push([cx + Math.cos(a) * r, cy + Math.sin(a) * r]); } };
  arc(x + w - rt, y + rt, rt, -Math.PI / 2, 0); arc(x + w - rb, y + h - rb, rb, 0, Math.PI / 2); arc(x + rb, y + h - rb, rb, Math.PI / 2, Math.PI); arc(x + rt, y + rt, rt, Math.PI, Math.PI * 1.5);
  return pts;
}
