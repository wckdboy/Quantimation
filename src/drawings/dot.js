// Dot Lind. Rectangle head, blunt bob, squared blazer, deadpan lids.
// 4.25 heads, crotch below the midpoint, hands hanging palm-in.

import { disc, goggle, ring, sheet } from "./ink.js";

const SKIN = "#8A5B3A";
const HAIR = "#211C24";
const BLAZER = "#4A6385";
const SHIRT = "#EDE3CC";
const PANTS = "#3B3E46";
const SHOE = "#1F1E23";
const TABLET = "#2C3038";
const SCREEN = "#6F7B8C";

const TOP = 64;
const HH = 150;
const yH = (h) => TOP + h * HH;
const CX = 320;

const Y = {
  eye: yH(0.42),
  nose: yH(0.62),
  mouth: yH(0.82),
  chin: yH(1),
  shoulder: yH(1.22),
  waist: yH(2.2),
  crotch: yH(2.62),
  knee: yH(3.32),
  ankle: yH(4.02),
  sole: yH(4.25),
};

function sideHand(id, x, y, pose) {
  const relaxed = [
    [x, y], [x - 12, y + 12], [x - 14, y + 36], [x - 10, y + 58],
    [x, y + 66], [x + 10, y + 58], [x + 8, y + 44], [x + 12, y + 58],
    [x + 18, y + 50], [x + 12, y + 28], [x + 22, y + 34], [x + 20, y + 16], [x + 8, y + 2],
  ];
  const grip = [
    [x + 2, y], [x - 10, y + 14], [x - 12, y + 34], [x, y + 28],
    [x + 2, y + 46], [x + 14, y + 30], [x + 16, y + 48], [x + 26, y + 28],
    [x + 20, y + 10], [x + 30, y + 16], [x + 24, y + 2], [x + 10, y],
  ];
  return ring(id, pose === "grip" ? grip : relaxed, SKIN, "contour", { role: "hand" });
}

function tablet(id, x, y, w, h) {
  return [
    ring(id, [[x, y], [x + w, y + 4], [x + w - 6, y + h], [x - 4, y + h - 6]], TABLET, "prop"),
    ring(`${id}Screen`, [[x + 8, y + 10], [x + w - 10, y + 12], [x + w - 16, y + h - 14], [x + 6, y + h - 16]], SCREEN, "prop"),
  ];
}

function frontHead() {
  const c = CX;
  const t = TOP;
  const head = [
    [c - 54, t + 10], [c - 66, t + 36], [c - 68, t + 90], [c - 62, t + 132],
    [c - 36, t + 150], [c, t + 154], [c + 36, t + 150], [c + 62, t + 132],
    [c + 68, t + 90], [c + 66, t + 36], [c + 54, t + 10], [c + 24, t + 2], [c, t], [c - 24, t + 2],
  ];
  const bob = [
    [c - 84, t + 48], [c - 90, t + 118], [c - 74, t + 146], [c - 58, t + 132],
    [c - 64, t + 40], [c - 28, t + 6], [c, t - 4], [c + 28, t + 6],
    [c + 64, t + 40], [c + 58, t + 132], [c + 74, t + 146], [c + 90, t + 118], [c + 84, t + 48],
  ];
  const fringe = [
    [c - 70, t + 28], [c - 20, t + 22], [c + 20, t + 22], [c + 70, t + 28],
    [c + 66, t + 42], [c + 16, t + 46], [c - 16, t + 46], [c - 66, t + 42],
  ];
  const r = 22;
  return [
    ring("bob", bob, HAIR, "contour", { role: "hair" }),
    ring("head", head, SKIN, "contour", { role: "head" }),
    ring("fringe", fringe, HAIR),
    ...goggle("far", c - 28, Y.eye, r, -1, SKIN, 0.28),
    ...goggle("near", c + 28, Y.eye, r, 1, SKIN, 0.28),
    ring("browL", [[c - 50, Y.eye - 30], [c - 28, Y.eye - 26], [c - 8, Y.eye - 30]], "none", "interior", { open: true }),
    ring("browR", [[c + 8, Y.eye - 30], [c + 28, Y.eye - 26], [c + 50, Y.eye - 30]], "none", "interior", { open: true }),
    ring("nose", [[c + 4, Y.nose - 10], [c + 12, Y.nose], [c + 2, Y.nose + 8]], "none", "interior", { open: true }),
    ring("mouth", [[c - 16, Y.mouth], [c, Y.mouth + 2], [c + 16, Y.mouth]], "none", "mouth", { open: true, line: "mouth" }),
  ];
}

function frontBody() {
  const s = Y.shoulder;
  return [
    ring("legL", [
      [CX - 8, Y.waist], [CX - 46, Y.waist + 10], [CX - 42, Y.knee], [CX - 28, Y.knee + 16],
      [CX - 22, Y.ankle], [CX + 4, Y.ankle], [CX - 2, Y.knee + 8], [CX - 6, Y.crotch],
    ], PANTS, "contour", { shadow: true }),
    ring("legR", [
      [CX + 8, Y.waist], [CX + 46, Y.waist + 10], [CX + 40, Y.knee], [CX + 26, Y.knee + 16],
      [CX + 20, Y.ankle], [CX - 6, Y.ankle], [CX + 2, Y.knee + 8], [CX + 6, Y.crotch],
    ], PANTS, "contour", { shadow: true }),
    ring("kneeL", [[CX - 36, Y.knee + 2], [CX - 10, Y.knee + 12]], "none", "interior", { open: true }),
    ring("kneeR", [[CX + 10, Y.knee + 2], [CX + 36, Y.knee + 12]], "none", "interior", { open: true }),
    ring("shoeL", [
      [CX - 28, Y.ankle - 4], [CX - 40, Y.sole - 8], [CX - 36, Y.sole + 4],
      [CX + 8, Y.sole + 2], [CX + 14, Y.sole - 10], [CX - 4, Y.ankle - 6],
    ], SHOE),
    ring("shoeR", [
      [CX + 4, Y.ankle - 4], [CX - 6, Y.sole - 6], [CX - 2, Y.sole + 4],
      [CX + 42, Y.sole + 2], [CX + 46, Y.sole - 12], [CX + 22, Y.ankle - 6],
    ], SHOE),
    ring("sleeveL", [
      [CX - 78, s], [CX - 108, s + 18], [CX - 118, s + 58], [CX - 104, s + 72],
      [CX - 90, s + 140], [CX - 72, s + 148], [CX - 84, s + 74], [CX - 64, s + 20],
    ], BLAZER),
    ring("sleeveR", [
      [CX + 78, s + 2], [CX + 110, s + 20], [CX + 116, s + 60], [CX + 102, s + 74],
      [CX + 88, s + 142], [CX + 70, s + 150], [CX + 82, s + 76], [CX + 62, s + 22],
    ], BLAZER),
    ring("blazer", [
      [CX - 92, s + 8], [CX - 40, s - 16], [CX, s - 22], [CX + 40, s - 16], [CX + 92, s + 8],
      [CX + 86, Y.waist - 10], [CX + 48, Y.waist + 16], [CX - 48, Y.waist + 18], [CX - 86, Y.waist - 8],
    ], BLAZER, "contour", { shadow: true }),
    ring("lapelL", [[CX - 18, s - 8], [CX - 8, Y.waist - 20], [CX - 22, Y.waist - 10]], "none", "interior", { open: true }),
    ring("lapelR", [[CX + 18, s - 8], [CX + 8, Y.waist - 20], [CX + 22, Y.waist - 10]], "none", "interior", { open: true }),
    ring("shirt", [
      [CX - 16, s + 6], [CX, s - 4], [CX + 16, s + 6], [CX + 10, Y.waist - 16], [CX - 10, Y.waist - 14],
    ], SHIRT),
    ring("neck", [
      [CX - 18, Y.chin - 4], [CX + 18, Y.chin - 4], [CX + 22, s + 6], [CX - 22, s + 6],
    ], SKIN),
    ...tablet("pad", CX - 156, s + 86, 58, 84),
    sideHand("handL", CX - 118, s + 112, "grip"),
    sideHand("handR", CX + 64, s + 142, "relaxed"),
  ];
}

function frontStand() {
  return sheet("dot", "front", "stand", [...frontBody(), ...frontHead()], [[CX - 30, Y.sole], [CX + 36, Y.sole]], TOP, Y.chin);
}

function quarterStand() {
  const c = 330;
  const t = TOP;
  const s = Y.shoulder;
  const shapes = [
    ring("legB", [
      [c - 10, Y.waist], [c - 36, Y.waist + 16], [c - 30, Y.knee + 8], [c - 16, Y.ankle], [c + 6, Y.ankle], [c - 4, Y.crotch],
    ], PANTS, "contour", { shadow: true }),
    ring("legF", [
      [c + 8, Y.waist], [c + 40, Y.waist + 12], [c + 34, Y.knee], [c + 18, Y.ankle], [c - 4, Y.ankle], [c + 4, Y.crotch],
    ], PANTS, "contour", { shadow: true }),
    ring("shoeB", [[c - 28, Y.ankle], [c - 34, Y.sole + 2], [c + 8, Y.sole], [c + 4, Y.ankle]], SHOE),
    ring("shoeF", [[c + 6, Y.ankle - 2], [c - 2, Y.sole + 2], [c + 40, Y.sole], [c + 44, Y.sole - 12], [c + 20, Y.ankle]], SHOE),
    ring("sleeve", [
      [c + 70, s], [c + 108, s + 24], [c + 112, s + 64], [c + 96, s + 78], [c + 82, s + 146], [c + 64, s + 152], [c + 78, s + 80], [c + 52, s + 18],
    ], BLAZER),
    ring("blazer", [
      [c - 70, s + 10], [c - 20, s - 8], [c + 36, s - 18], [c + 86, s + 8],
      [c + 78, Y.waist], [c + 36, Y.waist + 18], [c - 40, Y.waist + 14], [c - 64, Y.waist - 6],
    ], BLAZER, "contour", { shadow: true }),
    ring("shirt", [[c + 8, s + 4], [c + 28, s - 2], [c + 24, Y.waist - 20], [c + 4, Y.waist - 12]], SHIRT),
    ring("lapel", [[c + 10, s], [c + 22, Y.waist - 24], [c + 6, Y.waist - 16]], "none", "interior", { open: true }),
    ring("neck", [[c - 4, Y.chin - 2], [c + 28, Y.chin + 4], [c + 24, s + 8], [c - 8, s + 4]], SKIN),
    sideHand("handB", c - 78, s + 150, "relaxed"),
    ...tablet("pad", c + 28, s + 108, 46, 64),
    sideHand("handF", c + 22, s + 118, "grip"),
    ring("bob", [
      [c - 42, t + 40], [c - 12, t + 8], [c + 24, t], [c + 56, t + 16], [c + 62, t + 42],
      [c + 18, t + 34], [c - 8, t + 30], [c - 34, t + 64], [c - 50, t + 118], [c - 28, t + 52],
    ], HAIR, "contour", { role: "hair" }),
    ring("head", [
      [c - 16, t + 6], [c + 28, t + 2], [c + 62, t + 36], [c + 70, t + 90],
      [c + 74, Y.nose - 6], [c + 58, Y.nose + 14], [c + 36, Y.chin - 8], [c + 8, Y.chin + 4],
      [c - 28, Y.chin - 6], [c - 48, t + 100], [c - 46, t + 40],
    ], SKIN, "contour", { role: "head" }),
    ring("fringe", [[c - 20, t + 18], [c + 30, t + 10], [c + 64, t + 28], [c + 50, t + 50], [c + 10, t + 48], [c - 16, t + 42]], HAIR),
    ...goggle("near", c + 40, Y.eye + 22, 13, 1, SKIN, 0.2),
    ring("nose", [[c + 62, Y.nose - 8], [c + 74, Y.nose], [c + 56, Y.nose + 10]], "none", "interior", { open: true }),
    ring("mouth", [[c + 24, Y.mouth], [c + 46, Y.mouth + 2], [c + 58, Y.mouth - 2]], "none", "mouth", { open: true, line: "mouth" }),
  ];
  return sheet("dot", "threeQuarter", "stand", shapes, [[c - 20, Y.sole], [c + 30, Y.sole]], TOP, Y.chin);
}

function profileStand() {
  const c = 300;
  const t = TOP;
  const s = Y.shoulder;
  const shapes = [
    ring("leg", [
      [c - 8, Y.waist + 8], [c + 16, Y.waist + 4], [c + 22, Y.knee], [c + 10, Y.knee + 18],
      [c + 6, Y.ankle], [c - 16, Y.ankle], [c - 8, Y.knee + 6], [c - 18, Y.crotch],
    ], PANTS, "contour", { shadow: true }),
    ring("knee", [[c + 16, Y.knee], [c - 4, Y.knee + 12]], "none", "interior", { open: true }),
    ring("shoe", [
      [c - 18, Y.ankle - 2], [c - 28, Y.sole + 2], [c + 28, Y.sole + 2], [c + 36, Y.sole - 14], [c + 8, Y.ankle - 4],
    ], SHOE),
    ring("sleeve", [
      [c + 8, s + 8], [c + 36, s + 28], [c + 48, s + 70], [c + 34, s + 84], [c + 18, s + 148], [c + 2, s + 152], [c + 16, s + 80], [c - 8, s + 16],
    ], BLAZER),
    ring("blazer", [
      [c - 48, s + 6], [c - 10, s - 16], [c + 28, s - 8], [c + 36, s + 20],
      [c + 24, Y.waist + 8], [c - 36, Y.waist + 16], [c - 52, Y.waist - 10],
    ], BLAZER, "contour", { shadow: true }),
    ring("shirt", [[c - 4, s + 2], [c + 16, s - 2], [c + 10, Y.waist - 18], [c - 8, Y.waist - 8]], SHIRT),
    ring("neck", [[c - 10, Y.chin], [c + 16, Y.chin - 2], [c + 12, s + 6], [c - 16, s + 4]], SKIN),
    ...tablet("pad", c - 36, s + 96, 26, 78),
    sideHand("handF", c - 16, s + 118, "grip"),
    ring("bob", [
      [c - 20, t + 8], [c + 10, t - 6], [c + 36, t + 24], [c + 28, t + 70], [c + 8, t + 40],
      [c - 8, t + 48], [c - 36, t + 90], [c - 48, t + 120], [c - 30, t + 70], [c - 28, t + 28],
    ], HAIR, "contour", { role: "hair" }),
    ring("head", [
      [c - 8, t + 8], [c + 18, t + 4], [c + 34, t + 40], [c + 30, t + 90],
      [c + 48, Y.nose], [c + 28, Y.nose + 16], [c + 8, Y.chin + 2], [c - 22, Y.chin - 8],
      [c - 36, t + 90], [c - 30, t + 36],
    ], SKIN, "contour", { role: "head" }),
    ring("fringe", [[c - 6, t + 16], [c + 22, t + 10], [c + 34, t + 28], [c + 18, t + 42], [c - 4, t + 40]], HAIR),
    ...goggle("near", c + 16, Y.eye, 16, 2, SKIN, 0.32),
    ring("nose", [[c + 28, Y.nose - 10], [c + 48, Y.nose], [c + 26, Y.nose + 12]], "none", "interior", { open: true }),
    ring("mouth", [[c + 10, Y.mouth], [c + 26, Y.mouth + 1]], "none", "mouth", { open: true, line: "mouth" }),
  ];
  return sheet("dot", "profile", "stand", shapes, [[c + 8, Y.sole]], TOP, Y.chin);
}

function backStand() {
  const c = CX;
  const t = TOP;
  const s = Y.shoulder;
  return sheet("dot", "back", "stand", [
    ring("legL", [[c - 8, Y.waist], [c - 40, Y.waist + 12], [c - 28, Y.ankle], [c + 2, Y.ankle], [c - 4, Y.crotch]], PANTS),
    ring("legR", [[c + 8, Y.waist], [c + 40, Y.waist + 12], [c + 28, Y.ankle], [c - 2, Y.ankle], [c + 4, Y.crotch]], PANTS),
    ring("shoeL", [[c - 34, Y.ankle], [c - 40, Y.sole + 2], [c + 4, Y.sole], [c, Y.ankle]], SHOE),
    ring("shoeR", [[c, Y.ankle], [c - 2, Y.sole + 2], [c + 42, Y.sole], [c + 36, Y.ankle]], SHOE),
    ring("sleeveL", [[c - 70, s], [c - 104, s + 30], [c - 96, s + 140], [c - 74, s + 146], [c - 60, s + 24]], BLAZER),
    ring("sleeveR", [[c + 70, s], [c + 104, s + 30], [c + 96, s + 140], [c + 74, s + 146], [c + 60, s + 24]], BLAZER),
    ring("blazer", [
      [c - 86, s + 6], [c, s - 18], [c + 86, s + 6], [c + 70, Y.waist + 10], [c - 70, Y.waist + 12],
    ], BLAZER, "contour", { shadow: true }),
    ring("seam", [[c, s - 10], [c, Y.waist + 4]], "none", "interior", { open: true }),
    sideHand("handL", c - 100, s + 140, "relaxed"),
    sideHand("handR", c + 70, s + 140, "relaxed"),
    ring("bob", [
      [c - 78, t + 36], [c - 70, t + 8], [c - 28, t - 2], [c, t - 10], [c + 28, t - 2], [c + 70, t + 8],
      [c + 84, t + 48], [c + 86, t + 118], [c + 62, t + 148], [c + 24, t + 138],
      [c, t + 132], [c - 24, t + 138], [c - 62, t + 148], [c - 86, t + 118], [c - 84, t + 48],
    ], HAIR, "contour", { role: "head" }),
    ring("nape", [[c - 18, t + 124], [c, t + 134], [c + 18, t + 124], [c + 14, s + 8], [c - 14, s + 8]], SKIN),
  ], [[c - 24, Y.sole], [c + 28, Y.sole]], TOP, Y.chin);
}

export const DOT_SHEET = [frontStand(), quarterStand(), profileStand(), backStand()];
