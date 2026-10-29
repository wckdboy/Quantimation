import { validateAsset } from "./model.js";

export const SET_CATALOG = [
  {
    id: "coil_shed",
    name: "Coil Shed",
    kind: "environment",
    description:
      "Original cluttered inventor's garage. Layered parallax plates, a warm practical lamp, oil-stained floor and the Appetite Engine, a pot-bellied machine with a toothy intake.",
  },
  {
    id: "alien_market",
    name: "Silt Market",
    kind: "environment",
    description:
      "Original alien market. Dusty violet sky, uneven awnings, hanging lamps and a stall of glowing fruit. Parallax plates from distant spires to foreground crates.",
  },
  {
    id: "suburb_kitchen",
    name: "Split-Level Kitchen",
    kind: "environment",
    description:
      "Original suburban kitchen. Mismatched mint cabinets, a crooked fridge, linoleum and a daytime window. Cool window light against a warm practical over the table.",
  },
];

function painters(c) {
  const P = (path, fill, extra = {}) => ({
    type: "path",
    path,
    fill,
    stroke: extra.stroke || "#5a5346",
    strokeWidth: 0,
    line: extra.line || (fill === "transparent" ? "bgDetail" : "bg"),
    shadow: false,
    ...extra,
  });
  const E = (x, y, rx, ry, fill, extra = {}) => ({
    type: "ellipse",
    x,
    y,
    rx,
    ry,
    fill,
    stroke: extra.stroke || "#5a5346",
    strokeWidth: 0,
    line: extra.line || "bg",
    shadow: false,
    ...extra,
  });
  const R = (x, y, width, height, fill, extra = {}) => ({
    type: "rect",
    x,
    y,
    width,
    height,
    fill,
    stroke: extra.stroke || "none",
    strokeWidth: extra.strokeWidth ?? 0,
    ...extra,
  });
  const L = (x, y, x2, y2, stroke = c.ink, strokeWidth = 3) => ({
    type: "line",
    x,
    y,
    x2,
    y2,
    stroke,
    strokeWidth: 0,
    line: "bgDetail",
    shadow: false,
  });
  const G = (id, children, extra = {}) => ({
    type: "group",
    id,
    children,
    ...extra,
  });
  return { P, E, R, L, G };
}

function coilShed(c, id, name, description) {
  const { P, E, R, L, G } = painters(c);
  const copper = "#b56a45";
  const grease = "#6d8f78";
  const wall = "#6d6258";
  const wallShadow = "#433c38";
  const shapes = [
    G(
      "sky_wall",
      [
        R(0, 0, 1280, 720, wall, { stroke: "none" }),
        P("M0 0 L1280 0 L1280 210 L0 250 Z", "#7f947c", { strokeWidth: 0 }),
        P("M70 28 L430 18 L448 168 L58 188 Z", "#c9d3b4", { strokeWidth: 5 }),
        P("M86 46 L250 40 L256 154 L92 164 Z", "#9eb59a", { strokeWidth: 3 }),
        P("M250 40 L414 34 L420 150 L256 154 Z", "#b7c8ae", { strokeWidth: 3 }),
        L(250, 40, 256, 154, c.ink, 4),
        P("M0 180 L1280 140 L1280 430 L0 470 Z", wallShadow, { strokeWidth: 0 }),
      ],
      { parallax: 0.15 },
    ),
    G(
      "pegboard",
      [
        P("M690 70 L1120 58 L1140 360 L700 378 Z", "#5c534c", { strokeWidth: 5 }),
        L(740, 110, 1080, 96, "#3e3834", 3),
        L(748, 170, 1090, 154, "#3e3834", 3),
        L(756, 230, 1100, 214, "#3e3834", 3),
        E(820, 140, 16, 16, copper, { strokeWidth: 4 }),
        E(900, 128, 22, 14, "#8a8f86", { strokeWidth: 4 }),
        P("M980 150 L1040 142 L1034 210 L972 220 Z", "#2f3438", { strokeWidth: 4 }),
        P("M990 168 L1024 164 L1020 198 L986 204 Z", grease, { strokeWidth: 2 }),
        E(780, 250, 28, 36, "#d7d2c4", { strokeWidth: 4 }),
        E(780, 268, 10, 8, "#8fd0c0", { strokeWidth: 2 }),
        L(760, 300, 804, 292, c.ink, 3),
      ],
      { parallax: 0.46 },
    ),
    G(
      "bench",
      [
        P("M80 470 L980 430 L1040 560 L40 620 Z", "#6b5142", { strokeWidth: 5 }),
        P("M80 470 L200 390 L1080 360 L980 430 Z", "#8a6a52", { strokeWidth: 5 }),
        P("M40 620 L1040 560 L1060 720 L20 720 Z", "#4a4038", { strokeWidth: 0 }),
        P("M180 640 L420 610 L460 690 L150 720 Z", "#2a2624", {
          strokeWidth: 0,
          opacity: 0.45,
        }),
        G(
          "engine",
          [
            P(
              "M430 470 L560 450 L640 470 L690 560 L620 640 L470 650 L400 560 Z",
              "#4d5856",
              { strokeWidth: 6 },
            ),
            P("M470 500 L620 488 L650 560 L500 578 Z", "#2c3332", { strokeWidth: 4 }),
            P("M500 520 L560 512 L590 548 L530 560 Z", "#1a1c1c", {
              strokeWidth: 3,
              live: "jaw",
            }),
            P("M512 528 L528 526 L530 544 L516 546 Z", "#efe6cf", { strokeWidth: 2 }),
            P("M548 524 L566 520 L570 542 L552 544 Z", "#efe6cf", { strokeWidth: 2 }),
            P("M575 546 Q568 590 548 620 Q582 590 586 548 Z", "#8fbfae", {
              strokeWidth: 2.4,
              live: "drip",
            }),
            E(520, 430, 34, 18, copper, { strokeWidth: 4, live: "sway" }),
            E(600, 418, 28, 16, copper, { strokeWidth: 4 }),
            L(500, 430, 470, 360, copper, 6),
            L(610, 418, 680, 340, copper, 6),
            E(470, 360, 14, 14, "#d7e28a", { strokeWidth: 3, live: "flicker" }),
            P("M640 500 L760 488 L748 560 L628 574 Z", "#39403e", { strokeWidth: 4 }),
            E(700, 524, 16, 16, "#c45a48", { strokeWidth: 3 }),
          ],
          {},
        ),
        P("M860 500 L980 486 L990 560 L868 578 Z", "#3e4650", { strokeWidth: 4 }),
        L(880, 520, 970, 512, "#9aa4a8", 3),
        E(240, 540, 46, 18, "#2e3438", { strokeWidth: 4 }),
        E(300, 530, 20, 20, "#7f8c86", { strokeWidth: 4 }),
      ],
      { parallax: 0.18 },
    ),
    G(
      "floor",
      [
        P("M0 640 L1280 590 L1280 720 L0 720 Z", "#3c3834", { strokeWidth: 0 }),
        P("M0 676 L1280 640 L1280 720 L0 720 Z", "#2a2724", { strokeWidth: 0 }),
        L(40, 690, 520, 668, "#5a5148", 4),
        L(700, 660, 1240, 700, "#5a5148", 3),
      ],
      { parallax: 0.04 },
    ),
    G(
      "foreground",
      [
        P("M20 560 Q80 520 150 600 Q40 680 10 720 L0 720 L0 640 Z", "#24282c", {
          strokeWidth: 5,
        }),
        E(1180, 640, 70, 28, "#1d2124", { strokeWidth: 5 }),
        L(1120, 640, 1240, 628, "#d7e28a", 4),
        E(980, 120, 90, 36, "#f0c27a", {
          stroke: "none",
          strokeWidth: 0,
          opacity: 0.28,
        }),
      ],
      { parallax: 0 },
    ),
  ];
  return validateAsset({
    id,
    name,
    kind: "environment",
    description,
    width: 1280,
    height: 720,
    shapes,
  });
}

function alienMarket(c, id, name, description) {
  const { P, E, R, L, G } = painters(c);
  const shapes = [
    G(
      "sky",
      [
        R(0, 0, 1280, 720, "#3c3158", { stroke: "none" }),
        P("M0 80 L180 20 L260 90 L120 150 Z", "#6a5a86", { strokeWidth: 0 }),
        P("M420 40 L560 10 L620 120 L390 130 Z", "#514468", { strokeWidth: 0 }),
        P("M900 30 L1180 70 L1100 160 L820 120 Z", "#6d5c90", { strokeWidth: 0 }),
        E(1040, 80, 36, 30, "#e6d7a4", { strokeWidth: 4 }),
        P("M0 260 L1280 210 L1280 420 L0 460 Z", "#2a243f", { strokeWidth: 0 }),
      ],
      { parallax: 0.15 },
    ),
    G(
      "awnings",
      [
        P("M40 250 L380 220 L400 310 L20 340 Z", "#c45b4a", { strokeWidth: 5 }),
        P("M400 230 L820 200 L860 320 L420 340 Z", "#d2a24a", { strokeWidth: 5 }),
        P("M860 220 L1240 250 L1220 350 L840 330 Z", "#3f8f86", { strokeWidth: 5 }),
        L(80, 280, 360, 258, "#f2d2b0", 3),
        L(460, 270, 800, 248, "#f4e2b0", 3),
        E(180, 200, 10, 16, "#f0c27a", { strokeWidth: 3, live: "flicker" }),
        E(640, 180, 12, 18, "#f0c27a", { strokeWidth: 3, live: "flicker" }),
        E(1040, 200, 11, 16, "#f0c27a", { strokeWidth: 3, live: "flicker" }),
      ],
      { parallax: 0.42 },
    ),
    G(
      "stalls",
      [
        P("M80 360 L340 340 L360 560 L60 590 Z", "#6b4e46", { strokeWidth: 5 }),
        E(160, 430, 28, 22, "#8fd18a", { strokeWidth: 4 }),
        E(230, 450, 34, 24, "#d6e07a", { strokeWidth: 4 }),
        E(200, 490, 22, 18, "#e07a8a", { strokeWidth: 4 }),
        E(168, 424, 4, 4, c.ink, { strokeWidth: 0 }),
        E(236, 444, 4, 4, c.ink, { strokeWidth: 0 }),
        P("M520 350 L860 330 L900 600 L480 630 Z", "#5a463c", { strokeWidth: 5 }),
        P("M560 400 L820 384 L800 470 L548 490 Z", "#241c28", { strokeWidth: 4 }),
        L(600, 430, 760, 418, "#9be7c4", 4),
        P("M980 380 L1220 400 L1180 620 L940 600 Z", "#4e5a48", { strokeWidth: 5 }),
        P("M1020 460 L1160 470 L1140 560 L1000 548 Z", "#d8c3a0", { strokeWidth: 4 }),
      ],
      { parallax: 0.2 },
    ),
    G(
      "ground",
      [
        P("M0 600 L1280 560 L1280 720 L0 720 Z", "#6a5344", { strokeWidth: 0 }),
        P("M40 640 L300 620 L340 700 L20 720 Z", "#8a3d4a", { strokeWidth: 4 }),
        P("M700 630 L1040 610 L1100 710 L680 720 Z", "#2f4f5a", { strokeWidth: 4 }),
        L(0, 690, 1280, 650, "#3a2c28", 5),
      ],
      { parallax: 0.05 },
    ),
    G(
      "front_crates",
      [
        P("M0 560 L160 540 L180 720 L0 720 Z", "#7a5a3a", { strokeWidth: 5 }),
        L(20, 600, 150, 588, c.ink, 3),
        P("M1100 580 L1280 560 L1280 720 L1120 720 Z", "#5c4638", { strokeWidth: 5 }),
      ],
      { parallax: 0 },
    ),
  ];
  return validateAsset({
    id,
    name,
    kind: "environment",
    description,
    width: 1280,
    height: 720,
    shapes,
  });
}

function suburbKitchen(c, id, name, description) {
  const { P, E, R, L, G } = painters(c);
  const wall = "#E0D3B4";
  const cabinet = "#8FA383";
  const cabinetLine = "#38482f";
  const counter = "#E8DCC0";
  const shapes = [
    G(
      "wall",
      [
        R(0, 0, 1280, 420, wall, { stroke: "none", line: "none" }),
        P("M430 36 L860 36 L860 250 L430 250 Z", "#BFDCE6", {
          stroke: "#4b626a",
          line: "bg",
        }),
        P("M455 58 L630 58 L630 230 L455 230 Z", "#d5ebf2", {
          stroke: "#4b626a",
          line: "bgDetail",
        }),
        P("M660 58 L835 58 L835 230 L660 230 Z", "#d5ebf2", {
          stroke: "#4b626a",
          line: "bgDetail",
        }),
        P("M470 150 L820 150", "transparent", { stroke: "#4b626a", line: "bgDetail" }),
        P("M500 168 L790 210 L790 228 L470 186 Z", "#7d9a62", { stroke: "#38482f", line: "bg" }),
        E(760, 78, 18, 16, "#f4f1e4", { stroke: "#4b626a", line: "bg" }),
        P("M0 250 L1280 250 L1280 360 L0 360 Z", "#CDBF8E", {
          stroke: "none",
          line: "none",
        }),
      ],
      { parallax: 0.15 },
    ),
    G(
      "cabinets",
      [
        P("M0 300 L1280 300 L1280 360 L0 360 Z", counter, {
          stroke: "#6a604a",
          line: "bg",
        }),
        P("M0 360 L980 360 L980 560 L0 560 Z", cabinet, {
          stroke: cabinetLine,
          line: "bg",
        }),
        L(200, 360, 200, 560, cabinetLine, 2),
        L(400, 360, 400, 560, cabinetLine, 2),
        L(600, 360, 600, 560, cabinetLine, 2),
        L(800, 360, 800, 560, cabinetLine, 2),
        E(100, 460, 8, 8, "#E6D39A", { stroke: cabinetLine, line: "bgDetail" }),
        E(300, 460, 8, 8, "#E6D39A", { stroke: cabinetLine, line: "bgDetail" }),
        E(500, 460, 8, 8, "#E6D39A", { stroke: cabinetLine, line: "bgDetail" }),
        E(700, 460, 8, 8, "#E6D39A", { stroke: cabinetLine, line: "bgDetail" }),
        P("M20 390 L180 390 L180 540 L20 540 Z", "#efe6d4", {
          stroke: "#6a604a",
          line: "bg",
        }),
        E(70, 430, 16, 12, "#7eb6a8", { stroke: "#38482f", line: "bg" }),
        P("M1040 250 L1240 250 L1240 620 L1040 620 Z", "#A2AA9F", {
          stroke: "#444a41",
          line: "bg",
        }),
        P("M1060 280 L1220 280 L1220 340 L1060 340 Z", "#f7f4ea", {
          stroke: "#444a41",
          line: "bgDetail",
        }),
        P("M1088 300 L1140 300 L1140 328 L1088 328 Z", "#f7f4ea", {
          stroke: "#444a41",
          line: "bgDetail",
        }),
        P("M1160 360 L1230 360 L1230 420 L1160 420 Z", "#2C3038", {
          stroke: "#444a41",
          line: "bg",
        }),
      ],
      { parallax: 0.4 },
    ),
    G(
      "table",
      [
        E(180, 640, 150, 46, "#8A6446", { stroke: "#422409", line: "bg" }),
        P("M40 600 L300 600 L320 680 L20 680 Z", "#8A6446", {
          stroke: "#422409",
          line: "bg",
        }),
        P("M70 560 L120 560 L110 610 L60 610 Z", "#6d4c32", {
          stroke: "#422409",
          line: "bg",
        }),
      ],
      { parallax: 1 },
    ),
    G(
      "floor",
      [
        P("M0 560 L1280 560 L1280 720 L0 720 Z", "#CBD0B0", { stroke: "none", line: "none" }),
        P("M0 660 L180 648 L200 720 L0 720 Z", "#b7a078", { strokeWidth: 0 }),
        P("M200 652 L380 640 L400 720 L180 720 Z", "#d8c6a4", { strokeWidth: 0 }),
        P("M400 644 L600 632 L620 720 L380 720 Z", "#b7a078", { strokeWidth: 0 }),
        P("M620 636 L860 628 L880 720 L600 720 Z", "#d8c6a4", { strokeWidth: 0 }),
        P("M880 630 L1280 620 L1280 720 L860 720 Z", "#b7a078", { strokeWidth: 0 }),
      ],
      { parallax: 0.04 },
    ),
    G(
      "practical",
      [
        E(640, 40, 70, 18, "#f3d7a2", { stroke: "#6a604a", line: "bg" }),
        E(640, 180, 220, 80, "#f3d7a2", {
          stroke: "none",
          strokeWidth: 0,
          opacity: 0.18,
        }),
      ],
      { parallax: 0 },
    ),
  ];
  return validateAsset({
    id,
    name,
    kind: "environment",
    description,
    width: 1280,
    height: 720,
    shapes,
  });
}

export function buildSet(standardId, { id = standardId, name, description, palette } = {}) {
  const item = SET_CATALOG.find((entry) => entry.id === standardId);
  if (!item) return null;
  const c = {
    ink: palette?.ink || "#1c1a17",
    wood: palette?.wood || "#6b5142",
    sky: palette?.sky || "#7f947c",
    accent: palette?.accent || "#c45b4a",
    light: palette?.light || "#f0c27a",
  };
  const label = name || item.name;
  const text = description || item.description;
  if (standardId === "coil_shed") return coilShed(c, id, label, text);
  if (standardId === "alien_market") return alienMarket(c, id, label, text);
  if (standardId === "suburb_kitchen") return suburbKitchen(c, id, label, text);
  return null;
}
