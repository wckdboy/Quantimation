// Authored background plates. One-point kitchen, garage, and market.
// Architecture is ruled cubics. Props use the same smooth contours as the cast.
// Lines stay in darkened local colour, never character ink.

import { smoothClosed, smoothOpen } from "./curves.js";

function n(v) {
  return Math.round(v * 10) / 10;
}

function segment(a, b) {
  const c1x = a[0] + (b[0] - a[0]) / 3;
  const c1y = a[1] + (b[1] - a[1]) / 3;
  const c2x = a[0] + (2 * (b[0] - a[0])) / 3;
  const c2y = a[1] + (2 * (b[1] - a[1])) / 3;
  return `C${n(c1x)} ${n(c1y)} ${n(c2x)} ${n(c2y)} ${n(b[0])} ${n(b[1])}`;
}

function ruled(pts, open = false) {
  let d = `M${n(pts[0][0])} ${n(pts[0][1])}`;
  for (let i = 1; i < pts.length; i += 1) d += segment(pts[i - 1], pts[i]);
  if (!open) d += segment(pts.at(-1), pts[0]) + "Z";
  return d;
}

function shape(id, pts, fill, stroke, line = "bg", extra = {}) {
  const open = extra.open === true;
  const organic = extra.organic === true;
  const path = organic ? (open ? smoothOpen(pts) : smoothClosed(pts)) : ruled(pts, open);
  return {
    id,
    type: "path",
    path,
    fill: open ? "none" : fill,
    stroke,
    strokeWidth: 0,
    line: open ? extra.line || "bgDetail" : line,
    shadow: extra.shadow === true,
  };
}

function layer(id, parallax, children) {
  return { type: "group", id, parallax, children };
}

function kitchenPlate() {
  const wall = "#E0D3B4";
  const wallLine = "#B7A88A";
  const cab = "#8FA383";
  const cabLine = "#6A7A60";
  const counter = "#E8DCC0";
  const counterLine = "#C4B496";
  const floorA = "#CBD0B0";
  const floorB = "#E3DDC4";
  const floorLine = "#A3A888";
  const sky = "#BFDCE6";
  const hedge = "#6E8A62";
  const wood = "#8B5E3C";
  const woodLine = "#6A4328";
  const fruit = "#3E8F8A";

  const far = [
    shape("wall", [[0, 0], [1280, 0], [1280, 500], [0, 500]], wall, wallLine, "bgFar"),
    shape("window", [[100, 70], [400, 62], [412, 310], [88, 322]], sky, "#8E7A62", "bg"),
    shape("house", [[150, 150], [210, 118], [250, 138], [248, 230], [154, 236]], "#E7D7C4", "#A89880", "bg"),
    shape("roof", [[140, 156], [200, 108], [230, 132], [168, 168]], "#8E5A4A", "#6C4034", "bg"),
    shape("hedge", [[96, 248], [180, 236], [280, 244], [390, 232], [404, 308], [92, 314]], hedge, "#547048", "bg", { organic: true }),
    shape("moon", [[330, 96], [348, 90], [360, 108], [344, 124], [324, 114]], "#F4E7C8", "#CDB892", "bgFar", { organic: true }),
    shape("muntinV", [[250, 70], [256, 308]], "none", "#8E7A62", "bgDetail", { open: true }),
    shape("muntinH", [[104, 180], [400, 172]], "none", "#8E7A62", "bgDetail", { open: true }),
  ];

  const mid = [
    shape("upCab", [[440, 48], [980, 36], [996, 228], [430, 246]], cab, cabLine, "bg", { shadow: true }),
    shape("cabDoor1", [[470, 64], [640, 58], [650, 210], [462, 220]], "#9AAD8C", cabLine, "bg"),
    shape("cabDoor2", [[660, 56], [840, 50], [852, 204], [668, 212]], "#9AAD8C", cabLine, "bg"),
    shape("cabDoor3", [[860, 48], [960, 44], [970, 198], [868, 206]], "#9AAD8C", cabLine, "bg"),
    shape("handle1", [[600, 120], [628, 118], [626, 128], [598, 130]], "#C4B496", "#8A7A62", "bgDetail"),
    shape("handle2", [[790, 114], [818, 112], [816, 122], [788, 124]], "#C4B496", "#8A7A62", "bgDetail"),
    shape("counter", [[40, 348], [1100, 318], [1124, 400], [28, 438]], counter, counterLine, "bg", { shadow: true }),
    shape("sink", [[150, 368], [360, 356], [348, 402], [160, 412]], "#D5D8DC", "#9AA0A6", "bg", { organic: true }),
    shape("tap", [[230, 368], [236, 328], [268, 316], [286, 340], [274, 356], [258, 348], [250, 372]], "#C5C8CC", "#8A8E94", "bg", { organic: true }),
    shape("lowCab", [[48, 420], [700, 392], [724, 620], [36, 650]], cab, cabLine, "bg"),
    shape("lowDoor", [[80, 450], [250, 438], [260, 600], [78, 616]], "#9AAD8C", cabLine, "bg"),
    shape("lowDoor2", [[280, 434], [470, 422], [482, 588], [278, 604]], "#9AAD8C", cabLine, "bg"),
    shape("stove", [[760, 330], [1040, 312], [1060, 560], [748, 582]], "#D9D4CC", "#A39E96", "bg", { shadow: true }),
    shape("burner", [[820, 360], [860, 354], [868, 386], [824, 392]], "#6E6A66", "#4A4744", "bgDetail", { organic: true }),
    shape("burner2", [[910, 352], [952, 346], [960, 378], [916, 384]], "#6E6A66", "#4A4744", "bgDetail", { organic: true }),
    shape("kettle", [[500, 292], [542, 278], [574, 304], [560, 348], [508, 352], [488, 318]], "#C4553A", "#8E3424", "bg", { organic: true, shadow: true }),
    shape("fruit", [[630, 318], [658, 304], [682, 330], [660, 356], [626, 348]], fruit, "#2C6A66", "bg", { organic: true }),
    shape("spiral", [[644, 326], [658, 318], [666, 334], [652, 342], [646, 332]], "none", "#1E4E4A", "bgDetail", { open: true, organic: true }),
    shape("fridge", [[1088, 90], [1264, 78], [1272, 560], [1076, 574]], "#E4E0D4", "#B0AA9C", "bg", { shadow: true }),
    shape("fridgeNote", [[1140, 160], [1210, 156], [1214, 210], [1138, 214]], "#F7F1DE", "#C4B496", "bgDetail"),
  ];

  const floor = [
    shape("floorFill", [[0, 490], [1280, 490], [1280, 720], [0, 720]], floorA, floorLine, "bg"),
  ];
  for (let i = 0; i < 5; i += 1) {
    const y0 = 490 + i * 46;
    const y1 = y0 + 46;
    const inset0 = i * 48;
    const inset1 = (i + 1) * 48;
    floor.push(shape(
      `tile${i}`,
      [[inset0, y0], [1280 - inset0, y0 - i * 4], [1280 - inset1, y1], [inset1, y1 + 4]],
      i % 2 ? floorB : floorA,
      floorLine,
      "bg",
    ));
  }

  const near = [
    shape("table", [[720, 520], [1080, 500], [1140, 620], [680, 648]], "#C48A52", woodLine, "bg", { shadow: true }),
    shape("chairBack", [[760, 430], [900, 418], [910, 530], [752, 542]], wood, woodLine, "prop"),
    shape("chairSeat", [[740, 530], [930, 516], [960, 590], [730, 606]], "#C48A52", woodLine, "prop"),
    shape("chairLeg", [[748, 590], [770, 586], [740, 700], [716, 698]], wood, woodLine, "prop"),
    shape("chairLeg2", [[910, 580], [932, 574], [960, 700], [936, 704]], wood, woodLine, "prop"),
  ];

  return [
    layer("sky_wall", 0.22, far),
    layer("main_set", 0.7, mid),
    layer("floor", 1, floor),
    layer("foreground", 1.12, near),
  ];
}

function garagePlate() {
  const wall = "#D2BF9C";
  const wallLine = "#A89274";
  const concrete = "#9A948C";
  const bench = "#9C6C46";
  const benchLine = "#744C30";
  const fridge = "#9DAA95";
  const sky = "#C8B7D2";
  const far = [
    shape("wall", [[0, 0], [1280, 0], [1280, 460], [0, 460]], wall, wallLine, "bgFar"),
    shape("door", [[860, 40], [1240, 24], [1260, 520], [840, 500]], sky, "#8A7A96", "bg"),
    shape("street", [[860, 360], [1240, 348], [1260, 520], [850, 500]], "#C4B8A4", "#9A8C78", "bg"),
    shape("hedgeOut", [[900, 300], [1040, 270], [1180, 292], [1200, 370], [900, 380]], "#6E8A62", "#547048", "bg", { organic: true }),
  ];
  const mid = [
    shape("peg", [[40, 70], [420, 60], [430, 280], [36, 292]], "#C4B496", "#8A7A62", "bg"),
    shape("pegLine", [[70, 110], [400, 100]], "none", "#8A7A62", "bgDetail", { open: true }),
    shape("pegLine2", [[70, 160], [400, 150]], "none", "#8A7A62", "bgDetail", { open: true }),
    shape("pegLine3", [[70, 210], [400, 200]], "none", "#8A7A62", "bgDetail", { open: true }),
    shape("tool", [[120, 100], [128, 96], [150, 200], [140, 204]], "#4A6385", "#35496A", "bgDetail"),
    shape("tool2", [[200, 108], [230, 100], [236, 118], [206, 126]], "#C4553A", "#8E3424", "bgDetail"),
    shape("bench", [[40, 340], [780, 310], [800, 430], [28, 468]], bench, benchLine, "bg", { shadow: true }),
    shape("appliance", [[180, 180], [420, 168], [430, 360], [170, 372]], "#D9D4CC", "#A39E96", "bg", { shadow: true }),
    shape("porthole", [[250, 230], [300, 214], [340, 250], [320, 300], [260, 304], [236, 264]], "#A6E8B0", "#6EAA7A", "bg", { organic: true }),
    shape("cord", [[400, 340], [460, 380], [520, 360], [560, 420], [520, 450]], "none", "#D27A3E", "bgDetail", { open: true, organic: true }),
    shape("fridge", [[620, 120], [820, 108], [836, 460], [608, 474]], fridge, "#74866C", "bg", { shadow: true }),
  ];
  const floor = [
    shape("concrete", [[0, 460], [1280, 440], [1280, 720], [0, 720]], concrete, "#7A746C", "bg"),
    shape("seam", [[80, 520], [1100, 500]], "none", "#7A746C", "bgDetail", { open: true }),
    shape("seam2", [[40, 600], [1180, 574]], "none", "#7A746C", "bgDetail", { open: true }),
  ];
  const near = [
    shape("stool", [[480, 500], [620, 488], [640, 560], [470, 574]], bench, benchLine, "prop"),
    shape("stoolLeg", [[490, 560], [510, 556], [480, 700], [458, 698]], benchLine, "#5A3820", "prop"),
  ];
  return [
    layer("sky_wall", 0.22, far),
    layer("main_set", 0.7, mid),
    layer("floor", 1, floor),
    layer("foreground", 1.12, near),
  ];
}

function marketPlate() {
  const sky = "#1F2542";
  const floorA = "#3A3A41";
  const floorB = "#46434B";
  const rib = "#3A4158";
  const far = [
    shape("sky", [[0, 0], [1280, 0], [1280, 420], [0, 420]], sky, "#171B30", "bgFar"),
    shape("dome", [[40, 360], [200, 80], [640, 20], [1080, 80], [1240, 360]], "none", rib, "bg", { open: true, organic: true }),
    shape("rib2", [[200, 400], [320, 140], [640, 70], [960, 140], [1080, 400]], "none", "#2C3348", "bgFar", { open: true, organic: true }),
    shape("pane", [[980, 60], [1040, 48], [1056, 110], [990, 124]], "#8FB8C4", "#6A909C", "bgFar"),
  ];
  const stalls = [
    ["stall0", 80, "#8E5550"],
    ["stall1", 300, "#58435C"],
    ["stall2", 520, "#2F5A5A"],
    ["stall3", 740, "#8E5550"],
    ["stall4", 960, "#58435C"],
  ];
  const mid = stalls.map(([id, x, cloth], index) => {
    const shrink = index * 10;
    return shape(id, [
      [x + shrink, 250 + index * 6],
      [x + 180 - shrink, 236 + index * 6],
      [x + 200 - shrink, 430],
      [x + shrink * 0.4, 448],
    ], cloth, "#2A2428", "bg", { shadow: true });
  });
  mid.push(
    shape("jarA", [[180, 160], [210, 148], [224, 190], [198, 230], [168, 214], [164, 180]], "#FFC46B", "#C48A3A", "bg", { organic: true }),
    shape("jarB", [[420, 140], [454, 128], [468, 176], [440, 220], [404, 200], [400, 164]], "#7FE6E0", "#4AA8A4", "bg", { organic: true }),
    shape("jarC", [[700, 150], [732, 138], [746, 184], [716, 224], [684, 206], [680, 170]], "#FFC46B", "#C48A3A", "bg", { organic: true }),
    shape("jarD", [[980, 132], [1016, 120], [1030, 168], [998, 214], [962, 196], [958, 156]], "#7FE6E0", "#4AA8A4", "bg", { organic: true }),
    shape("string", [[160, 80], [200, 160]], "none", "#6A6458", "bgDetail", { open: true }),
    shape("stringB", [[400, 70], [440, 140]], "none", "#6A6458", "bgDetail", { open: true }),
    shape("stringC", [[680, 74], [720, 150]], "none", "#6A6458", "bgDetail", { open: true }),
    shape("stringD", [[960, 64], [1000, 132]], "none", "#6A6458", "bgDetail", { open: true }),
  );
  const floor = [];
  for (let i = 0; i < 5; i += 1) {
    const y0 = 430 + i * 58;
    const y1 = y0 + 58;
    floor.push(shape(`lane${i}`, [[0, y0], [1280, y0], [1280, y1], [0, y1]], i % 2 ? floorB : floorA, "#2A282E", "bg"));
  }
  const near = [
    shape("crate", [[40, 560], [180, 548], [200, 680], [28, 696]], "#6A4A32", "#4A321F", "prop"),
  ];
  return [
    layer("sky_wall", 0.22, far),
    layer("main_set", 0.7, mid),
    layer("floor", 1, floor),
    layer("foreground", 1.12, near),
  ];
}

export { kitchenPlate, garagePlate, marketPlate };
