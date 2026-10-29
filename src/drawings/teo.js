// Teo Lind model sheet. Contours are hand-placed cubics. Proportions follow the
// art bible: 4.75 heads, capsule skull, goggle eyes, curl crown, overalls.

import { smoothClosed, smoothOpen } from "../curves.js";

const INK = "#221D26";
const SKIN = "#EBC3A0";
const HAIR = "#9A4E2C";
const SHIRT = "#8E9092";
const OVERALL = "#66704A";
const BUCKLE = "#B9A46A";
const BOOT = "#7A5233";
const SCLERA = "#F4F0E4";

const TOP = 56;
const HH = 168;
const yH = (h) => TOP + h * HH;
const W = 0.78 * HH;
const CX = 300;

const Y = {
  eye: yH(0.4),
  nose: yH(0.56),
  mouth: yH(0.8),
  chin: yH(1),
  shoulder: yH(1.25),
  waist: yH(2.42),
  crotch: yH(2.95),
  finger: yH(3.2),
  knee: yH(3.72),
  ankle: yH(4.4),
  sole: yH(4.62),
};

function circlePath(cx, cy, r) {
  const k = r * 0.5523;
  const n = (v) => v.toFixed(1);
  return [
    `M${n(cx)} ${n(cy - r)}`,
    `C${n(cx + k)} ${n(cy - r)} ${n(cx + r)} ${n(cy - k)} ${n(cx + r)} ${n(cy)}`,
    `C${n(cx + r)} ${n(cy + k)} ${n(cx + k)} ${n(cy + r)} ${n(cx)} ${n(cy + r)}`,
    `C${n(cx - k)} ${n(cy + r)} ${n(cx - r)} ${n(cy + k)} ${n(cx - r)} ${n(cy)}`,
    `C${n(cx - r)} ${n(cy - k)} ${n(cx - k)} ${n(cy - r)} ${n(cx)} ${n(cy - r)}Z`,
  ].join("");
}

function ring(id, pts, fill, line = "contour", extra = {}) {
  return {
    id,
    type: "path",
    path: extra.open ? smoothOpen(pts) : smoothClosed(pts),
    fill: extra.open ? "none" : fill,
    stroke: INK,
    strokeWidth: 0,
    line: extra.open ? extra.line || "interior" : line,
    shadow: extra.shadow === true,
    ...(extra.role ? { role: extra.role } : {}),
  };
}

function disc(id, cx, cy, r, fill, line = "contour", extra = {}) {
  return {
    id,
    type: "path",
    path: circlePath(cx, cy, r),
    fill,
    stroke: INK,
    strokeWidth: 0,
    line,
    shadow: false,
    ...(extra.role ? { role: extra.role } : {}),
  };
}

function move(pts, dx, dy) {
  return pts.map(([x, y]) => [x + dx, y + dy]);
}

function sheet(view, pose, shapes, feet, crown = TOP, chin = Y.chin) {
  const footY = Math.max(...feet.map((foot) => foot[1]));
  return {
    character: "teo",
    view,
    pose,
    width: 640,
    height: footY + 6,
    feet,
    crown,
    chin,
    shapes,
  };
}

function goggle(prefix, cx, cy, r, pupilShift = 0) {
  const lidY = cy - r * 0.08;
  return [
    disc(`${prefix}Eye`, cx, cy, r, SCLERA, "eye", { role: "eye" }),
    ring(
      `${prefix}Lid`,
      [
        [cx - r * 0.96, lidY],
        [cx - r * 0.55, cy - r * 0.98],
        [cx, cy - r * 1.05],
        [cx + r * 0.55, cy - r * 0.98],
        [cx + r * 0.96, lidY],
        [cx + r * 0.2, lidY + r * 0.08],
        [cx - r * 0.2, lidY + r * 0.08],
      ],
      SKIN,
      "contour",
    ),
    ring(
      `${prefix}LidLine`,
      [
        [cx - r * 0.9, lidY],
        [cx, lidY + r * 0.12],
        [cx + r * 0.9, lidY],
      ],
      "none",
      "interior",
      { open: true },
    ),
    disc(`${prefix}Pupil`, cx + pupilShift, cy + r * 0.22, Math.max(3.2, r * 0.22), INK, "eye", { role: "pupil" }),
  ];
}

function hand(id, origin, pose) {
  const [x, y] = origin;
  const relaxed = [
    [x + 2, y],
    [x - 12, y + 14],
    [x - 16, y + 40],
    [x - 14, y + 66],
    [x - 6, y + 78],
    [x + 4, y + 72],
    [x + 6, y + 58],
    [x + 10, y + 70],
    [x + 16, y + 62],
    [x + 12, y + 36],
    [x + 22, y + 42],
    [x + 24, y + 24],
    [x + 12, y + 6],
  ];
  const point = [
    [x + 2, y],
    [x - 12, y + 16],
    [x - 14, y + 40],
    [x - 2, y + 48],
    [x + 8, y + 36],
    [x + 6, y + 52],
    [x + 4, y + 86],
    [x + 16, y + 90],
    [x + 18, y + 52],
    [x + 16, y + 34],
    [x + 26, y + 40],
    [x + 24, y + 18],
    [x + 10, y + 4],
  ];
  const grip = [
    [x + 4, y + 2],
    [x - 10, y + 16],
    [x - 12, y + 36],
    [x, y + 30],
    [x + 4, y + 46],
    [x + 14, y + 32],
    [x + 18, y + 48],
    [x + 26, y + 30],
    [x + 22, y + 14],
    [x + 34, y + 22],
    [x + 32, y + 6],
    [x + 16, y],
  ];
  const open = [
    [x + 4, y],
    [x - 14, y + 18],
    [x - 28, y + 48],
    [x - 22, y + 70],
    [x - 10, y + 52],
    [x - 8, y + 78],
    [x + 6, y + 82],
    [x + 8, y + 50],
    [x + 16, y + 80],
    [x + 30, y + 74],
    [x + 22, y + 44],
    [x + 34, y + 58],
    [x + 46, y + 46],
    [x + 28, y + 22],
    [x + 14, y + 4],
  ];
  const poses = { relaxed, point, grip, open };
  return ring(id, poses[pose] || relaxed, SKIN, "contour", { role: "hand" });
}

function gripTool(id, origin) {
  const [x, y] = origin;
  return ring(id, [
    [x + 6, y - 28],
    [x + 16, y - 26],
    [x + 18, y + 36],
    [x + 14, y + 58],
    [x + 4, y + 56],
    [x + 8, y + 34],
  ], "#C4553A", "prop");
}

const frontCurls = [
  [268, 78, 16],
  [292, 58, 18],
  [318, 50, 20],
  [346, 58, 18],
  [370, 80, 16],
  [252, 96, 14],
  [388, 98, 14],
];

function frontHead(dx = 0, dy = 0) {
  const c = CX + dx;
  const t = TOP + dy;
  const chin = Y.chin + dy;
  const head = [
    [c, t + 8],
    [c + 28, t + 4],
    [c + 52, t + 28],
    [c + 64, t + 70],
    [c + 60, t + 112],
    [c + 40, chin - t - 18 + t],
    [c + 16, chin - 4],
    [c, chin + 2],
    [c - 16, chin - 4],
    [c - 40, chin - t - 18 + t],
    [c - 60, t + 112],
    [c - 64, t + 70],
    [c - 52, t + 28],
    [c - 28, t + 4],
  ];
  const beard = [
    [c - 48, t + 108],
    [c - 36, t + 146],
    [c - 14, chin + 10],
    [c, chin + 16],
    [c + 14, chin + 10],
    [c + 36, t + 146],
    [c + 48, t + 108],
    [c + 18, t + 124],
    [c, t + 132],
    [c - 18, t + 124],
  ];
  const eyeR = 0.36 * W * 0.5;
  return [
    ring("head", head, SKIN, "contour", { role: "head" }),
    ring("beard", beard, HAIR),
    ring("earL", move([[c - 66, t + 78], [c - 82, t + 96], [c - 76, t + 122], [c - 58, t + 116], [c - 58, t + 92]], 0, 0), SKIN),
    ring("earR", [[c + 66, t + 78], [c + 82, t + 96], [c + 76, t + 122], [c + 58, t + 116], [c + 58, t + 92]], SKIN),
    ...goggle("far", c - eyeR - 1, Y.eye + dy, eyeR, -1),
    ...goggle("near", c + eyeR + 1, Y.eye + dy, eyeR, 1),
    ring("browL", [[c - 52, Y.eye + dy - eyeR - 12], [c - 24, Y.eye + dy - eyeR - 18], [c - 4, Y.eye + dy - eyeR - 10]], "none", "interior", { open: true }),
    ring("browR", [[c + 4, Y.eye + dy - eyeR - 10], [c + 24, Y.eye + dy - eyeR - 18], [c + 52, Y.eye + dy - eyeR - 12]], "none", "interior", { open: true }),
    ring("nose", [[c + 6, Y.nose + dy - 16], [c + 16, Y.nose + dy], [c + 4, Y.nose + dy + 12]], "none", "interior", { open: true }),
    ring("mouth", [[c - 22, Y.mouth + dy], [c, Y.mouth + dy + 6], [c + 22, Y.mouth + dy]], "none", "mouth", { open: true, line: "mouth" }),
    ...frontCurls.map(([x, y, r], i) => disc(`curl${i}`, x + dx, y + dy, r, HAIR, "contour", { role: i === 2 ? "hair" : undefined })),
  ];
}

function torsoFront() {
  const s = Y.shoulder;
  return [
    ring("sleeveL", [
      [CX - 72, s], [CX - 102, s + 16], [CX - 118, s + 62], [CX - 108, s + 78],
      [CX - 92, s + 148], [CX - 74, s + 156], [CX - 86, s + 78], [CX - 62, s + 18],
    ], SHIRT),
    ring("cuffL", [[CX - 96, s + 136], [CX - 76, s + 140], [CX - 78, s + 154], [CX - 98, s + 150]], SHIRT, "interior", { open: true }),
    ring("sleeveR", [
      [CX + 72, s + 2], [CX + 104, s + 18], [CX + 116, s + 64], [CX + 106, s + 80],
      [CX + 90, s + 150], [CX + 72, s + 158], [CX + 84, s + 80], [CX + 60, s + 20],
    ], SHIRT),
    ring("cuffR", [[CX + 94, s + 138], [CX + 74, s + 142], [CX + 76, s + 156], [CX + 96, s + 152]], SHIRT, "interior", { open: true }),
    ring("shirt", [
      [CX - 88, s + 6], [CX - 36, s - 18], [CX, s - 24], [CX + 36, s - 18], [CX + 88, s + 6],
      [CX + 96, Y.waist - 36], [CX + 70, Y.waist + 18], [CX - 70, Y.waist + 20], [CX - 96, Y.waist - 34],
    ], SHIRT, "contour", { shadow: true }),
    ring("shoulder", [[CX - 78, s + 2], [CX - 20, s - 8], [CX + 20, s - 8], [CX + 78, s + 2]], "none", "interior", { open: true }),
    ring("bib", [
      [CX - 36, Y.waist - 70], [CX + 36, Y.waist - 70], [CX + 42, Y.waist + 6], [CX - 42, Y.waist + 6],
    ], OVERALL, "contour", { shadow: true }),
    ring("strapL", [[CX - 34, Y.waist - 68], [CX - 28, s + 6], [CX - 14, s - 4], [CX - 18, Y.waist - 64]], OVERALL),
    ring("strapR", [[CX + 34, Y.waist - 68], [CX + 28, s + 6], [CX + 14, s - 4], [CX + 18, Y.waist - 64]], OVERALL),
    ring("buckleL", [[CX - 32, Y.waist - 62], [CX - 16, Y.waist - 62], [CX - 16, Y.waist - 46], [CX - 32, Y.waist - 46]], BUCKLE, "prop"),
    ring("buckleR", [[CX + 16, Y.waist - 62], [CX + 32, Y.waist - 62], [CX + 32, Y.waist - 46], [CX + 16, Y.waist - 46]], BUCKLE, "prop"),
    ring("waist", [[CX - 46, Y.waist], [CX, Y.waist + 6], [CX + 46, Y.waist]], "none", "interior", { open: true }),
  ];
}

function leg(id, side) {
  const s = side < 0 ? -1 : 1;
  const hip = CX + s * 18;
  return [
    ring(id, [
      [CX + s * 6, Y.waist - 4],
      [hip + s * 34, Y.waist + 16],
      [hip + s * 38, Y.knee - 24],
      [hip + s * 46, Y.knee + 10],
      [hip + s * 34, Y.knee + 36],
      [hip + s * 28, Y.ankle - 8],
      [hip - s * 10, Y.ankle - 4],
      [hip - s * 4, Y.knee + 20],
      [hip - s * 16, Y.knee - 18],
      [CX + s * 2, Y.crotch + 8],
    ], OVERALL, "contour", { shadow: true }),
    ring(`${id}Knee`, [[hip + s * 40, Y.knee + 4], [hip + s * 8, Y.knee + 16], [hip - s * 10, Y.knee + 6]], "none", "interior", { open: true }),
    ring(`${id}Hem`, [[hip + s * 26, Y.ankle - 14], [hip + s * 4, Y.ankle - 10], [hip - s * 8, Y.ankle - 14]], "none", "interior", { open: true }),
    ring(`${id}Boot`, [
      [hip - s * 8, Y.ankle - 12],
      [hip - s * 18, Y.ankle + 8],
      [hip - s * 14, Y.sole - 6],
      [hip - s * 28, Y.sole + 4],
      [hip + s * 36, Y.sole + 6],
      [hip + s * 42, Y.sole - 8],
      [hip + s * 22, Y.ankle + 2],
      [hip + s * 10, Y.ankle - 14],
    ], BOOT),
  ];
}

function frontStand() {
  return sheet("front", "stand", [
    ...leg("legL", -1),
    ...leg("legR", 1),
    ...torsoFront(),
    hand("handL", [CX - 104, Y.shoulder + 150], "relaxed"),
    hand("handR", [CX + 62, Y.shoulder + 150], "relaxed"),
    ring("neck", [
      [CX - 22, Y.chin - 6], [CX, Y.chin - 12], [CX + 22, Y.chin - 6],
      [CX + 28, Y.shoulder + 8], [CX - 28, Y.shoulder + 8],
    ], SKIN),
    ring("crotch", [[CX, Y.crotch - 6], [CX, Y.crotch + 28]], "none", "interior", { open: true }),
    ...frontHead(),
  ], [[CX - 58, Y.sole], [CX + 58, Y.sole]]);
}

function quarterHead() {
  const c = 300;
  const t = TOP;
  const noseBreak = 0.07 * HH;
  return [
    ring("head", [
      [c - 20, t + 6],
      [c + 24, t + 2],
      [c + 58, t + 36],
      [c + 70, t + 84],
      [c + 62, t + 120],
      [c + 70 + noseBreak, Y.nose - 8],
      [c + 58, Y.nose + 16],
      [c + 36, Y.chin - 16],
      [c + 8, Y.chin + 2],
      [c - 24, Y.chin - 10],
      [c - 48, t + 120],
      [c - 58, t + 70],
      [c - 40, t + 24],
    ], SKIN, "contour", { role: "head" }),
    ring("beard", [
      [c - 10, t + 116], [c + 16, t + 140], [c + 28, Y.chin + 8], [c + 4, Y.chin + 14],
      [c - 22, t + 140], [c - 8, t + 124],
    ], HAIR),
    ...goggle("far", c - 6, Y.eye, 0.36 * W * 0.5 * 0.7, 0),
    ...goggle("near", c + 36, Y.eye + 2, 0.36 * W * 0.5, 1),
    ring("browF", [[c - 28, Y.eye - 28], [c - 8, Y.eye - 34], [c + 8, Y.eye - 26]], "none", "interior", { open: true }),
    ring("browN", [[c + 16, Y.eye - 30], [c + 40, Y.eye - 38], [c + 58, Y.eye - 26]], "none", "interior", { open: true }),
    ring("mouth", [[c + 8, Y.mouth], [c + 28, Y.mouth + 5], [c + 44, Y.mouth - 2]], "none", "mouth", { open: true, line: "mouth" }),
    disc("curl0", 250, 70, 14, HAIR),
    disc("curl1", 274, 42, 16, HAIR),
    disc("curl2", 306, 28, 18, HAIR, "contour", { role: "hair" }),
    disc("curl3", 338, 40, 16, HAIR),
    disc("curl4", 362, 68, 14, HAIR),
  ];
}

function quarterStand() {
  return sheet("threeQuarter", "stand", [
    ...leg("legL", -1),
    ...leg("legR", 1),
    ...torsoFront(),
    hand("handL", [CX - 104, Y.shoulder + 150], "relaxed"),
    hand("handR", [CX + 62, Y.shoulder + 150], "relaxed"),
    ring("neck", [
      [CX - 16, Y.chin - 4], [CX + 18, Y.chin - 8], [CX + 28, Y.shoulder + 6], [CX - 24, Y.shoulder + 8],
    ], SKIN),
    ...quarterHead(),
  ], [[CX - 58, Y.sole], [CX + 58, Y.sole]]);
}

function profileHead(dy = 0) {
  const t = TOP + dy;
  const chin = Y.chin + dy;
  return [
    disc("curl0", 258, 108 + dy, 15, HAIR),
    disc("curl1", 286, 90 + dy, 17, HAIR),
    disc("curl2", 316, 84 + dy, 18, HAIR),
    disc("curl3", 342, 100 + dy, 16, HAIR),
    disc("curl4", 242, 124 + dy, 13, HAIR),
    ring("head", [
      [286, t + 10],
      [318, t + 28],
      [332, t + 70],
      [336, t + 108],
      [348, Y.nose + dy - 6],
      [328, Y.nose + dy + 14],
      [334, Y.mouth + dy - 6],
      [324, chin - 8],
      [300, chin + 2],
      [272, chin - 12],
      [248, t + 130],
      [236, t + 80],
      [250, t + 36],
    ], SKIN, "contour", { role: "head" }),
    ring("beard", [
      [300, t + 130], [292, t + 156], [312, chin + 8], [330, chin - 6], [316, t + 140],
    ], HAIR),
    ...goggle("near", 318, Y.eye + dy, 0.36 * W * 0.5 * 0.8, 2),
    ring("browN", [[300, Y.eye + dy - 26], [322, Y.eye + dy - 32], [340, Y.eye + dy - 22]], "none", "interior", { open: true }),
    ring("mouth", [[326, Y.mouth + dy - 4], [338, Y.mouth + dy + 2], [330, Y.mouth + dy + 8]], "none", "mouth", { open: true, line: "mouth" }),
  ];
}

function profileBody(dy, legF, legB, arm) {
  const hip = Y.crotch + dy;
  const chest = [
    [250, Y.shoulder + dy],
    [300, Y.shoulder + dy - 16],
    [332, Y.shoulder + dy + 10],
    [324, Y.waist + dy - 20],
    [300, Y.waist + dy + 6],
    [260, Y.waist + dy + 4],
    [242, Y.shoulder + dy + 40],
  ];
  const legShape = (id, spec) => ring(id, [
    [spec.hipX - 10, hip],
    [spec.hipX + spec.kneeOut - 18, spec.kneeY],
    [spec.ankleX - 20, spec.ankleY],
    [spec.toeX, spec.toeY],
    [spec.heelX, spec.heelY],
    [spec.ankleX + 18, spec.ankleY - 6],
    [spec.hipX + spec.kneeIn + 16, spec.kneeY - 8],
    [spec.hipX + 22, hip + 10],
  ], OVERALL, "contour", { shadow: true });
  return [
    legShape("legB", legB),
    ring("bootB", [
      [Math.min(legB.heelX, legB.toeX) - 4, Math.max(legB.heelY, legB.toeY) - 28],
      [Math.min(legB.heelX, legB.toeX) - 8, Math.max(legB.heelY, legB.toeY) - 8],
      [Math.min(legB.heelX, legB.toeX), Math.max(legB.heelY, legB.toeY)],
      [Math.max(legB.heelX, legB.toeX) + 14, Math.max(legB.heelY, legB.toeY)],
      [Math.max(legB.heelX, legB.toeX) + 8, Math.max(legB.heelY, legB.toeY) - 16],
      [(legB.heelX + legB.toeX) / 2, Math.max(legB.heelY, legB.toeY) - 30],
    ], BOOT),
    legShape("legF", legF),
    ring("kneeF", [[legF.ankleX, legF.kneeY - 4], [legF.hipX + legF.kneeOut + 8, legF.kneeY + 6]], "none", "interior", { open: true }),
    ring("bootF", [
      [Math.min(legF.heelX, legF.toeX) - 6, Math.max(legF.heelY, legF.toeY) - 30],
      [Math.min(legF.heelX, legF.toeX) - 10, Math.max(legF.heelY, legF.toeY) - 8],
      [Math.min(legF.heelX, legF.toeX), Math.max(legF.heelY, legF.toeY)],
      [Math.max(legF.heelX, legF.toeX) + 16, Math.max(legF.heelY, legF.toeY) + 2],
      [Math.max(legF.heelX, legF.toeX) + 10, Math.max(legF.heelY, legF.toeY) - 16],
      [(legF.heelX + legF.toeX) / 2, Math.max(legF.heelY, legF.toeY) - 32],
    ], BOOT),
    ring("shirt", chest, SHIRT, "contour", { shadow: true }),
    ring("bib", [[286, Y.waist + dy - 64], [324, Y.waist + dy - 58], [318, Y.waist + dy + 4], [280, Y.waist + dy]], OVERALL),
    ring("hip", [
      [262, Y.waist + dy - 6],
      [336, Y.waist + dy - 2],
      [348, hip + 28],
      [248, hip + 32],
    ], OVERALL, "contour", { shadow: true }),
    ring("strap", [[292, Y.waist + dy - 60], [308, Y.shoulder + dy], [322, Y.shoulder + dy + 6], [300, Y.waist + dy - 52]], OVERALL),
    ring("sleeve", [
      [324, Y.shoulder + dy + 12],
      [348 + arm, Y.shoulder + dy + 50],
      [360 + arm, Y.shoulder + dy + 130],
      [338 + arm, Y.shoulder + dy + 142],
      [328 + arm * 0.3, Y.shoulder + dy + 60],
      [308, Y.shoulder + dy + 16],
    ], SHIRT),
    ring("cuff", [[352 + arm, Y.shoulder + dy + 124], [338 + arm, Y.shoulder + dy + 140]], "none", "interior", { open: true }),
    hand("handF", [336 + arm, Y.shoulder + dy + 136], "relaxed"),
    ring("neck", [
      [292, Y.chin + dy - 8], [324, Y.chin + dy - 4], [318, Y.shoulder + dy + 4], [280, Y.shoulder + dy + 2],
    ], SKIN),
    ...profileHead(dy),
  ];
}

function profilePose(pose, dy, legF, legB, arm) {
  const toe = Math.max(legF.toeY, legB.toeY, legF.heelY, legB.heelY);
  return sheet("profile", pose, profileBody(dy, legF, legB, arm), [
    [legB.heelX, toe],
    [legF.heelX, toe],
  ], TOP + dy, Y.chin + dy);
}

const standLegF = { hipX: 300, kneeOut: 16, kneeIn: 4, kneeY: Y.knee, ankleX: 318, ankleY: Y.ankle, heelX: 300, heelY: Y.sole, toeX: 356, toeY: Y.sole };
const standLegB = { hipX: 274, kneeOut: -6, kneeIn: 8, kneeY: Y.knee + 4, ankleX: 268, ankleY: Y.ankle, heelX: 250, heelY: Y.sole, toeX: 302, toeY: Y.sole };

function profileStand() {
  return profilePose("stand", 0, standLegF, standLegB, 0);
}

function walk() {
  const sole = Y.sole;
  const contactF = { hipX: 292, kneeOut: 8, kneeIn: -4, kneeY: Y.knee - 6, ankleX: 360, ankleY: Y.ankle - 8, heelX: 348, heelY: sole, toeX: 392, toeY: sole - 18 };
  const contactB = { hipX: 270, kneeOut: -20, kneeIn: -6, kneeY: Y.knee + 10, ankleX: 214, ankleY: Y.ankle - 16, heelX: 196, heelY: sole - 22, toeX: 236, toeY: sole };
  const downF = { hipX: 300, kneeOut: 22, kneeIn: 6, kneeY: Y.knee + 28, ankleX: 336, ankleY: Y.ankle + 8, heelX: 318, heelY: sole + 16, toeX: 372, toeY: sole + 16 };
  const downB = { hipX: 274, kneeOut: -8, kneeIn: 4, kneeY: Y.knee + 18, ankleX: 236, ankleY: Y.ankle - 6, heelX: 220, heelY: sole + 4, toeX: 258, toeY: sole - 8 };
  const passF = { hipX: 286, kneeOut: 26, kneeIn: 10, kneeY: Y.knee - 36, ankleX: 300, ankleY: Y.ankle - 28, heelX: 292, heelY: sole - 36, toeX: 324, toeY: sole - 46 };
  const passB = { hipX: 278, kneeOut: 4, kneeIn: 2, kneeY: Y.knee - 10, ankleX: 286, ankleY: Y.ankle - 8, heelX: 270, heelY: sole - 12, toeX: 324, toeY: sole - 12 };
  const upF = { hipX: 284, kneeOut: 6, kneeIn: -2, kneeY: Y.knee - 20, ankleX: 346, ankleY: Y.ankle - 30, heelX: 338, heelY: sole - 28, toeX: 378, toeY: sole - 40 };
  const upB = { hipX: 276, kneeOut: -10, kneeIn: 2, kneeY: Y.knee + 4, ankleX: 246, ankleY: Y.ankle - 8, heelX: 232, heelY: sole - 6, toeX: 270, toeY: sole };
  const contactRF = { hipX: 286, kneeOut: -16, kneeIn: -4, kneeY: Y.knee + 8, ankleX: 230, ankleY: Y.ankle - 10, heelX: 214, heelY: sole, toeX: 258, toeY: sole - 16 };
  const contactRB = { hipX: 304, kneeOut: 18, kneeIn: 4, kneeY: Y.knee - 4, ankleX: 372, ankleY: Y.ankle - 14, heelX: 360, heelY: sole - 20, toeX: 398, toeY: sole };
  return [
    profilePose("contact", 4, contactF, contactB, -46),
    profilePose("down", 32, downF, downB, -10),
    profilePose("pass", -24, passF, passB, 6),
    profilePose("up", -12, upF, upB, 36),
    profilePose("contactR", 4, contactRF, contactRB, 42),
  ];
}

function chairAndSit() {
  const body = [
    ring("thighL", [
      [318, 528], [286, 548], [272, 610], [268, 668], [318, 682], [346, 640], [352, 560],
    ], OVERALL, "contour", { shadow: true }),
    ring("shinL", [
      [274, 662], [322, 678], [308, 848], [258, 852], [262, 700],
    ], OVERALL),
    ring("bootL", [[248, 836], [236, 864], [252, 886], [332, 884], [336, 856], [300, 834]], BOOT),
    ring("thighR", [
      [352, 524], [390, 546], [412, 612], [418, 668], [372, 684], [340, 640], [338, 558],
    ], OVERALL, "contour", { shadow: true }),
    ring("shinR", [
      [390, 662], [424, 676], [430, 848], [378, 854], [372, 700],
    ], OVERALL),
    ring("bootR", [[368, 836], [360, 864], [378, 888], [458, 884], [460, 854], [420, 832]], BOOT),
    ring("kneeL", [[270, 656], [296, 678], [322, 662]], "none", "interior", { open: true }),
    ring("kneeR", [[390, 654], [418, 676], [400, 686]], "none", "interior", { open: true }),
    ring("shirt", [
      [286, 360], [330, 348], [392, 356], [400, 470], [360, 545], [300, 548], [268, 470], [274, 390],
    ], SHIRT, "contour", { shadow: true }),
    ring("bib", [[318, 430], [378, 428], [372, 520], [312, 524]], OVERALL),
    ring("strapL", [[322, 432], [308, 368], [334, 356], [338, 430]], OVERALL),
    ring("strapR", [[370, 430], [386, 366], [360, 354], [352, 428]], OVERALL),
    ring("sleeveL", [[280, 372], [246, 410], [228, 490], [250, 502], [268, 430], [300, 378]], SHIRT),
    ring("sleeveR", [[394, 370], [430, 412], [448, 492], [424, 506], [408, 430], [376, 376]], SHIRT),
    hand("handL", [214, 490], "relaxed"),
    hand("handR", [400, 488], "relaxed"),
    ring("neck", [[320, 348], [368, 346], [360, 382], [312, 384]], SKIN),
    disc("curl0", 300, 250, 14, HAIR),
    disc("curl1", 328, 232, 17, HAIR),
    disc("curl2", 358, 236, 16, HAIR),
    disc("curl3", 382, 258, 13, HAIR),
    ring("head", [
      [318, 246], [352, 240], [386, 262], [398, 300], [414, 324], [400, 342],
      [386, 356], [360, 366], [336, 364], [314, 348], [304, 310], [306, 270],
    ], SKIN, "contour", { role: "head" }),
    ring("beard", [[324, 348], [316, 370], [340, 392], [372, 390], [388, 368], [372, 348], [348, 356]], HAIR),
    ...goggle("far", 336, 300, 16, 0),
    ...goggle("near", 372, 304, 20, 1),
    ring("noseBreak", [[392, 328], [404, 338], [388, 346]], "none", "interior", { open: true }),
    ring("mouth", [[360, 346], [378, 352], [390, 344]], "none", "mouth", { open: true, line: "mouth" }),
  ];
  return sheet("threeQuarter", "sit", body, [[280, 886], [420, 888]], 232, 366);
}

function handSheet() {
  return sheet("front", "hands", [
    hand("relaxed", [70, 80], "relaxed"),
    hand("point", [200, 80], "point"),
    gripTool("driver", [330, 90]),
    hand("grip", [340, 80], "grip"),
    hand("open", [500, 70], "open"),
  ], [[80, 200], [520, 200]], 40, 80);
}

export const TEO_SHEET = [
  frontStand(),
  quarterStand(),
  profileStand(),
  ...walk(),
  chairAndSit(),
  handSheet(),
];

export const TEO_CHAIR = [];
