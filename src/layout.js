// One camera for the room and the actors. Verticals converge when the lens
// tilts. Sets are boxes, insets and hardware on that same grid — no oval props.

export const CHAIR = { x: 232, z: 188, seat: 46, w: 48, d: 44 };

function sub(a, b) {
  return [a[0] - b[0], a[1] - b[1], a[2] - b[2]];
}
function dot(a, b) {
  return a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
}
function cross(a, b) {
  return [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]];
}
function norm(v) {
  const l = Math.hypot(v[0], v[1], v[2]) || 1;
  return [v[0] / l, v[1] / l, v[2] / l];
}
function add(a, b) {
  return [a[0] + b[0], a[1] + b[1], a[2] + b[2]];
}
function mul(v, s) {
  return [v[0] * s, v[1] * s, v[2] * s];
}
function shade(hex, amt) {
  const n = Number.parseInt(hex.slice(1), 16);
  const f = (c) => Math.max(0, Math.min(255, c + amt));
  const r = f((n >> 16) & 255);
  const g = f((n >> 8) & 255);
  const b = f(n & 255);
  return `#${[r, g, b].map((v) => v.toString(16).padStart(2, "0")).join("")}`;
}

export function lookAt(eye, target, fov) {
  const f = norm(sub(target, eye));
  const right = norm(cross([0, 1, 0], f));
  const u = norm(cross(f, right));
  const focal = 360 / Math.tan((fov * Math.PI) / 360);
  const pitch = (Math.asin(Math.max(-1, Math.min(1, f[1]))) * 180) / Math.PI;
  return { eye, target, f, r: right, u, focal, fov, pitch };
}

export function eyeCamera(setId = "kitchen") {
  if (setId === "garage") return lookAt([250, 152, -70], [240, 100, 230], 44);
  if (setId === "market") return lookAt([240, 158, -30], [250, 112, 260], 48);
  return lookAt([236, 150, -78], [250, 102, 210], 42);
}

export function cameraRig(label = "", perspective = "eye", setId = "kitchen") {
  const name = `${label} ${perspective}`.toLowerCase();
  if (name.includes("over") || name.includes("shoulder")) {
    return lookAt([78, 142, 48], [280, 118, 230], 36);
  }
  if (perspective === "low" || name.includes("low")) {
    return lookAt([150, 58, -24], [236, 118, 210], 46);
  }
  if (perspective === "high" || name.includes("high")) {
    return lookAt([250, 240, -20], [240, 70, 220], 42);
  }
  return eyeCamera(setId);
}

export function project(cam, p) {
  const d = sub(p, cam.eye);
  const x = dot(d, cam.r);
  const y = dot(d, cam.u);
  const z = dot(d, cam.f);
  if (z < 8) return null;
  return {
    x: 640 + (x / z) * cam.focal,
    y: 360 - (y / z) * cam.focal,
    z,
    scale: cam.focal / z,
  };
}

function shapeFrom(proj, fill, stroke, line, layer, seed, open = false, depth = 0) {
  if (!proj || proj.some((p) => !p || !Number.isFinite(p.x) || !Number.isFinite(p.y))) return null;
  const path = proj
    .map((p, i) => `${i ? "L" : "M"}${p.x.toFixed(1)} ${p.y.toFixed(1)}`)
    .join("");
  const z = depth;
  return {
    type: "path",
    path: open ? path : `${path}Z`,
    fill: fill || "none",
    stroke: stroke || "none",
    strokeWidth: 0,
    line,
    layer,
    z,
    seed,
    shadow: false,
  };
}

function pushPoly(out, cam, pts, fill, stroke, line, layer, seed, open = false) {
  const depth = pts.reduce((sum, p) => sum + p[2], 0) / pts.length;
  const drawn = shapeFrom(pts.map((p) => project(cam, p)), fill, stroke, line, layer, seed, open, depth);
  if (drawn) out.push(drawn);
}

function pushBox(out, cam, origin, size, hex, layer, seed) {
  const [x, y, z] = origin;
  const [w, h, d] = size;
  const c = [x + w / 2, y + h / 2, z + d / 2];
  const faces = [
    { n: [0, 0, -1], pts: [[x, y, z], [x + w, y, z], [x + w, y + h, z], [x, y + h, z]], fill: hex, line: "bg" },
    { n: [0, 0, 1], pts: [[x + w, y, z + d], [x, y, z + d], [x, y + h, z + d], [x + w, y + h, z + d]], fill: shade(hex, -18), line: "bg" },
    { n: [-1, 0, 0], pts: [[x, y, z + d], [x, y, z], [x, y + h, z], [x, y + h, z + d]], fill: shade(hex, -28), line: "bg" },
    { n: [1, 0, 0], pts: [[x + w, y, z], [x + w, y, z + d], [x + w, y + h, z + d], [x + w, y + h, z]], fill: shade(hex, -28), line: "bg" },
    { n: [0, 1, 0], pts: [[x, y + h, z], [x + w, y + h, z], [x + w, y + h, z + d], [x, y + h, z + d]], fill: shade(hex, 14), line: "bg" },
    { n: [0, -1, 0], pts: [[x, y, z + d], [x + w, y, z + d], [x + w, y, z], [x, y, z]], fill: shade(hex, -36), line: "bg" },
  ];
  faces.forEach((face, index) => {
    const center = face.pts.reduce((s, p) => add(s, p), [0, 0, 0]).map((v) => v / 4);
    if (dot(face.n, sub(cam.eye, center)) <= 0.02) return;
    pushPoly(out, cam, face.pts, face.fill, shade(hex, -70), face.line, layer, seed + index);
  });
  void c;
}

function door(out, cam, x, y, z, w, h, faceZ, hex, seed) {
  const inset = 3;
  pushPoly(
    out,
    cam,
    [
      [x + inset, y + inset, faceZ],
      [x + w - inset, y + inset, faceZ],
      [x + w - inset, y + h - inset, faceZ],
      [x + inset, y + h - inset, faceZ],
    ],
    shade(hex, -12),
    shade(hex, -78),
    "bgDetail",
    "mid",
    seed,
  );
  const hx = x + w * 0.78;
  const hy = y + h * 0.5;
  pushPoly(
    out,
    cam,
    [
      [hx, hy - 7, faceZ - 1],
      [hx + 3.5, hy - 7, faceZ - 1],
      [hx + 3.5, hy + 7, faceZ - 1],
      [hx, hy + 7, faceZ - 1],
    ],
    "#E6D7A4",
    "#6A5A34",
    "bgDetail",
    "mid",
    seed + 1,
  );
}

function chair(out, cam) {
  const { x, z, seat, w, d } = CHAIR;
  const wood = "#8B5A34";
  const leg = 3.2;
  for (const [dx, dz] of [[2, 2], [w - 5, 2], [2, d - 5], [w - 5, d - 5]]) {
    pushBox(out, cam, [x + dx, 0, z + dz], [leg, seat - 1, leg], shade(wood, -10), "mid", 80 + dx);
  }
  pushBox(out, cam, [x, seat, z], [w, 4, d], wood, "mid", 90);
  pushBox(out, cam, [x + 3, seat + 4, z + d - 4], [3, 42, 3], wood, "mid", 91);
  pushBox(out, cam, [x + w - 6, seat + 4, z + d - 4], [3, 42, 3], wood, "mid", 92);
  pushBox(out, cam, [x + 3, seat + 28, z + d - 4], [w - 6, 3.5, 2.5], wood, "mid", 93);
  pushBox(out, cam, [x + 3, seat + 40, z + d - 4], [w - 6, 3.5, 2.5], wood, "mid", 94);
}

function kitchen(out, cam) {
  const wall = "#E4D5B8";
  const cab = "#7E9472";
  const counter = "#E7D3B0";
  const floorA = "#D2B48C";
  const floorB = "#C4A67C";
  const RW = 500;
  const RD = 360;
  const RH = 255;
  const winX = 168;
  const winY = 128;
  const winW = 150;
  const winH = 78;
  const wz = RD - 6;
  pushPoly(out, cam, [[winX, winY, wz], [winX + winW, winY, wz], [winX + winW, winY + winH, wz], [winX, winY + winH, wz]], "#C5D4C2", "none", "none", "far", 1);
  pushPoly(out, cam, [[winX + 8, winY + 4, wz - 0.2], [winX + 70, winY + 2, wz - 0.2], [winX + 78, winY + 36, wz - 0.2], [winX + 6, winY + 40, wz - 0.2]], "#8EA278", shade("#8EA278", -40), "bgFar", "far", 2);
  pushPoly(
    out,
    cam,
    [
      [winX + 36, winY + 28, wz - 0.4],
      [winX + 42, winY + 4, wz - 0.4],
      [winX + 52, winY + 30, wz - 0.4],
      [winX + 64, winY + 8, wz - 0.4],
      [winX + 70, winY + 34, wz - 0.4],
      [winX + 48, winY + 46, wz - 0.4],
    ],
    "#3E5340",
    shade("#3E5340", -30),
    "bgFar",
    "far",
    3,
  );
  pushPoly(out, cam, [[winX + 90, winY + 48, wz - 0.2], [winX + 130, winY + 54, wz - 0.2], [winX + 122, winY + 36, wz - 0.2], [winX + 96, winY + 32, wz - 0.2]], "#F4F7F2", "none", "none", "far", 4);
  pushBox(out, cam, [0, 0, RD - 8], [winX, RH, 8], wall, "far", 10);
  pushBox(out, cam, [winX + winW, 0, RD - 8], [RW - winX - winW, RH, 8], wall, "far", 15);
  pushBox(out, cam, [winX, winY + winH, RD - 8], [winW, RH - winY - winH, 8], wall, "far", 16);
  pushBox(out, cam, [winX, 0, RD - 8], [winW, winY, 8], wall, "far", 17);
  pushBox(out, cam, [0, 0, 40], [8, RH, RD], shade(wall, -8), "far", 11);
  pushPoly(
    out,
    cam,
    [
      [winX, winY, RD - 10],
      [winX + winW, winY, RD - 10],
      [winX + winW, winY + winH, RD - 10],
      [winX, winY + winH, RD - 10],
    ],
    "#D5E2D4",
    "#5C6A58",
    "bg",
    "mid",
    12,
  );
  pushPoly(out, cam, [[winX + winW / 2 - 2, winY, RD - 12], [winX + winW / 2 + 2, winY, RD - 12], [winX + winW / 2 + 2, winY + winH, RD - 12], [winX + winW / 2 - 2, winY + winH, RD - 12]], "#E7D7B4", "#5C6A58", "bgDetail", "mid", 13);
  pushPoly(out, cam, [[winX, winY + winH / 2 - 2, RD - 12], [winX + winW, winY + winH / 2 - 2, RD - 12], [winX + winW, winY + winH / 2 + 2, RD - 12], [winX, winY + winH / 2 + 2, RD - 12]], "#E7D7B4", "#5C6A58", "bgDetail", "mid", 14);
  for (let i = 0; i < 4; i++) {
    const x = 16 + i * 42;
    pushBox(out, cam, [x, 96, RD - 46], [38, 62, 34], cab, "mid", 20 + i);
    door(out, cam, x, 100, RD - 46, 38, 54, RD - 47, cab, 40 + i);
  }
  pushBox(out, cam, [330, 96, RD - 46], [150, 62, 34], cab, "mid", 24);
  door(out, cam, 336, 100, RD - 46, 64, 54, RD - 47, cab, 48);
  door(out, cam, 406, 100, RD - 46, 64, 54, RD - 47, cab, 49);
  pushBox(out, cam, [8, 86, RD - 52], [RW - 70, 6, 56], counter, "mid", 50);
  pushBox(out, cam, [18, 4, RD - 48], [RW - 90, 82, 40], shade(cab, -6), "mid", 51);
  for (let i = 0; i < 4; i++) {
    const x = 24 + i * 78;
    door(out, cam, x, 10, RD - 48, 70, 70, RD - 49, cab, 60 + i);
  }
  pushBox(out, cam, [210, 78, RD - 70], [78, 8, 36], "#C5C8C2", "mid", 70);
  pushBox(out, cam, [222, 70, RD - 66], [54, 8, 28], shade("#C5C8C2", -16), "mid", 71);
  pushBox(out, cam, [246, 86, RD - 78], [4, 28, 4], "#B7B9B4", "mid", 72);
  pushPoly(
    out,
    cam,
    [
      [248, 114, RD - 76],
      [252, 114, RD - 76],
      [268, 108, RD - 96],
      [266, 104, RD - 98],
      [250, 110, RD - 78],
    ],
    "#D5D7D2",
    "#5E615C",
    "bg",
    "mid",
    73,
  );
  pushBox(out, cam, [262, 92, RD - 108], [16, 3, 8], "#B0B2AC", "mid", 74);
  pushBox(out, cam, [400, 0, RD - 70], [78, 186, 62], "#E6E0D2", "mid", 75);
  pushPoly(
    out,
    cam,
    [
      [406, 8, RD - 72],
      [470, 8, RD - 72],
      [470, 178, RD - 72],
      [406, 178, RD - 72],
    ],
    shade("#E6E0D2", -8),
    "#6A6458",
    "bgDetail",
    "mid",
    76,
  );
  pushBox(out, cam, [472, 70, RD - 76], [3, 46, 4], "#C8B888", "mid", 77);
  pushBox(out, cam, [28, 0, RD - 78], [70, 86, 60], "#D9D4CA", "mid", 78);
  pushBox(out, cam, [36, 48, RD - 84], [54, 8, 8], "#2E3238", "near", 79);
  pushBox(out, cam, [40, 92, RD - 96], [36, 2, 22], "#CDB892", "near", 80);
  pushPoly(
    out,
    cam,
    [
      [48, 94, RD - 90],
      [62, 94, RD - 90],
      [60, 108, RD - 102],
      [50, 108, RD - 102],
    ],
    "#EDE6D4",
    "#6A604C",
    "bg",
    "near",
    81,
  );
  pushPoly(
    out,
    cam,
    [
      [78, 96, RD - 100],
      [92, 98, RD - 108],
      [88, 112, RD - 112],
      [74, 108, RD - 104],
    ],
    "#8E3A3A",
    "#5A2424",
    "bgDetail",
    "near",
    82,
  );
  pushPoly(
    out,
    cam,
    [
      [300, 92, RD - 100],
      [332, 92, RD - 102],
      [328, 70, RD - 96],
      [304, 74, RD - 94],
    ],
    "#C7D0C4",
    "#5C6858",
    "bgDetail",
    "near",
    83,
  );
  pushPoly(out, cam, [[318, 92, RD - 108], [338, 90, RD - 120], [336, 78, RD - 118]], shade(counter, -30), shade(counter, -70), "bgDetail", "near", 84, true);
  for (let row = 0; row < 5; row++) {
    for (let col = 0; col < 6; col++) {
      const x = 20 + col * 78;
      const z = 16 + row * 64;
      pushPoly(
        out,
        cam,
        [[x, 0.4, z], [x + 76, 0.4, z], [x + 76, 0.4, z + 62], [x, 0.4, z + 62]],
        (row + col) % 2 ? floorA : floorB,
        "none",
        "none",
        "floor",
        100 + row * 6 + col,
      );
    }
  }
  pushPoly(out, cam, [[180, 0.8, 80], [210, 0.8, 86], [198, 0.8, 120]], shade(floorB, -35), shade(floorB, -60), "bgDetail", "floor", 140, true);
  chair(out, cam);
}

function garage(out, cam) {
  const wall = "#D9CBB0";
  const RD = 340;
  const doorX = 250;
  const doorW = 150;
  const doorH = 190;
  const dz = RD - 2;
  pushPoly(out, cam, [[doorX, 0, dz], [doorX + doorW, 0, dz], [doorX + doorW, doorH, dz], [doorX, doorH, dz]], "#C8B7D4", "none", "none", "far", 1);
  pushPoly(out, cam, [[doorX + 16, 20, dz - 0.3], [doorX + 70, 16, dz - 0.3], [doorX + 84, 78, dz - 0.3], [doorX + 12, 86, dz - 0.3]], "#E7E1D8", shade("#E7E1D8", -30), "bgFar", "far", 2);
  pushPoly(out, cam, [[doorX + 90, 40, dz - 0.4], [doorX + 130, 55, dz - 0.4], [doorX + 118, 18, dz - 0.4]], "#6E7A62", shade("#6E7A62", -30), "bgFar", "far", 3);
  pushBox(out, cam, [0, 0, RD], [doorX, 250, 8], wall, "far", 10);
  pushBox(out, cam, [doorX + doorW, 0, RD], [520 - doorX - doorW, 250, 8], wall, "far", 12);
  pushBox(out, cam, [doorX, doorH, RD], [doorW, 250 - doorH, 8], wall, "far", 13);
  pushBox(out, cam, [40, 70, RD - 6], [200, 130, 4], "#8A7A62", "mid", 11);
  for (let i = 0; i < 5; i++) {
    pushBox(out, cam, [58 + i * 34, 150, RD - 12], [8, 28, 3], "#5C5348", "mid", 20 + i);
  }
  pushPoly(out, cam, [[70, 120, RD - 14], [96, 118, RD - 14], [90, 100, RD - 16], [74, 104, RD - 16]], "#6A6E72", "#2E3134", "bgDetail", "mid", 30);
  pushBox(out, cam, [0, 78, 80], [168, 8, 70], "#B08960", "mid", 40);
  pushBox(out, cam, [8, 0, 86], [8, 78, 8], "#8A6844", "mid", 41);
  pushBox(out, cam, [150, 0, 86], [8, 78, 8], "#8A6844", "mid", 42);
  pushBox(out, cam, [20, 82, 100], [40, 3, 28], "#CDB892", "near", 43);
  pushBox(out, cam, [300, 0, RD - 80], [90, 110, 70], "#D5D8DC", "mid", 50);
  const porthole = [];
  for (let i = 0; i < 14; i++) {
    const a = (i / 14) * Math.PI * 2;
    porthole.push([338 + Math.cos(a) * 22, 62 + Math.sin(a) * 22, RD - 82]);
  }
  pushPoly(out, cam, porthole, "#D5E4EA", "#4A555C", "bg", "mid", 51);
  pushBox(out, cam, [250, 0, 120], [70, 64, 40], "#C45A3A", "near", 60);
  pushBox(out, cam, [260, 20, 112], [46, 28, 6], shade("#C45A3A", -20), "near", 61);
  for (let col = 0; col < 7; col++) {
    for (let row = 0; row < 4; row++) {
      pushPoly(
        out,
        cam,
        [[col * 74, 0.3, row * 80], [col * 74 + 72, 0.3, row * 80], [col * 74 + 72, 0.3, row * 80 + 78], [col * 74, 0.3, row * 80 + 78]],
        (col + row) % 2 ? "#C8BBA6" : "#B7AA96",
        "none",
        "none",
        "floor",
        80 + col + row,
      );
    }
  }
  pushPoly(out, cam, [[200, 0.6, 70], [250, 0.6, 90], [230, 0.6, 130]], "#3E3A34", shade("#3E3A34", -20), "bgDetail", "floor", 90, true);
}

function market(out, cam) {
  const RD = 420;
  pushPoly(out, cam, [[-30, 80, RD + 20], [560, 90, RD + 20], [560, 280, RD + 20], [-30, 270, RD + 20]], "#1B2140", "none", "none", "far", 1);
  pushPoly(out, cam, [[40, 200, RD + 8], [120, 230, RD + 8], [200, 190, RD + 8], [80, 160, RD + 8]], "#C9D4C4", "none", "none", "far", 2);
  for (let i = 0; i < 6; i++) {
    const z = 80 + i * 48;
    const spread = 40 + i * 18;
    pushPoly(
      out,
      cam,
      [[260 - spread, 40, z], [260 + spread, 40, z], [300 + spread, 210, z], [220 - spread, 210, z]],
      i % 2 ? "#6E8A78" : "#7E9A86",
      "#24342C",
      "bgFar",
      "far",
      10 + i,
    );
  }
  pushPoly(out, cam, [[180, 150, 200], [240, 120, 250], [300, 160, 210]], "#E7E2C8", shade("#E7E2C8", -40), "bgDetail", "far", 20, true);
  for (let i = 0; i < 4; i++) {
    const z = 120 + i * 60;
    const x = 40 + i * 28;
    pushBox(out, cam, [x, 70, z], [150 - i * 10, 6, 36], "#A68462", "mid", 30 + i);
    pushBox(out, cam, [x + 8, 0, z + 4], [6, 70, 6], "#6E5338", "mid", 40 + i);
    pushBox(out, cam, [x + 120 - i * 8, 0, z + 4], [6, 70, 6], "#6E5338", "mid", 50 + i);
    for (let j = 0; j < 3; j++) {
      pushBox(out, cam, [x + 18 + j * 28, 78, z + 8], [16, 22, 14], j === 1 ? "#E7C56A" : "#D8E2DC", "mid", 60 + i * 3 + j);
    }
  }
  pushBox(out, cam, [360, 0, 180], [40, 28, 30], "#8A6244", "near", 80);
  pushBox(out, cam, [340, 0, 150], [28, 18, 24], "#6E7A58", "near", 81);
  for (let col = 0; col < 6; col++) {
    for (let row = 0; row < 4; row++) {
      pushPoly(
        out,
        cam,
        [[col * 80, 0.2, 20 + row * 70], [col * 80 + 78, 0.2, 20 + row * 70], [col * 80 + 78, 0.2, 88 + row * 70], [col * 80, 0.2, 88 + row * 70]],
        (col + row) % 2 ? "#3E4658" : "#353C4E",
        "none",
        "none",
        "floor",
        100 + col + row,
      );
    }
  }
}

export function projectSet(setId = "kitchen", cam = eyeCamera(setId)) {
  const out = [];
  if (setId === "garage") garage(out, cam);
  else if (setId === "market") market(out, cam);
  else kitchen(out, cam);
  out.sort((a, b) => b.z - a.z);
  return out;
}

export function actorPlacement(cam, pose, model, metrics) {
  const cm = model.cm || 165;
  const stand = model.world || 340;
  const span = Math.max(80, metrics?.span || stand);
  const worldH = cm * (span / stand);
  const feet = project(cam, [pose.wx ?? 200, 0, pose.wz ?? 180]);
  const head = project(cam, [pose.wx ?? 200, worldH, pose.wz ?? 180]);
  if (!feet || !head) return { x: 640, y: 640, scale: 0.45 };
  const screen = Math.max(48, Math.abs(head.y - feet.y));
  return { x: feet.x, y: feet.y, scale: screen / span };
}
