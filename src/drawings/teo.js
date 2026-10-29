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
    [x - 16, y + 18],
    [x - 22, y + 40],
    [x - 24, y + 64],
    [x - 10, y + 52],
    [x - 8, y + 74],
    [x + 4, y + 54],
    [x + 6, y + 80],
    [x + 18, y + 56],
    [x + 14, y + 40],
    [x + 30, y + 50],
    [x + 22, y + 26],
    [x + 32, y + 16],
    [x + 16, y + 6],
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
    [c - 30, chin - 20],
    [c - 42, chin + 2],
    [c - 18, chin + 22],
    [c, chin + 28],
    [c + 18, chin + 22],
    [c + 42, chin + 2],
    [c + 30, chin - 20],
  ];
  const eyeR = 0.36 * W * 0.5;
  return [
    ring("head", head, SKIN, "contour", { role: "head" }),
    ring("beard", beard, HAIR, "contour", { role: "beard" }),
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
      [CX - 48, s + 18], [CX - 58, s + 16], [CX - 60, s + 48], [CX - 54, s + 90],
      [CX - 50, s + 140], [CX - 38, s + 146], [CX - 46, s + 80], [CX - 40, s + 26],
    ], SHIRT),
    ring("foldL", [[CX - 56, s + 52], [CX - 48, s + 64], [CX - 54, s + 76]], "none", "interior", { open: true }),
    ring("cuffL", [[CX - 52, s + 132], [CX - 40, s + 134], [CX - 40, s + 144], [CX - 52, s + 142]], SHIRT),
    ring("sleeveR", [
      [CX + 48, s + 18], [CX + 58, s + 16], [CX + 60, s + 48], [CX + 54, s + 90],
      [CX + 50, s + 140], [CX + 38, s + 146], [CX + 46, s + 80], [CX + 40, s + 26],
    ], SHIRT),
    ring("foldR", [[CX + 56, s + 52], [CX + 48, s + 64], [CX + 54, s + 76]], "none", "interior", { open: true }),
    ring("cuffR", [[CX + 40, s + 132], [CX + 52, s + 134], [CX + 52, s + 144], [CX + 40, s + 142]], SHIRT),
    ring("shirt", [
      [CX - 70, s + 16], [CX - 28, s + 4], [CX, s], [CX + 28, s + 4], [CX + 70, s + 16],
      [CX + 74, Y.waist - 28], [CX + 52, Y.waist + 10], [CX - 52, Y.waist + 12], [CX - 74, Y.waist - 26],
    ], SHIRT, "contour", { shadow: true }),
    ring("collar", [[CX - 16, s + 10], [CX, s + 28], [CX + 16, s + 10]], "none", "interior", { open: true }),
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
      [hip + s * 22, Y.waist + 16],
      [hip + s * 26, Y.knee - 24],
      [hip + s * 30, Y.knee + 10],
      [hip + s * 22, Y.knee + 36],
      [hip + s * 16, Y.ankle - 8],
      [hip - s * 6, Y.ankle - 4],
      [hip - s * 2, Y.knee + 20],
      [hip - s * 10, Y.knee - 18],
      [CX + s * 2, Y.crotch + 8],
    ], OVERALL, "contour", { shadow: true }),
    ring(`${id}Knee`, [[hip + s * 8, Y.knee + 2], [hip + s * 14, Y.knee + 10]], "none", "interior", { open: true }),
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
    hand("handL", [CX - 46, Y.shoulder + 140], "relaxed"),
    hand("handR", [CX + 46, Y.shoulder + 140], "relaxed"),
    ring("neck", [
      [CX - 14, Y.chin - 2], [CX, Y.chin - 8], [CX + 14, Y.chin - 2],
      [CX + 18, Y.shoulder + 10], [CX - 18, Y.shoulder + 10],
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
      [c - 46, t + 108],
      [c - 36, Y.chin - 16],
      [c - 16, Y.chin + 2],
      [c + 8, Y.chin + 10],
      [c + 30, Y.chin + 4],
      [c + 50, Y.mouth - 2],
      [c + 40, Y.mouth - 10],
      [c + 16, Y.mouth + 2],
      [c - 8, Y.mouth - 2],
      [c - 30, t + 118],
    ], HAIR, "contour", { role: "beard" }),
    ring("mouth", [[c + 2, Y.mouth - 2], [c + 14, Y.mouth + 2], [c + 22, Y.mouth - 2]], "none", "mouth", { open: true, line: "mouth" }),
    ...goggle("far", c - 6, Y.eye, 0.36 * W * 0.5 * 0.7, 0),
    ...goggle("near", c + 36, Y.eye + 2, 0.36 * W * 0.5, 1),
    ring("browF", [[c - 28, Y.eye - 28], [c - 8, Y.eye - 34], [c + 8, Y.eye - 26]], "none", "interior", { open: true }),
    ring("browN", [[c + 16, Y.eye - 30], [c + 40, Y.eye - 38], [c + 58, Y.eye - 26]], "none", "interior", { open: true }),
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
    hand("handL", [CX - 46, Y.shoulder + 140], "relaxed"),
    hand("handR", [CX + 46, Y.shoulder + 140], "relaxed"),
    ring("neck", [
      [CX - 12, Y.chin - 2], [CX + 14, Y.chin - 6], [CX + 18, Y.shoulder + 8], [CX - 16, Y.shoulder + 10],
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
      [292, t + 128], [286, t + 158], [308, chin + 10], [332, chin + 6], [338, t + 150], [324, t + 132],
    ], HAIR, "contour", { role: "beard" }),
    ...goggle("near", 318, Y.eye + dy, 0.36 * W * 0.5 * 0.8, 2),
    ring("browN", [[300, Y.eye + dy - 26], [322, Y.eye + dy - 32], [340, Y.eye + dy - 22]], "none", "interior", { open: true }),
    ring("mouth", [[326, Y.mouth + dy - 4], [338, Y.mouth + dy + 2], [330, Y.mouth + dy + 8]], "none", "mouth", { open: true, line: "mouth" }),
  ];
}

function profileBody(dy, legF, legB, arm) {
  const hip = Y.crotch + dy;
  const chest = [
    [246, Y.shoulder + dy + 18],
    [286, Y.shoulder + dy - 6],
    [322, Y.shoulder + dy + 8],
    [334, Y.waist + dy - 36],
    [346, Y.waist + dy + 6],
    [318, Y.waist + dy + 16],
    [258, Y.waist + dy + 12],
    [238, Y.shoulder + dy + 48],
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
    ring("hip", [
      [248, Y.shoulder + dy + 30],
      [318, Y.shoulder + dy + 18],
      [332, Y.waist + dy - 4],
      [316, hip + 6],
      [268, hip + 8],
      [242, Y.waist + dy + 6],
    ], OVERALL, "contour", { shadow: true }),
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
    ring("kneeF", [
      [legF.hipX + 4, legF.kneeY - 4],
      [legF.hipX + 10, legF.kneeY + 8],
    ], "none", "interior", { open: true }),
    ring("bootF", [
      [Math.min(legF.heelX, legF.toeX) - 6, Math.max(legF.heelY, legF.toeY) - 30],
      [Math.min(legF.heelX, legF.toeX) - 10, Math.max(legF.heelY, legF.toeY) - 8],
      [Math.min(legF.heelX, legF.toeX), Math.max(legF.heelY, legF.toeY)],
      [Math.max(legF.heelX, legF.toeX) + 16, Math.max(legF.heelY, legF.toeY) + 2],
      [Math.max(legF.heelX, legF.toeX) + 10, Math.max(legF.heelY, legF.toeY) - 16],
      [(legF.heelX + legF.toeX) / 2, Math.max(legF.heelY, legF.toeY) - 32],
    ], BOOT),
    ring("shirt", chest, SHIRT, "contour", { shadow: true }),
    ring("bib", [
      [300, Y.shoulder + dy + 22],
      [322, Y.shoulder + dy + 18],
      [324, Y.waist + dy - 22],
      [302, Y.waist + dy - 18],
    ], OVERALL),
    ring("strap", [[298, Y.shoulder + dy + 16], [308, Y.shoulder + dy - 4], [320, Y.shoulder + dy + 2], [314, Y.waist + dy - 24]], OVERALL),
    ring("sleeve", [
      [300, Y.shoulder + dy + 4],
      [318, Y.shoulder + dy - 2],
      [336 + arm * 0.35, Y.shoulder + dy + 36],
      [328 + arm * 0.45, Y.shoulder + dy + 58],
      [318 + arm * 0.2, Y.shoulder + dy + 132],
      [302 + arm * 0.15, Y.shoulder + dy + 138],
      [312, Y.shoulder + dy + 48],
      [292, Y.shoulder + dy + 16],
    ], SHIRT),
    ring("cuff", [[352 + arm, Y.shoulder + dy + 124], [338 + arm, Y.shoulder + dy + 140]], "none", "interior", { open: true }),
    hand("handF", [336 + arm, Y.shoulder + dy + 136], "relaxed"),
    ring("neck", [
      [306, Y.chin + dy - 6],
      [328, Y.chin + dy - 2],
      [346, Y.shoulder + dy + 16],
      [286, Y.shoulder + dy + 22],
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

function seated(name, talking) {
  const poseR = talking ? "open" : "relaxed";
  const body = [
    ring("shinL", [
      [312, 756], [336, 768], [340, 848], [308, 852], [292, 772],
    ], OVERALL, "contour", { shadow: true }),
    ring("bootL", [[300, 834], [288, 862], [306, 888], [372, 884], [368, 844], [334, 828]], BOOT),
    ring("shinR", [
      [430, 754], [454, 766], [458, 846], [426, 852], [410, 770],
    ], OVERALL),
    ring("bootR", [[418, 832], [408, 860], [428, 888], [492, 882], [488, 842], [450, 826]], BOOT),
    ring("thighL", [
      [356, 716], [332, 726], [308, 748], [304, 776], [334, 784], [360, 756], [372, 730],
    ], OVERALL, "contour", { shadow: true }),
    ring("thighR", [
      [388, 714], [420, 724], [448, 748], [444, 778], [414, 786], [388, 756], [376, 728],
    ], OVERALL, "contour", { shadow: true }),
    ring("kneeL", [[312, 746], [328, 762], [316, 774]], "none", "interior", { open: true }),
    ring("kneeR", [[436, 744], [452, 760], [440, 772]], "none", "interior", { open: true }),
    ring("shirt", [
      [330, 560], [368, 548], [406, 558], [412, 640], [396, 736], [344, 740], [324, 640],
    ], SHIRT, "contour", { shadow: true }),
    ring("collar", [[356, 556], [372, 578], [388, 554]], "none", "interior", { open: true }),
    ring("bib", [[350, 590], [394, 588], [388, 708], [346, 712]], OVERALL),
    ring("strapL", [[354, 594], [342, 564], [358, 552], [366, 592]], OVERALL),
    ring("strapR", [[390, 592], [404, 562], [386, 550], [378, 590]], OVERALL),
    ring("sleeveL", [
      [352, 572], [346, 628], [338, 700], [350, 706], [356, 636], [360, 578],
    ], SHIRT),
    ring("foldL", [[344, 626], [352, 640], [346, 652]], "none", "interior", { open: true }),
    ring("sleeveR", talking
      ? [[402, 566], [444, 522], [492, 500], [506, 520], [480, 534], [438, 548], [398, 574]]
      : [[380, 572], [388, 628], [396, 700], [384, 706], [376, 636], [372, 578]], SHIRT),
    ring("foldR", talking
      ? [[440, 528], [452, 540], [442, 550]]
      : [[384, 626], [392, 640], [386, 652]], "none", "interior", { open: true }),
    hand("handL", [318, 700], "relaxed"),
    hand("handR", talking ? [516, 496] : [430, 700], poseR),
    ring("neck", [[356, 520], [384, 516], [390, 560], [352, 564]], SKIN),
    disc("curl0", 330, 400, 13, HAIR),
    disc("curl1", 358, 384, 16, HAIR),
    disc("curl2", 388, 388, 15, HAIR),
    disc("curl3", 412, 410, 12, HAIR),
    ring("head", [
      [344, 392], [376, 384], [408, 406], [420, 450], [430, 478], [416, 502],
      [400, 516], [372, 524], [348, 512], [330, 482], [326, 440], [330, 410],
    ], SKIN, "contour", { role: "head" }),
    ring("beard", [
      [334, 464], [328, 496], [346, 520], [372, 528], [400, 516], [416, 492],
      [404, 480], [376, 496], [350, 488],
    ], HAIR, "contour", { role: "beard" }),
    ...goggle("far", 360, 450, 15, 0),
    ...goggle("near", 396, 454, 18, 1),
    ring("noseBreak", [[412, 480], [424, 490], [408, 498]], "none", "interior", { open: true }),
    ring("mouth", [[378, 496], [396, 502], [408, 494]], "none", "mouth", { open: true, line: "mouth" }),
  ];
  return sheet("threeQuarter", name, body, [[280, 888], [490, 888]], 384, 524);
}

function chairAndSit() {
  return [seated("sit", false), seated("sitTalk", true)];
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
  ...chairAndSit(),
  handSheet(),
];

export const TEO_CHAIR = [];
