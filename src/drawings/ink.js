// Shared contour helpers for authored character sheets.

import { smoothClosed, smoothOpen } from "../curves.js";

export const INK = "#221D26";
export const SCLERA = "#F4F0E4";

export function circlePath(cx, cy, r) {
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

export function ring(id, pts, fill, line = "contour", extra = {}) {
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

export function disc(id, cx, cy, r, fill, line = "contour", extra = {}) {
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

export function goggle(prefix, cx, cy, r, pupilShift, skin, lid = 0.15) {
  const lidY = cy - r * (0.15 - lid);
  return [
    disc(`${prefix}Eye`, cx, cy, r, SCLERA, "eye", { role: "eye" }),
    ring(
      `${prefix}Lid`,
      [
        [cx - r * 0.98, lidY],
        [cx - r * 0.5, cy - r * 1.02],
        [cx, cy - r * 1.08],
        [cx + r * 0.5, cy - r * 1.02],
        [cx + r * 0.98, lidY],
        [cx + r * 0.15, lidY + r * 0.12],
        [cx - r * 0.15, lidY + r * 0.12],
      ],
      skin,
    ),
    ring(
      `${prefix}LidLine`,
      [
        [cx - r * 0.9, lidY + r * 0.04],
        [cx, lidY + r * 0.18],
        [cx + r * 0.9, lidY + r * 0.04],
      ],
      "none",
      "interior",
      { open: true },
    ),
    disc(`${prefix}Pupil`, cx + pupilShift, cy + r * 0.18, Math.max(3, r * 0.22), INK, "eye", { role: "pupil" }),
    disc(`${prefix}Glint`, cx - r * 0.28 + pupilShift * 0.2, cy - r * 0.32, Math.max(2, r * 0.12), "#FFFEF8", "none"),
  ];
}

export function sheet(character, view, pose, shapes, feet, crown, chin, width = 640) {
  const footY = Math.max(...feet.map((foot) => foot[1]));
  return {
    character,
    view,
    pose,
    width,
    height: footY + 8,
    feet,
    crown,
    chin,
    shapes,
  };
}
