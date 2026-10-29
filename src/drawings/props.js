// Prop library. Each prop is constructed in the room: a cylinder or a box
// projected by the same camera as the set, then drawn with a shade side,
// a highlight, an interior line and a cast shadow. A single filled outline
// is a blob and is rejected.

import { smoothClosed, smoothOpen } from "../curves.js";

const INK = "#221D26";
const SHADOW = "#6A6458";

const overrides = new Map();

export const KITCHEN_PROPS = ["kettle", "bowl", "basin", "tap", "toaster", "mug", "mugB", "plates", "plant", "lamp", "jar", "board", "towel"];

function project(cam, x, y, z) {
  const f = cam.focal / Math.max(16, cam.camZ - z);
  return [
    Math.round((cam.vpx + x * f) * 10) / 10,
    Math.round((cam.vpy - (y - cam.eyeY) * f) * 10) / 10,
  ];
}

function tint(hex, amount) {
  const n = Number.parseInt(hex.slice(1), 16);
  const f = (c) => Math.max(0, Math.min(255, Math.round(c + amount)));
  return `#${[f((n >> 16) & 255), f((n >> 8) & 255), f(n & 255)].map((v) => v.toString(16).padStart(2, "0")).join("")}`;
}

function shape(id, pts, fill, line = "prop", open = false) {
  return {
    id,
    type: "path",
    path: open ? smoothOpen(pts) : smoothClosed(pts),
    fill: open ? "none" : fill,
    stroke: INK,
    strokeWidth: 0,
    line: open ? "interior" : line,
    shadow: false,
  };
}

function ellipse(cam, x, y, z, rx, rz, n = 10) {
  const pts = [];
  for (let i = 0; i < n; i += 1) {
    const a = -Math.PI / 2 + (i / n) * Math.PI * 2;
    pts.push(project(cam, x + Math.cos(a) * rx, y, z + Math.sin(a) * rz));
  }
  return pts;
}

function cylinder(cam, id, spec) {
  const { x, y, z, rx, rz, h, fill } = spec;
  const y1 = y + h;
  const body = [
    project(cam, x - rx, y + h * 0.08, z + rz * 0.15),
    project(cam, x - rx * 0.35, y, z + rz),
    project(cam, x + rx * 0.35, y, z + rz * 0.92),
    project(cam, x + rx, y + h * 0.08, z + rz * 0.1),
    project(cam, x + rx * 0.92, y + h * 0.55, z - rz * 0.05),
    project(cam, x + rx * 0.72, y1, z - rz * 0.35),
    project(cam, x, y1 + h * 0.02, z - rz * 0.55),
    project(cam, x - rx * 0.72, y1, z - rz * 0.3),
    project(cam, x - rx * 0.95, y + h * 0.5, z + rz * 0.05),
  ];
  const shade = [
    project(cam, x + rx * 0.08, y + h * 0.05, z + rz * 0.35),
    project(cam, x + rx * 0.55, y, z + rz * 0.7),
    project(cam, x + rx, y + h * 0.12, z + rz * 0.05),
    project(cam, x + rx * 0.88, y + h * 0.62, z - rz * 0.1),
    project(cam, x + rx * 0.45, y1, z - rz * 0.05),
    project(cam, x + rx * 0.12, y + h * 0.7, z + rz * 0.15),
  ];
  const hi = [
    project(cam, x - rx * 0.55, y + h * 0.78, z + rz * 0.25),
    project(cam, x - rx * 0.42, y + h * 0.4, z + rz * 0.45),
  ];
  const rim = [
    project(cam, x - rx * 0.7, y1, z + rz * 0.1),
    project(cam, x, y1, z + rz * 0.45),
    project(cam, x + rx * 0.7, y1, z + rz * 0.05),
  ];
  const shadow = ellipse(cam, x + rx * 0.45, y + 0.6, z + rz * 0.15, rx * 1.15, rz * 0.42, 8);
  return [
    shape(`${id}_shadow`, shadow, SHADOW),
    shape(`${id}_body`, body, fill),
    shape(`${id}_shade`, shade, tint(fill, -42)),
    shape(`${id}_top`, ellipse(cam, x, y1, z, rx * 0.92, rz * 0.72), tint(fill, 28)),
    shape(`${id}_hi`, hi, "none", "interior", true),
    shape(`${id}_line`, rim, "none", "interior", true),
  ];
}

function box(cam, id, spec) {
  const { x0, x1, y0, y1, z0, z1, fill } = spec;
  const p = (x, y, z) => project(cam, x, y, z);
  const front = [p(x0, y1, z1), p(x1, y1, z1), p(x1, y0, z1), p(x0, y0, z1)];
  const top = [p(x0, y1, z0), p(x1, y1, z0), p(x1, y1, z1), p(x0, y1, z1)];
  const side = [p(x1, y1, z0), p(x1, y1, z1), p(x1, y0, z1), p(x1, y0, z0)];
  const shadow = [
    p(x0 + 2, y0 + 0.5, z1 + 1),
    p(x1 + 8, y0 + 0.5, z1 + 1),
    p(x1 + 6, y0 + 0.5, z1 + 7),
    p(x0 + 1, y0 + 0.5, z1 + 6),
  ];
  const hi = [p(x0 + 2, y1 - 1, z0 + 2), p(x1 - 2, y1 - 1, z0 + 2)];
  const seam = [p(x0 + (x1 - x0) * 0.5, y1, z1), p(x0 + (x1 - x0) * 0.5, y0 + 2, z1)];
  return [
    shape(`${id}_shadow`, shadow, SHADOW),
    shape(`${id}_body`, front, fill),
    shape(`${id}_top`, top, tint(fill, 24)),
    shape(`${id}_shade`, side, tint(fill, -38)),
    shape(`${id}_hi`, hi, "none", "interior", true),
    shape(`${id}_line`, seam, "none", "interior", true),
  ];
}

function kettle(cam, x, z, y = 93) {
  const parts = cylinder(cam, "kettle", { x, y, z, rx: 16, rz: 11, h: 28, fill: "#C4553A" });
  const spout = [
    project(cam, x + 12, y + 16, z + 6),
    project(cam, x + 26, y + 20, z + 12),
    project(cam, x + 30, y + 16, z + 14),
    project(cam, x + 16, y + 12, z + 6),
  ];
  const handle = [
    project(cam, x - 12, y + 18, z - 2),
    project(cam, x - 24, y + 22, z - 4),
    project(cam, x - 26, y + 12, z - 2),
    project(cam, x - 12, y + 10, z),
  ];
  parts.push(shape("kettle_spout", spout, "#A84432"));
  parts.push(shape("kettle_handle", handle, "none", "interior", true));
  return parts;
}

function fruit(cam, id, x, y, z, rx, h, fill) {
  return [
    shape(`${id}_body`, [
      project(cam, x - rx, y + h * 0.2, z),
      project(cam, x - rx * 0.2, y, z + rx * 0.7),
      project(cam, x + rx, y + h * 0.15, z),
      project(cam, x + rx * 0.4, y + h, z - rx * 0.2),
      project(cam, x - rx * 0.3, y + h * 0.95, z - rx * 0.15),
    ], fill),
    shape(`${id}_shade`, [
      project(cam, x + rx * 0.1, y + h * 0.2, z),
      project(cam, x + rx, y + h * 0.2, z),
      project(cam, x + rx * 0.35, y + h * 0.85, z),
    ], tint(fill, -36)),
  ];
}

function bowl(cam, x, z, y = 93) {
  const parts = cylinder(cam, "bowl", { x, y, z, rx: 22, rz: 14, h: 12, fill: "#E7D3A1" });
  parts.push(...fruit(cam, "apple", x - 8, y + 10, z + 2, 7, 12, "#C4553A"));
  parts.push(...fruit(cam, "pear", x + 6, y + 10, z - 1, 6, 16, "#6FA06A"));
  parts.push(...fruit(cam, "lemon", x + 1, y + 11, z + 6, 6, 10, "#E2C15A"));
  parts.push(shape("bowl_stems", [
    project(cam, x - 8, y + 22, z + 2),
    project(cam, x - 6, y + 28, z + 1),
    project(cam, x + 6, y + 26, z - 1),
    project(cam, x + 8, y + 32, z - 2),
  ], "none", "interior", true));
  return parts;
}

function tap(cam, x, z, y = 93) {
  const parts = [
    ...box(cam, "basin", { x0: x - 36, x1: x + 28, y0: y - 1, y1: y + 2, z0: z - 10, z1: z + 16, fill: "#D5D8DC" }),
    ...cylinder(cam, "tap", { x, y, z, rx: 4, rz: 3.2, h: 28, fill: "#C5C8CC" }),
  ];
  parts.push(shape("tap_spout", [
    project(cam, x + 2, y + 26, z + 2),
    project(cam, x + 16, y + 28, z + 8),
    project(cam, x + 18, y + 22, z + 10),
    project(cam, x + 4, y + 20, z + 2),
  ], "#B7BCC2"));
  return parts;
}

function toaster(cam, x, z, y = 93) {
  const parts = box(cam, "toaster", { x0: x - 16, x1: x + 16, y0: y, y1: y + 19, z0: z - 8, z1: z + 8, fill: "#D9D4CC" });
  const slot = [
    project(cam, x - 8, y + 18, z + 2),
    project(cam, x + 8, y + 18, z + 2),
  ];
  parts.push(shape("toaster_slot", slot, "none", "interior", true));
  return parts;
}

function mug(cam, id, x, z, fill, y = 93) {
  const parts = cylinder(cam, id, { x, y, z, rx: 7, rz: 5.5, h: 16, fill });
  parts.push(shape(`${id}_handle`, [
    project(cam, x + 6, y + 7, z),
    project(cam, x + 14, y + 11, z + 2),
    project(cam, x + 14, y + 3, z + 2),
    project(cam, x + 6, y + 5, z),
  ], "none", "interior", true));
  return parts;
}

function plates(cam, x, z, y0 = 93) {
  const parts = [];
  [0, 1, 2].forEach((i) => {
    const y = y0 + i * 1.6;
    parts.push(shape(i === 0 ? "plates_body" : `plates_disc${i}`, ellipse(cam, x, y, z, 16 - i, 10 - i * 0.4), i % 2 ? "#E7E2D8" : "#F7F4EE"));
  });
  parts.push(shape("plates_shade", ellipse(cam, x + 4, y0 + 0.4, z, 8, 4, 6), "#D9D3C6"));
  parts.push(shape("plates_hi", [
    project(cam, x - 8, y0 + 3.5, z + 2),
    project(cam, x + 6, y0 + 3.8, z + 1),
  ], "none", "interior", true));
  parts.push(shape("plates_line", [
    project(cam, x - 10, y0 + 1.6, z + 3),
    project(cam, x, y0 + 1.2, z + 6),
    project(cam, x + 10, y0 + 1.6, z + 2),
  ], "none", "interior", true));
  parts.push(shape("plates_shadow", ellipse(cam, x + 6, y0 + 0.3, z + 2, 18, 6, 8), SHADOW));
  return parts;
}

function plant(cam, x, z, y = 93) {
  const parts = cylinder(cam, "plant", { x, y, z, rx: 12, rz: 9, h: 14, fill: "#C46A45" });
  const leaf = (name, dx, dy, dz, fill) => shape(name, [
    project(cam, x + dx, y + 14, z + dz),
    project(cam, x + dx - 4, y + 16 + dy, z + dz + 1),
    project(cam, x + dx + 2, y + 18 + dy, z + dz),
    project(cam, x + dx + 3, y + 15, z + dz),
  ], fill);
  parts.push(leaf("plant_leaf", -2, 7, 1, "#3E7A48"));
  parts.push(leaf("plant_leafB", 3, 8, -1, "#5E8A55"));
  parts.push(shape("plant_vein", [
    project(cam, x - 2, y + 15, z + 1),
    project(cam, x - 4, y + 22, z + 1),
  ], "none", "interior", true));
  return parts;
}

function lamp(cam, x, z) {
  const parts = cylinder(cam, "lamp", { x, y: 118, z, rx: 14, rz: 9, h: 20, fill: "#E7D3A1" });
  parts.push(shape("lamp_cord", [
    project(cam, x, 158, z - 2),
    project(cam, x, 148, z),
    project(cam, x, 138, z),
  ], "none", "interior", true));
  parts.push(shape("lamp_glow", ellipse(cam, x, 116, z, 6, 3.2, 6), "#F6E7A2"));
  return parts;
}

function jar(cam, x, z, y = 93) {
  return cylinder(cam, "jar", { x, y, z, rx: 8, rz: 6, h: 22, fill: "#E6EFEA" });
}

function board(cam, x, z, y = 93) {
  const parts = box(cam, "board", { x0: x - 22, x1: x + 18, y0: y, y1: y + 3, z0: z - 8, z1: z + 8, fill: "#E7D3A8" });
  parts.push(shape("board_knife", [
    project(cam, x - 4, y + 4, z),
    project(cam, x + 16, y + 7, z + 2),
    project(cam, x + 18, y + 5, z + 3),
    project(cam, x - 2, y + 2.5, z + 1),
  ], "#D5D8DC"));
  parts.push(shape("board_handle", [
    project(cam, x - 12, y + 3, z - 1),
    project(cam, x - 4, y + 4.5, z),
    project(cam, x - 3, y + 2, z + 1),
    project(cam, x - 11, y + 1, z),
  ], "#7A5233"));
  return parts;
}

function towel(cam, x, z, y = 92) {
  const p = (dx, dy) => project(cam, x + dx, y + dy, z);
  return [
    shape("towel_shadow", [
      p(2, -1), p(16, -1), p(14, -4), p(1, -3),
    ], SHADOW),
    shape("towel_body", [
      p(0, 0), p(14, 1), p(16, -18), p(10, -28), p(2, -26), p(-2, -8),
    ], "#C9D7C2"),
    shape("towel_shade", [
      p(8, -2), p(15, -4), p(12, -22), p(6, -16),
    ], "#A8B9A4"),
    shape("towel_hi", [p(2, -6), p(6, -16)], "none", "interior", true),
    shape("towel_line", [p(4, -2), p(6, -20), p(9, -24)], "none", "interior", true),
  ];
}

const BUILDERS = {
  kettle: (cam, at) => kettle(cam, at.x, at.z, at.y),
  bowl: (cam, at) => bowl(cam, at.x, at.z, at.y),
  tap: (cam, at) => tap(cam, at.x, at.z, at.y),
  toaster: (cam, at) => toaster(cam, at.x, at.z, at.y),
  mug: (cam, at) => mug(cam, "mug", at.x, at.z, at.fill || "#EDE3CC", at.y),
  mugB: (cam, at) => mug(cam, "mugB", at.x, at.z, at.fill || "#C4553A", at.y),
  plates: (cam, at) => plates(cam, at.x, at.z, at.y),
  plant: (cam, at) => plant(cam, at.x, at.z, at.y),
  lamp: (cam, at) => lamp(cam, at.x, at.z),
  jar: (cam, at) => jar(cam, at.x, at.z, at.y),
  board: (cam, at) => board(cam, at.x, at.z, at.y),
  towel: (cam, at) => towel(cam, at.x, at.z, at.y),
};

export function placeProp(cam, id, at) {
  const over = overrides.get(id);
  if (over?.shapes && !over.construction) return over.shapes;
  const build = BUILDERS[id];
  if (!build) throw new Error(`Unknown prop ${id}.`);
  return build(cam, over?.construction ? { ...at, ...over.construction } : at);
}

export function kitchenProps(cam) {
  return [
    ...placeProp(cam, "plant", { x: -232, z: 26 }),
    ...placeProp(cam, "tap", { x: -172, z: 20 }),
    ...placeProp(cam, "board", { x: -118, z: 24 }),
    ...placeProp(cam, "kettle", { x: -68, z: 30 }),
    ...placeProp(cam, "bowl", { x: -22, z: 28 }),
    ...placeProp(cam, "mugB", { x: -90, z: 52, y: 75, fill: "#E7D3A1" }),
    ...placeProp(cam, "toaster", { x: 152, z: 26 }),
    ...placeProp(cam, "mug", { x: 178, z: 34 }),
    ...placeProp(cam, "jar", { x: 198, z: 20 }),
    ...placeProp(cam, "plates", { x: -150, z: 54, y: 75 }),
    ...placeProp(cam, "towel", { x: -190, z: 60, y: 74 }),
    ...placeProp(cam, "lamp", { x: 78, z: 34 }),
  ];
}

export function garageProps(cam) {
  const y = 88;
  const z = 66;
  return [
    ...placeProp(cam, "toaster", { x: -200, z, y }),
    ...placeProp(cam, "mug", { x: -145, z, y }),
    ...placeProp(cam, "jar", { x: -95, z, y }),
    ...placeProp(cam, "board", { x: -40, z, y }),
    ...placeProp(cam, "towel", { x: -15, z: 68, y }),
  ];
}

export function marketProps(cam) {
  return [
    ...placeProp(cam, "bowl", { x: -170, z: 70, y: 108 }),
    ...placeProp(cam, "plates", { x: -60, z: 90, y: 108 }),
    ...placeProp(cam, "jar", { x: 40, z: 110, y: 108 }),
    ...placeProp(cam, "mug", { x: 140, z: 130, y: 108, fill: "#7FE6E0" }),
  ];
}

export function propParts(shapes, id) {
  return shapes.filter((part) => part.id === id || part.id?.startsWith(`${id}_`));
}

export function blobFlags(shapes, { required = KITCHEN_PROPS } = {}) {
  const flags = [];
  for (const id of required) {
    const parts = propParts(shapes, id);
    if (!parts.length) {
      flags.push(`missing-prop ${id}`);
      continue;
    }
    const body = parts.find((part) => part.id === `${id}_body`) || parts[0];
    const cubics = (String(body.path).match(/[Cc]/g) || []).length;
    const interior = parts.some((part) => part.line === "interior" || part.id.endsWith("_line") || part.id.endsWith("_hi") || part.id.endsWith("_handle"));
    const shade = parts.some((part) => part.id.endsWith("_shade"));
    const hi = parts.some((part) => part.id.endsWith("_hi") || part.id.endsWith("_glow"));
    const shadow = parts.some((part) => part.id.endsWith("_shadow"));
    if (cubics < 4 || !interior || !shade || !hi || !shadow) flags.push(`blob-prop ${id} c${cubics}`);
  }
  return flags;
}

export function resetProps() {
  overrides.clear();
}

export function authorProp({ id, construction, shapes }) {
  if (!BUILDERS[id] && !shapes) throw new Error(`Unknown prop ${id}.`);
  let drawing = shapes;
  if (construction) {
    const build = BUILDERS[id];
    if (!build) throw new Error(`No construction for ${id}.`);
    drawing = build(
      { vpx: 640, vpy: 390, eyeY: 150, camZ: 340, focal: 420 },
      { x: construction.x ?? 0, z: construction.z ?? 20, y: construction.y, fill: construction.fill },
    );
  }
  if (!Array.isArray(drawing) || drawing.length < 4) throw new Error("A prop needs a body, shade, highlight and shadow.");
  const flags = blobFlags(drawing, { required: [id] });
  if (flags.length) throw new Error(`Blob prop rejected: ${flags.join(", ")}`);
  overrides.set(id, shapes && !construction ? { shapes } : { construction, shapes: drawing });
  return { id, contours: drawing.length, parts: drawing.map((part) => part.id) };
}
