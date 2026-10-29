// Raster key to ink. Outer contours are 4 px, interior lines 2.75 px, and fills
// stay on the flat palette. Paths are smooth cubics so inbetween_drawings can morph them.

import { smoothClosed } from "../curves.js";
import { MODELS } from "../drawn.js";
import { libraryDrawing } from "../drawings.js";

const INK = "#221D26";
const PAPER = [224, 211, 180];

function hexToRgb(hex) {
  const n = Number.parseInt(String(hex).replace("#", ""), 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}

function nearest(rgb, palette) {
  let best = null;
  let bestD = 42 * 42;
  for (const color of palette) {
    const target = hexToRgb(color);
    const d = (rgb[0] - target[0]) ** 2 + (rgb[1] - target[1]) ** 2 + (rgb[2] - target[2]) ** 2;
    if (d < bestD) {
      bestD = d;
      best = color.toUpperCase();
    }
  }
  return best;
}

function rdp(points, epsilon) {
  if (points.length < 3) return points;
  let worst = 0;
  let index = 0;
  const [ax, ay] = points[0];
  const [bx, by] = points[points.length - 1];
  const dx = bx - ax;
  const dy = by - ay;
  const len = Math.hypot(dx, dy) || 1;
  for (let i = 1; i < points.length - 1; i += 1) {
    const dist = Math.abs(dy * points[i][0] - dx * points[i][1] + bx * ay - by * ax) / len;
    if (dist > worst) {
      worst = dist;
      index = i;
    }
  }
  if (worst <= epsilon) return [points[0], points[points.length - 1]];
  return [...rdp(points.slice(0, index + 1), epsilon).slice(0, -1), ...rdp(points.slice(index), epsilon)];
}

const NBR = [[1, 0], [1, 1], [0, 1], [-1, 1], [-1, 0], [-1, -1], [0, -1], [1, -1]];

function walk(mask, width, height, sx, sy) {
  const points = [[sx, sy]];
  let x = sx;
  let y = sy;
  let prev = 4;
  const limit = Math.min(width * height, 20000);
  for (let step = 0; step < limit; step += 1) {
    let found = false;
    for (let turn = 0; turn < 8; turn += 1) {
      const dir = (prev + 6 + turn) % 8;
      const nx = x + NBR[dir][0];
      const ny = y + NBR[dir][1];
      if (nx < 0 || ny < 0 || nx >= width || ny >= height) continue;
      if (!mask[ny * width + nx]) continue;
      prev = dir;
      x = nx;
      y = ny;
      points.push([x, y]);
      found = true;
      break;
    }
    if (!found) break;
    if (x === sx && y === sy && points.length > 8) break;
  }
  return points;
}

function loopsFor(mask, width, height) {
  const loops = [];
  for (let y = 1; y < height - 1; y += 1) {
    for (let x = 1; x < width - 1; x += 1) {
      const index = y * width + x;
      if (!mask[index] || mask[index - 1]) continue;
      const loop = walk(mask, width, height, x, y);
      if (loop.length > 24) loops.push(loop);
      if (loops.length > 12) return loops;
    }
  }
  return loops;
}

function area(points) {
  let sum = 0;
  for (let i = 0; i < points.length; i += 1) {
    const next = points[(i + 1) % points.length];
    sum += points[i][0] * next[1] - next[0] * points[i][1];
  }
  return Math.abs(sum) / 2;
}

export function traceImageData(data, width, height, { palette }) {
  const buckets = new Map();
  for (let i = 0; i < data.length; i += 4) {
    if (data[i + 3] < 16) continue;
    const rgb = [data[i], data[i + 1], data[i + 2]];
    const paper = (rgb[0] - PAPER[0]) ** 2 + (rgb[1] - PAPER[1]) ** 2 + (rgb[2] - PAPER[2]) ** 2;
    if (paper < 30 * 30 && rgb[0] > 180) continue;
    const color = nearest(rgb, palette);
    if (!color) continue;
    const pixel = i / 4;
    if (!buckets.has(color)) buckets.set(color, []);
    buckets.get(color).push(pixel);
  }
  const shapes = [];
  let index = 0;
  for (const [color, pixels] of buckets) {
    if (pixels.length < 40) continue;
    const mask = new Uint8Array(width * height);
    for (const pixel of pixels) mask[pixel] = 1;
    const found = loopsFor(mask, width, height)
      .map((loop) => rdp(loop.filter((_, n) => n % 3 === 0), 2.2))
      .filter((loop) => loop.length >= 4)
      .sort((a, b) => area(b) - area(a))
      .slice(0, 3);
    found.forEach((loop, order) => {
      const outer = order === 0;
      shapes.push({
        id: `trace${index}`,
        path: smoothClosed(loop),
        fill: outer ? color : "none",
        stroke: INK,
        strokeWidth: outer ? 4 : 2.75,
        line: outer ? "contour" : "interior",
      });
      index += 1;
    });
  }
  return shapes.sort((a, b) => (a.line === "contour" ? -1 : 1) - (b.line === "contour" ? -1 : 1));
}

export function sheetPalette(character) {
  const colors = new Set(["#F4F0E4", "#221D26"]);
  const model = MODELS[character];
  if (model) {
    for (const value of Object.values(model)) {
      if (typeof value === "string" && value.startsWith("#")) colors.add(value.toUpperCase());
      if (Array.isArray(value)) {
        for (const item of value) if (typeof item === "string" && item.startsWith("#")) colors.add(item.toUpperCase());
      }
    }
  }
  for (const view of ["front", "threeQuarter", "profile", "back"]) {
    const sheet = libraryDrawing(character, view, "stand");
    for (const shape of sheet?.shapes || []) {
      if (shape.fill && shape.fill.startsWith("#")) colors.add(shape.fill.toUpperCase());
    }
  }
  return [...colors];
}

export function auditTracedKey(character, drawing) {
  const flags = [];
  const allowed = sheetPalette(character);
  const model = MODELS[character];
  for (const shape of drawing.shapes || []) {
    if (!shape.fill || shape.fill === "none") continue;
    if (!nearest(hexToRgb(shape.fill), allowed)) flags.push(`palette ${shape.id}`);
    if (shape.line === "contour" && shape.strokeWidth && shape.strokeWidth !== 4) flags.push(`weight ${shape.id}`);
    if (shape.line === "interior" && shape.strokeWidth && shape.strokeWidth !== 2.75) flags.push(`weight ${shape.id}`);
  }
  if (!drawing.shapes?.some((shape) => shape.line === "contour")) flags.push("no-contour");
  const foot = Math.max(...(drawing.feet || [[0, 0]]).map((point) => point[1]));
  const crown = drawing.crown ?? 0;
  const chin = drawing.chin ?? crown;
  if (model && chin > crown && foot > chin) {
    const measured = (foot - crown) / (chin - crown);
    if (Math.abs(measured - model.heads) / model.heads > 0.3) flags.push(`heads ${measured.toFixed(2)}`);
  }
  return { ok: flags.length === 0, flags };
}
