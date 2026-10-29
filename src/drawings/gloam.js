// Gloam. A dome on a pear, sweater vest, no brows. Two heads tall.

import { goggle, ring, sheet } from "./ink.js";

const SKIN = "#8AB3A2";
const SKIN_DK = "#6B9282";
const VEST = "#7A5A44";
const MOUTH = "#33282E";
const TONGUE = "#B97C82";

const TOP = 48;
const HH = 200;
const CX = 320;
const SOLE = TOP + 2.05 * HH;

function front() {
  const t = TOP;
  const head = [
    [CX, t + 4],
    [CX + 48, t + 10],
    [CX + 86, t + 48],
    [CX + 96, t + 110],
    [CX + 78, t + 168],
    [CX + 36, t + 196],
    [CX, t + 204],
    [CX - 36, t + 196],
    [CX - 78, t + 168],
    [CX - 96, t + 110],
    [CX - 86, t + 48],
    [CX - 48, t + 10],
  ];
  const body = [
    [CX - 46, t + 186],
    [CX - 96, t + 250],
    [CX - 118, t + 320],
    [CX - 78, SOLE - 18],
    [CX - 28, SOLE],
    [CX + 28, SOLE],
    [CX + 78, SOLE - 18],
    [CX + 118, t + 320],
    [CX + 96, t + 250],
    [CX + 46, t + 186],
  ];
  const vest = [
    [CX - 34, t + 210],
    [CX + 34, t + 208],
    [CX + 70, t + 280],
    [CX + 54, t + 340],
    [CX, t + 356],
    [CX - 54, t + 340],
    [CX - 70, t + 280],
  ];
  const eyeY = t + 108;
  const r = 28;
  return sheet("gloam", "front", "stand", [
    ring("body", body, SKIN, "contour", { shadow: true }),
    ring("vest", vest, VEST, "contour", { shadow: true }),
    ring("hem", [[CX - 48, t + 332], [CX, t + 348], [CX + 48, t + 332]], "none", "interior", { open: true }),
    ring("button", [[CX - 6, t + 250], [CX + 6, t + 250], [CX + 6, t + 262], [CX - 6, t + 262]], SKIN_DK, "prop"),
    ring("armL", [
      [CX - 70, t + 230], [CX - 108, t + 250], [CX - 118, t + 300], [CX - 96, t + 312], [CX - 78, t + 260], [CX - 52, t + 236],
    ], SKIN),
    ring("armR", [
      [CX + 70, t + 228], [CX + 110, t + 248], [CX + 116, t + 298], [CX + 94, t + 310], [CX + 76, t + 258], [CX + 50, t + 234],
    ], SKIN),
    ring("handL", [
      [CX - 112, t + 300], [CX - 128, t + 318], [CX - 122, t + 340], [CX - 104, t + 334], [CX - 108, t + 348],
      [CX - 92, t + 338], [CX - 90, t + 314], [CX - 100, t + 302],
    ], SKIN, "contour", { role: "hand" }),
    ring("handR", [
      [CX + 100, t + 298], [CX + 118, t + 316], [CX + 112, t + 338], [CX + 94, t + 332], [CX + 98, t + 346],
      [CX + 82, t + 336], [CX + 80, t + 312], [CX + 90, t + 300],
    ], SKIN, "contour", { role: "hand" }),
    ring("footL", [[CX - 48, SOLE - 16], [CX - 58, SOLE + 4], [CX - 16, SOLE + 2], [CX - 18, SOLE - 16]], SKIN_DK),
    ring("footR", [[CX + 18, SOLE - 16], [CX + 16, SOLE + 2], [CX + 58, SOLE + 4], [CX + 48, SOLE - 16]], SKIN_DK),
    ring("head", head, SKIN, "contour", { role: "head", shadow: true }),
    ...goggle("far", CX - 30, eyeY, r, -2, SKIN, -0.55),
    ...goggle("near", CX + 30, eyeY, r, 2, SKIN, -0.55),
    ring("mouth", [
      [CX - 18, t + 162], [CX, t + 174], [CX + 18, t + 162], [CX + 10, t + 168], [CX, t + 166], [CX - 10, t + 168],
    ], MOUTH, "mouth"),
    ring("tongue", [[CX - 8, t + 166], [CX, t + 172], [CX + 8, t + 166]], TONGUE, "mouth"),
  ], [[CX - 36, SOLE], [CX + 36, SOLE]], TOP, t + 204);
}

function quarter() {
  const c = 340;
  const t = TOP;
  return sheet("gloam", "threeQuarter", "stand", [
    ring("body", [
      [c - 20, t + 190], [c - 70, t + 260], [c - 80, t + 330], [c - 20, SOLE],
      [c + 50, SOLE - 4], [c + 100, t + 320], [c + 86, t + 250], [c + 40, t + 188],
    ], SKIN, "contour", { shadow: true }),
    ring("vest", [
      [c - 8, t + 214], [c + 40, t + 206], [c + 72, t + 280], [c + 40, t + 348], [c - 16, t + 336], [c - 30, t + 270],
    ], VEST, "contour", { shadow: true }),
    ring("hem", [[c - 10, t + 328], [c + 24, t + 344], [c + 48, t + 330]], "none", "interior", { open: true }),
    ring("arm", [
      [c + 48, t + 230], [c + 96, t + 252], [c + 104, t + 304], [c + 80, t + 314], [c + 62, t + 260], [c + 30, t + 236],
    ], SKIN),
    ring("handF", [
      [c + 90, t + 304], [c + 112, t + 322], [c + 100, t + 344], [c + 82, t + 332], [c + 86, t + 348], [c + 70, t + 318],
    ], SKIN, "contour", { role: "hand" }),
    ring("foot", [[c + 10, SOLE - 10], [c + 4, SOLE + 4], [c + 56, SOLE + 2], [c + 48, SOLE - 12]], SKIN_DK),
    ring("head", [
      [c - 10, t + 8], [c + 40, t + 4], [c + 86, t + 50], [c + 96, t + 120],
      [c + 70, t + 180], [c + 24, t + 206], [c - 20, t + 190], [c - 56, t + 140], [c - 50, t + 50],
    ], SKIN, "contour", { role: "head", shadow: true }),
    ...goggle("near", c + 36, t + 112, 26, 2, SKIN, -0.55),
    ring("mouth", [[c + 10, t + 168], [c + 36, t + 178], [c + 52, t + 166], [c + 30, t + 170]], MOUTH, "mouth"),
  ], [[c + 24, SOLE]], TOP, t + 206);
}

function profile() {
  const c = 300;
  const t = TOP;
  return sheet("gloam", "profile", "stand", [
    ring("body", [
      [c - 10, t + 188], [c - 40, t + 260], [c - 30, SOLE - 8], [c + 36, SOLE],
      [c + 70, t + 300], [c + 48, t + 230], [c + 16, t + 190],
    ], SKIN, "contour", { shadow: true }),
    ring("vest", [
      [c - 4, t + 220], [c + 28, t + 210], [c + 40, t + 300], [c + 10, t + 340], [c - 16, t + 300],
    ], VEST),
    ring("arm", [
      [c + 10, t + 236], [c + 40, t + 260], [c + 46, t + 310], [c + 24, t + 318], [c + 8, t + 270],
    ], SKIN),
    ring("handF", [
      [c + 30, t + 308], [c + 50, t + 324], [c + 40, t + 346], [c + 22, t + 332], [c + 26, t + 348], [c + 12, t + 320],
    ], SKIN, "contour", { role: "hand" }),
    ring("head", [
      [c - 16, t + 16], [c + 20, t + 6], [c + 48, t + 50], [c + 52, t + 120],
      [c + 70, t + 160], [c + 36, t + 196], [c, t + 204], [c - 36, t + 160], [c - 40, t + 70],
    ], SKIN, "contour", { role: "head", shadow: true }),
    ...goggle("near", c + 22, t + 108, 22, 2, SKIN, -0.55),
    ring("mouth", [[c + 16, t + 168], [c + 40, t + 176], [c + 48, t + 166]], MOUTH, "mouth"),
  ], [[c + 16, SOLE]], TOP, t + 204);
}

export const GLOAM_SHEET = [front(), quarter(), profile()];
