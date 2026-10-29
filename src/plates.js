// Drawn rooms on one perspective camera. Every edge is projected from the same
// eye, so the counter, cabinets, floor and furniture share a vanishing point.
// Contours are near-black ink. Fills stay the scene palette.

const INK = "#221D26";

export const EYE = { vpx: 640, vpy: 248, eyeY: 155, camZ: 500, focal: 430 };
export const LOW = { vpx: 640, vpy: 468, eyeY: 58, camZ: 460, focal: 390 };

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
  const shapes = [];
  for (let row = 0; row < rows; row += 1) {
    for (let col = 0; col < cols; col += 1) {
      const za = (z1 * row) / rows;
      const zb = (z1 * (row + 1)) / rows;
      const xa = x0 + ((x1 - x0) * col) / cols;
      const xb = x0 + ((x1 - x0) * (col + 1)) / cols;
      shapes.push(worldFace(
        cam,
        `tile${row}${col}`,
        [[xa, 0, za], [xb, 0, za], [xb, 0, zb], [xa, 0, zb]],
        (row + col) % 2 ? fillB : fillA,
      ));
    }
  }
  return shapes;
}

function kitchen(cam) {
  const wall = "#E0D3B4";
  const cab = "#8FA383";
  const cabSide = "#738566";
  const counter = "#E8DCC0";
  const counterSide = "#D4C6A8";
  const floorA = "#CBD0B0";
  const floorB = "#E3DDC4";
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
    worldFace(cam, "window", [[-250, 214, 1], [-70, 214, 1], [-70, 118, 1], [-250, 118, 1]], sky),
    worldFace(cam, "hedge", [[-246, 156, 2], [-80, 156, 2], [-74, 122, 2], [-248, 124, 2]], hedge),
    worldFace(cam, "house", [[-210, 168, 2], [-150, 168, 2], [-150, 128, 2], [-210, 128, 2]], "#E7D7C4"),
    worldFace(cam, "roof", [[-216, 168, 2], [-180, 196, 2], [-144, 168, 2]], "#8E5A4A"),
    worldFace(cam, "moon", [[-110, 198, 2], [-96, 204, 2], [-88, 190, 2], [-102, 184, 2]], "#F4E7C8", "bgFar"),
    worldFace(cam, "muntinV", [[-160, 214, 3], [-160, 118, 3]], "none", "bgDetail", true),
    worldFace(cam, "muntinH", [[-250, 166, 3], [-70, 166, 3]], "none", "bgDetail", true),
    ...box(cam, "upCab", -60, 200, 156, 236, 0, 28, cab, cabSide),
    worldFace(cam, "cabSplit", [[70, 230, 29], [70, 162, 29]], "none", "bgDetail", true),
    worldFace(cam, "cabHandle", [[20, 196, 30], [42, 196, 30]], "none", "bgDetail", true),
    worldFace(cam, "cabHandle2", [[120, 196, 30], [142, 196, 30]], "none", "bgDetail", true),
    ...box(cam, "counter", -270, 200, 0, 92, 0, 64, counter, counterSide),
    worldFace(cam, "sink", [[-210, 93, 18], [-100, 93, 18], [-108, 93, 48], [-202, 93, 48]], "#D5D8DC"),
    worldFace(cam, "tap", [[-160, 92, 28], [-156, 128, 30], [-140, 132, 34], [-136, 96, 36], [-148, 92, 32]], "#C5C8CC"),
    ...box(cam, "stove", 20, 170, 0, 92, 0, 64, steel, "#B7B2AA"),
    worldFace(cam, "burner", [[50, 93, 22], [86, 93, 22], [82, 93, 42], [46, 93, 42]], "#6E6A66", "bgDetail"),
    worldFace(cam, "burner2", [[108, 93, 22], [144, 93, 22], [140, 93, 42], [104, 93, 42]], "#6E6A66", "bgDetail"),
    worldFace(cam, "kettle", [[-40, 92, 30], [-16, 118, 34], [8, 96, 40], [-4, 92, 36], [-28, 92, 28]], "#C4553A"),
    worldFace(cam, "fruit", [[-60, 96, 48], [-42, 108, 50], [-28, 96, 54], [-46, 92, 50]], "#3E8F8A"),
    ...box(cam, "fridge", 214, 310, 0, 196, 0, 58, fridge, "#C8C2B4"),
    worldFace(cam, "fridgeNote", [[236, 150, 59], [276, 150, 59], [276, 118, 59], [236, 118, 59]], "#F7F1DE", "bgDetail"),
    ...legs(cam, "table", 210, 330, 74, 76, 24, 96, "#C48A52", woodSide),
    ...legs(cam, "chair", -46, 34, 44, 44, 200, 248, wood, woodSide),
    worldFace(cam, "chairBack", [[-42, 44, 206], [30, 44, 206], [30, 128, 206], [-42, 128, 206]], "#A56B42", "prop"),
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
  const jars = [
    [-180, 190, 70, "#FFC46B"],
    [-40, 200, 110, "#7FE6E0"],
    [90, 188, 150, "#FFC46B"],
    [210, 176, 190, "#7FE6E0"],
  ];
  for (const [x, y, z, fill] of jars) {
    shapes.push(worldFace(cam, `jar${x}`, [[x, y, z], [x + 22, y + 8, z], [x + 18, y - 36, z], [x - 4, y - 30, z]], fill));
    shapes.push(worldFace(cam, `string${x}`, [[x + 8, y + 8, z], [x + 8, y + 70, z - 20]], "none", "bgDetail", true));
  }
  shapes.push(...box(cam, "crate", -300, -210, 0, 36, 280, 330, "#6A4A32", "#4A321F"));
  return [layer("room", 1, shapes)];
}

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
