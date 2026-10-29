// Drawn rooms on one perspective camera. Every edge is projected from the same
// eye, so the counter, cabinets, floor and furniture share a vanishing point.
// Contours are near-black ink. Fills stay the scene palette.

import { smoothClosed, smoothOpen } from "./curves.js";
import { garageProps, kitchenProps, marketProps } from "./drawings/props.js";

const INK = "#221D26";

export const EYE = { vpx: 640, vpy: 390, eyeY: 150, camZ: 340, focal: 420 };
export const LOW = { vpx: 640, vpy: 520, eyeY: 70, camZ: 200, focal: 280 };

export function rigFor(perspective = "eye") {
  const cam = perspective === "low" ? LOW : EYE;
  return { horizonY: cam.vpy, floorY: 706, vanishX: cam.vpx };
}

function project(cam, x, y, z) {
  const f = cam.focal / Math.max(16, cam.camZ - z);
  return [
    Math.round((cam.vpx + x * f) * 10) / 10,
    Math.round((cam.vpy - (y - cam.eyeY) * f) * 10) / 10,
  ];
}

function ruled(pts, open = false) {
  const n = (v) => Math.round(v * 10) / 10;
  const seg = (a, b) => {
    const c1x = a[0] + (b[0] - a[0]) / 3;
    const c1y = a[1] + (b[1] - a[1]) / 3;
    const c2x = a[0] + (2 * (b[0] - a[0])) / 3;
    const c2y = a[1] + (2 * (b[1] - a[1])) / 3;
    return `C${n(c1x)} ${n(c1y)} ${n(c2x)} ${n(c2y)} ${n(b[0])} ${n(b[1])}`;
  };
  let d = `M${n(pts[0][0])} ${n(pts[0][1])}`;
  for (let i = 1; i < pts.length; i += 1) d += seg(pts[i - 1], pts[i]);
  if (!open) d += seg(pts.at(-1), pts[0]) + "Z";
  return d;
}

function face(id, pts, fill, line = "bg", open = false) {
  return {
    id,
    type: "path",
    path: open ? ruled(pts, true) : ruled(pts, false),
    fill: open ? "none" : fill,
    stroke: INK,
    strokeWidth: 0,
    line: open ? "bgDetail" : line,
    shadow: false,
  };
}

function worldFace(cam, id, corners, fill, line = "bg", open = false) {
  return face(id, corners.map(([x, y, z]) => project(cam, x, y, z)), fill, line, open);
}

function drawn(cam, id, corners, fill, line = "prop", open = false) {
  const pts = corners.map(([x, y, z]) => project(cam, x, y, z));
  return {
    id,
    type: "path",
    path: open ? smoothOpen(pts) : smoothClosed(pts),
    fill: open ? "none" : fill,
    stroke: INK,
    strokeWidth: 0,
    line: open ? "bgDetail" : line,
    shadow: false,
  };
}

function box(cam, id, x0, x1, y0, y1, z0, z1, fill, side) {
  return [
    worldFace(cam, `${id}Front`, [[x0, y1, z1], [x1, y1, z1], [x1, y0, z1], [x0, y0, z1]], fill),
    worldFace(cam, `${id}Top`, [[x0, y1, z0], [x1, y1, z0], [x1, y1, z1], [x0, y1, z1]], fill, "bg"),
    worldFace(cam, `${id}Side`, [[x1, y1, z0], [x1, y1, z1], [x1, y0, z1], [x1, y0, z0]], side || fill),
  ];
}

function legs(cam, id, x0, x1, y0, top, z0, z1, fill, side) {
  const posts = [[x0, z0], [x1 - 8, z0], [x0, z1 - 8], [x1 - 8, z1 - 8]];
  const shapes = posts.map(([x, z], index) => worldFace(
    cam,
    `${id}Leg${index}`,
    [[x, top - 4, z + 7], [x + 7, top - 4, z + 7], [x + 7, y0, z + 7], [x, y0, z + 7]],
    side,
    "prop",
  ));
  shapes.push(worldFace(cam, `${id}Top`, [[x0, top, z0], [x1, top, z0], [x1, top, z1], [x0, top, z1]], fill, "prop"));
  shapes.push(worldFace(cam, `${id}Lip`, [[x0, top, z1], [x1, top, z1], [x1, top - 5, z1], [x0, top - 5, z1]], fill, "prop"));
  return shapes;
}

function layer(id, parallax, children) {
  return { type: "group", id, parallax, children };
}

function floorGrid(cam, x0, x1, z1, fillA, fillB) {
  const cols = 8;
  const rows = 5;
  const zNear = Math.min(z1, 210);
  const shapes = [];
  for (let row = 0; row < rows; row += 1) {
    for (let col = 0; col < cols; col += 1) {
      const za = (zNear * row) / rows;
      const zb = (zNear * (row + 1)) / rows;
      const xa = x0 + ((x1 - x0) * col) / cols;
      const xb = x0 + ((x1 - x0) * (col + 1)) / cols;
      const near = row / Math.max(1, rows - 1);
      const dark = (hex) => {
        const n = Number.parseInt(hex.slice(1), 16);
        const f = (c) => Math.max(0, Math.min(255, Math.round(c - near * 48)));
        return `#${[f((n >> 16) & 255), f((n >> 8) & 255), f(n & 255)].map((v) => v.toString(16).padStart(2, "0")).join("")}`;
      };
      shapes.push(worldFace(
        cam,
        `tile${row}${col}`,
        [[xa, 0, za], [xb, 0, za], [xb, 0, zb], [xa, 0, zb]],
        dark((row + col) % 2 ? fillB : fillA),
      ));
    }
  }
  for (let row = 1; row < rows; row += 1) {
    const z = (zNear * row) / rows;
    shapes.push(worldFace(cam, `groutH${row}`, [[x0, 0.8, z], [x1, 0.8, z]], "none", "bgDetail", true));
  }
  for (let col = 1; col < cols; col += 1) {
    const x = x0 + ((x1 - x0) * col) / cols;
    shapes.push(worldFace(cam, `groutV${col}`, [[x, 0.8, 0], [x, 0.8, zNear]], "none", "bgDetail", true));
  }
  return shapes;
}

function kitchen(cam) {
  const wall = "#E0D3B4";
  const cab = "#8FA383";
  const cabSide = "#738566";
  const counter = "#E8DCC0";
  const counterSide = "#D4C6A8";
  const floorA = "#C5CBA6";
  const floorB = "#F3ECD8";
  const sky = "#BFDCE6";
  const hedge = "#6E8A62";
  const wood = "#8B5E3C";
  const woodSide = "#6A4328";
  const steel = "#D9D4CC";
  const fridge = "#E4E0D4";
  const shapes = [
    ...floorGrid(cam, -360, 360, 390, floorA, floorB),
    worldFace(cam, "backWall", [[-340, 270, 0], [340, 270, 0], [340, 0, 0], [-340, 0, 0]], wall, "bgFar"),
    worldFace(cam, "leftWall", [[-340, 270, 0], [-340, 270, 380], [-340, 0, 380], [-340, 0, 0]], "#D9C7A4", "bgFar"),
    worldFace(cam, "rightWall", [[340, 270, 380], [340, 270, 0], [340, 0, 0], [340, 0, 380]], "#D9C7A4", "bgFar"),
    worldFace(cam, "ceilingLine", [[-340, 270, 1], [340, 270, 1]], "none", "bgFar", true),
    worldFace(cam, "aoBack", [[-336, 7, 3], [336, 7, 3], [348, 0, 12], [-348, 0, 12]], "#B6A888", "bgFar"),
    worldFace(cam, "aoLeft", [[-338, 8, 16], [-330, 8, 16], [-324, 0, 180], [-340, 0, 180]], "#B6A888", "bgFar"),
    worldFace(cam, "wallShade", [[-340, 260, 1], [-120, 260, 1], [-120, 0, 1], [-340, 0, 1]], "#D2C09A", "bgFar"),
    worldFace(cam, "window", [[-250, 214, 1], [-70, 214, 1], [-70, 118, 1], [-250, 118, 1]], sky),
    drawn(cam, "cloudA", [[-230, 200, 2], [-200, 208, 2], [-170, 198, 2], [-188, 188, 2], [-220, 190, 2]], "#F7FBFD", "bgFar"),
    drawn(cam, "cloudB", [[-140, 206, 2], [-112, 214, 2], [-90, 202, 2], [-108, 194, 2], [-132, 196, 2]], "#F4F8FA", "bgFar"),
    worldFace(cam, "trunk", [[-228, 150, 2], [-220, 150, 2], [-218, 122, 2], [-230, 122, 2]], "#6B4A32", "bg"),
    drawn(cam, "canopy", [[-248, 156, 2], [-232, 176, 2], [-210, 170, 2], [-204, 152, 2], [-220, 142, 2], [-242, 146, 2]], hedge, "bg"),
    worldFace(cam, "house", [[-200, 172, 2], [-156, 172, 2], [-156, 128, 2], [-200, 128, 2]], "#E7D7C4", "bg"),
    worldFace(cam, "roof", [[-208, 172, 2], [-178, 196, 2], [-148, 172, 2]], "#8E5A4A", "bg"),
    worldFace(cam, "houseWin", [[-190, 160, 3], [-176, 160, 3], [-176, 146, 3], [-190, 146, 3]], "#C9DCEA", "bgDetail"),
    worldFace(cam, "houseDoor", [[-172, 146, 3], [-162, 146, 3], [-162, 128, 3], [-172, 128, 3]], "#6A4328", "bgDetail"),
    worldFace(cam, "house2", [[-140, 160, 2], [-112, 160, 2], [-112, 128, 2], [-140, 128, 2]], "#E4D2BE", "bg"),
    worldFace(cam, "roof2", [[-146, 160, 2], [-126, 176, 2], [-106, 160, 2]], "#A86B52", "bg"),
    worldFace(cam, "chimney", [[-118, 168, 3], [-112, 168, 3], [-112, 180, 3], [-118, 180, 3]], "#8E5A4A", "bgDetail"),
    worldFace(cam, "fence", [[-246, 132, 3], [-90, 132, 3]], "none", "bgDetail", true),
    worldFace(cam, "fencePost", [[-230, 122, 3], [-230, 140, 3]], "none", "bgDetail", true),
    worldFace(cam, "fencePost2", [[-170, 122, 3], [-170, 142, 3]], "none", "bgDetail", true),
    worldFace(cam, "fencePost3", [[-120, 122, 3], [-120, 140, 3]], "none", "bgDetail", true),
    worldFace(cam, "houseWinMuntin", [[-183, 160, 4], [-183, 146, 4]], "none", "bgDetail", true),
    drawn(cam, "tree2", [[-100, 140, 2], [-88, 162, 2], [-76, 140, 2], [-90, 136, 2]], "#4E7A48", "bg"),
    worldFace(cam, "road", [[-246, 124, 2], [-80, 124, 2], [-76, 118, 2], [-248, 118, 2]], "#C4B8A4", "bgFar"),
    drawn(cam, "hedge", [[-248, 140, 2], [-210, 150, 2], [-170, 142, 2], [-130, 148, 2], [-90, 136, 2], [-78, 122, 2], [-248, 122, 2]], hedge, "bg"),
    worldFace(cam, "muntinV", [[-160, 214, 3], [-160, 118, 3]], "none", "bgDetail", true),
    worldFace(cam, "muntinH", [[-250, 166, 3], [-70, 166, 3]], "none", "bgDetail", true),
    ...box(cam, "upCab", -60, 200, 156, 236, 0, 28, cab, cabSide),
    worldFace(cam, "cabSplit", [[70, 230, 29], [70, 162, 29]], "none", "bgDetail", true),
    worldFace(cam, "cabHandle", [[18, 200, 30], [22, 200, 30], [22, 184, 30], [18, 184, 30]], "#C4B496", "bgDetail"),
    worldFace(cam, "cabHandle2", [[118, 198, 30], [122, 198, 30], [122, 182, 30], [118, 182, 30]], "#C4B496", "bgDetail"),
    worldFace(cam, "cabShadow", [[-70, 154, 36], [210, 152, 36], [216, 144, 48], [-78, 146, 48]], "#C4B496", "bg"),
    ...box(cam, "counter", -270, 200, 0, 92, 0, 40, counter, counterSide),
    ...[0, 1, 2, 3].map((i) => worldFace(
      cam,
      `splash${i}`,
      [[-50 + i * 58, 150, 2], [4 + i * 58, 150, 2], [4 + i * 58, 96, 2], [-50 + i * 58, 96, 2]],
      i % 2 ? "#E4D3B4" : "#F0E2C4",
      "bgDetail",
    )),
    ...box(cam, "stove", 20, 170, 0, 92, 0, 40, steel, "#B7B2AA"),
    worldFace(cam, "burner", [[50, 93, 22], [86, 93, 22], [82, 93, 42], [46, 93, 42]], "#6E6A66", "bgDetail"),
    worldFace(cam, "burner2", [[108, 93, 22], [144, 93, 22], [140, 93, 42], [104, 93, 42]], "#6E6A66", "bgDetail"),
    ...kitchenProps(cam),
    worldFace(cam, "picture", [[150, 250, 1], [210, 250, 1], [210, 200, 1], [150, 200, 1]], "#F3E7C8", "bgDetail"),
    worldFace(cam, "pictureHill", [[156, 224, 2], [180, 208, 2], [204, 226, 2], [204, 236, 2], [156, 236, 2]], "#7E946C", "bgFar"),
    worldFace(cam, "fridge", [[220, 190, 8], [320, 190, 8], [320, 0, 8], [220, 0, 8]], fridge),
    worldFace(cam, "fridgeTop", [[220, 190, 0], [320, 190, 0], [320, 190, 8], [220, 190, 8]], "#D5D0C4"),
    worldFace(cam, "fridgeNote", [[240, 150, 9], [286, 150, 9], [286, 112, 9], [240, 112, 9]], "#F7F1DE", "bgDetail"),
    worldFace(cam, "calendar", [[-200, 268, 1], [-130, 268, 1], [-130, 214, 1], [-200, 214, 1]], "#F4EFE2", "bgDetail"),
    worldFace(cam, "calGrid", [[-190, 250, 2], [-140, 250, 2]], "none", "bgDetail", true),
    worldFace(cam, "chairLeg0", [[-32, 44, 88], [-26, 44, 88], [-26, 0, 92], [-32, 0, 92]], woodSide, "prop"),
    worldFace(cam, "chairLeg1", [[24, 44, 88], [30, 44, 88], [30, 0, 92], [24, 0, 92]], woodSide, "prop"),
    worldFace(cam, "chairLeg2", [[-30, 44, 66], [-24, 44, 66], [-24, 0, 62], [-30, 0, 62]], woodSide, "prop"),
    worldFace(cam, "chairLeg3", [[22, 44, 66], [28, 44, 66], [28, 0, 62], [22, 0, 62]], woodSide, "prop"),
    worldFace(cam, "chairSeat", [[-34, 46, 64], [34, 46, 64], [40, 46, 104], [-40, 46, 104]], "#C48A52", "prop"),
    worldFace(cam, "chairBackL", [[-36, 46, 64], [-28, 46, 64], [-28, 156, 64], [-36, 156, 64]], "#A56B42", "prop"),
    worldFace(cam, "chairBackR", [[28, 46, 64], [36, 46, 64], [36, 156, 64], [28, 156, 64]], "#A56B42", "prop"),
    worldFace(cam, "chairRail", [[-28, 148, 64], [28, 148, 64], [28, 158, 64], [-28, 158, 64]], "#C48A52", "prop"),
    worldFace(cam, "chairSlat", [[-28, 108, 64], [28, 108, 64], [28, 118, 64], [-28, 118, 64]], "#C48A52", "prop"),
    worldFace(cam, "chairSlatLow", [[-28, 72, 64], [28, 72, 64], [28, 82, 64], [-28, 82, 64]], "#C48A52", "prop"),
  ];
  return [layer("room", 1, shapes)];
}

function garage(cam) {
  const wall = "#D2BF9C";
  const concreteA = "#9A948C";
  const concreteB = "#A8A29A";
  const bench = "#9C6C46";
  const sky = "#C8B7D2";
  const shapes = [
    ...floorGrid(cam, -360, 360, 390, concreteA, concreteB),
    worldFace(cam, "backWall", [[-340, 260, 0], [340, 260, 0], [340, 0, 0], [-340, 0, 0]], wall, "bgFar"),
    worldFace(cam, "leftWall", [[-340, 260, 0], [-340, 260, 380], [-340, 0, 380], [-340, 0, 0]], "#C4B08A", "bgFar"),
    worldFace(cam, "door", [[150, 230, 1], [330, 230, 1], [330, 0, 1], [150, 0, 1]], sky),
    worldFace(cam, "street", [[156, 70, 2], [324, 70, 2], [324, 4, 2], [156, 4, 2]], "#C4B8A4"),
    worldFace(cam, "hedgeOut", [[160, 78, 3], [320, 78, 3], [316, 40, 3], [164, 44, 3]], "#6E8A62"),
    worldFace(cam, "peg", [[-300, 210, 2], [-40, 210, 2], [-40, 100, 2], [-300, 100, 2]], "#C4B496"),
    worldFace(cam, "peg1", [[-290, 180, 3], [-50, 180, 3]], "none", "bgDetail", true),
    worldFace(cam, "peg2", [[-290, 150, 3], [-50, 150, 3]], "none", "bgDetail", true),
    worldFace(cam, "peg3", [[-290, 120, 3], [-50, 120, 3]], "none", "bgDetail", true),
    ...box(cam, "bench", -300, 80, 0, 88, 0, 70, bench, "#744C30"),
    ...box(cam, "appliance", -220, -40, 88, 170, 8, 62, "#D9D4CC", "#B7B2AA"),
    worldFace(cam, "porthole", [[-160, 148, 63], [-120, 156, 63], [-100, 132, 63], [-128, 112, 63], [-164, 122, 63]], "#A6E8B0"),
    worldFace(cam, "cord", [[-30, 90, 36], [-8, 78, 48], [6, 88, 40]], "none", "bgDetail", true),
    ...box(cam, "fridge", -10, 70, 0, 170, 8, 62, "#9DAA95", "#74866C"),
    ...garageProps(cam),
  ];
  return [layer("room", 1, shapes)];
}

function market(cam) {
  const sky = "#1F2542";
  const floorA = "#3A3A41";
  const floorB = "#46434B";
  const cloths = ["#8E5550", "#58435C", "#2F5A5A", "#8E5550", "#58435C"];
  const shapes = [
    worldFace(cam, "night", [[-400, 320, 0], [400, 320, 0], [400, 0, 0], [-400, 0, 0]], sky, "bgFar"),
    ...floorGrid(cam, -360, 360, 380, floorA, floorB),
    face("dome", [
      project(cam, -300, 40, 20),
      project(cam, -160, 250, 40),
      project(cam, 0, 290, 60),
      project(cam, 180, 240, 40),
      project(cam, 320, 36, 20),
    ], "none", "bg", true),
    face("dome2", [
      project(cam, -240, 20, 80),
      project(cam, -80, 200, 120),
      project(cam, 40, 230, 140),
      project(cam, 200, 180, 110),
      project(cam, 300, 16, 70),
    ], "none", "bgFar", true),
  ];
  cloths.forEach((cloth, index) => {
    const x = -200 + index * 95;
    const z = 36 + index * 16;
    shapes.push(worldFace(cam, `stall${index}Front`, [[x, 108, z + 40], [x + 78, 108, z + 40], [x + 78, 0, z + 40], [x, 0, z + 40]], cloth));
    shapes.push(worldFace(cam, `stall${index}Top`, [[x, 108, z], [x + 78, 108, z], [x + 78, 108, z + 40], [x, 108, z + 40]], cloth, "bg"));
  });
  shapes.push(...marketProps(cam));
  shapes.push(worldFace(cam, "stringA", [[-160, 150, 70], [-160, 220, 40]], "none", "bgDetail", true));
  shapes.push(worldFace(cam, "stringB", [[40, 160, 110], [40, 230, 80]], "none", "bgDetail", true));
  shapes.push(...box(cam, "crate", -300, -210, 0, 36, 280, 330, "#6A4A32", "#4A321F"));
  return [layer("room", 1, shapes)];
}

export const KITCHEN_LAYOUT = {
  table: { x0: -900, x1: -880, top: 74, z0: 48, z1: 62 },
  chair: { x0: -40, x1: 40, seat: 46, z0: 64, z1: 104 },
  fridge: { x0: 220, x1: 320, top: 190, z0: 0, z1: 8 },
  counter: { x0: -270, x1: 200, top: 92, z0: 0, z1: 40 },
};

export function kitchenPlate() {
  return kitchen(EYE);
}

export function kitchenLowPlate() {
  return kitchen(LOW);
}

export function garagePlate() {
  return garage(EYE);
}

export function garageLowPlate() {
  return garage(LOW);
}

export function marketPlate() {
  return market(EYE);
}

export function marketLowPlate() {
  return market(LOW);
}
