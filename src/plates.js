function path(d, fill, stroke, line = "bg", extra = {}) {
  return {
    type: "path",
    path: d,
    fill,
    stroke: stroke || "none",
    strokeWidth: 0,
    line,
    shadow: extra.shadow === true,
    ...(extra.shadowFill ? { shadowFill: extra.shadowFill } : {}),
    seed: extra.seed ?? 3,
    ...(extra.opacity !== undefined ? { opacity: extra.opacity } : {}),
    ...(extra.id ? { id: extra.id } : {}),
  };
}
function rect(x, y, w, h, fill, stroke, line = "bg", extra = {}) {
  return path(`M${x} ${y}h${w}v${h}h${-w}Z`, fill, stroke, line, extra);
}
function ell(x, y, rx, ry, fill, stroke, line = "bg", extra = {}) {
  return {
    type: "ellipse",
    x, y, rx, ry,
    fill,
    stroke: stroke || "none",
    strokeWidth: 0,
    line,
    shadow: extra.shadow === true,
    ...(extra.shadowFill ? { shadowFill: extra.shadowFill } : {}),
    seed: extra.seed ?? 4,
  };
}
function layer(id, parallax, children) {
  return { type: "group", id, parallax, children };
}
function quad(x0, y0, x1, y1, x2, y2, x3, y3, fill, stroke, line = "bg", extra = {}) {
  return path(`M${x0} ${y0}L${x1} ${y1}L${x2} ${y2}L${x3} ${y3}Z`, fill, stroke, line, extra);
}

function floorTiles(y0, rows, cols, a, b) {
  const horizon = 300;
  const shapes = [];
  const fy = (t) => y0 + (720 - y0) * t ** 1.35;
  const edge = (y, c) => {
    const u = Math.max(0.08, (y - horizon) / (720 - horizon));
    const half = 980 * u;
    return 640 - half + ((half * 2) / cols) * c;
  };
  for (let row = 0; row < rows; row++) {
    const top = fy(row / rows);
    const bot = fy((row + 1) / rows);
    for (let col = 0; col < cols; col++) {
      shapes.push(quad(
        edge(top, col), top, edge(top, col + 1), top,
        edge(bot, col + 1), bot, edge(bot, col), bot,
        (row + col) % 2 ? a : b, "none", "none", { seed: row + col },
      ));
    }
  }
  return shapes;
}

export function kitchenPlate() {
  const wall = "#E0D3B4";
  const wallLine = "#6A5E48";
  const cab = "#8FA383";
  const cabLine = "#3E4C36";
  const cabSh = "#6E8064";
  const counter = "#E8DCC0";
  const counterLine = "#6A604A";
  const wood = "#8A6446";
  const woodLine = "#5C3A22";
  const doors = [];
  for (let i = 0; i < 5; i++) {
    const x = 210 + i * 160;
    doors.push(
      rect(x + 8, 392, 150, 150, cabSh, "none", "none"),
      rect(x, 384, 156, 156, cab, cabLine, "bg", { shadow: true, shadowFill: cabSh }),
      path(`M${x + 18} 404h120v116h-120Z`, "transparent", cabLine, "bgDetail"),
      ell(x + 78, 462, 7, 7, "#E6D39A", cabLine, "bgDetail"),
    );
  }
  const tiles = [];
  for (let i = 0; i < 14; i++)
    tiles.push(path(`M${40 + i * 86} 286v52`, "transparent", "#C4B48A", "bgDetail"));
  tiles.push(path("M20 286h1240", "transparent", "#C4B48A", "bgDetail"));
  tiles.push(path("M20 338h1240", "transparent", "#C4B48A", "bgDetail"));
  return [
    layer("sky_wall", 0.15, [
      rect(0, 0, 1280, 360, wall, "none", "none"),
      rect(430, 36, 420, 214, "#BFDCE6", "#4E6670", "bg"),
      rect(452, 58, 180, 78, "#D7EEF4", "#4E6670", "bgDetail"),
      rect(648, 58, 180, 78, "#C5E4EC", "#4E6670", "bgDetail"),
      rect(452, 148, 180, 78, "#C5E4EC", "#4E6670", "bgDetail"),
      rect(648, 148, 180, 78, "#D7EEF4", "#4E6670", "bgDetail"),
      path("M470 78h70v36h-18l-8 18h-44Z", "#E7D7B4", "#6A5E48", "bgFar"),
      path("M478 70h54l10 16h-74Z", "#CDB892", "#6A5E48", "bgFar"),
      ell(540, 196, 48, 22, "#6F8F55", "#3E5230", "bg"),
      ell(620, 204, 42, 18, "#5E7A48", "#3E5230", "bg"),
      ell(710, 198, 50, 22, "#6F8F55", "#3E5230", "bg"),
      ell(790, 206, 36, 16, "#5E7A48", "#3E5230", "bg"),
      ell(760, 78, 14, 12, "#F6F1DF", "#4E6670", "bgFar"),
      rect(418, 242, 444, 16, "#E4D3A8", wallLine, "bg"),
      path("M0 300h1280", "transparent", wallLine, "bgDetail"),
    ]),
    layer("main_set", 0.4, [
      rect(0, 268, 1280, 78, "#E4D7A4", "none", "none"),
      ...tiles,
      rect(0, 338, 1020, 28, counter, counterLine, "bg"),
      path("M0 366h1020", "transparent", "#CDBE9E", "bgDetail"),
      rect(18, 300, 168, 240, "#F4EEE4", counterLine, "bg", { shadow: true, shadowFill: "#DDD4C4" }),
      ell(58, 332, 16, 8, "#2C3038", "#3A3E42", "bg"),
      ell(108, 332, 16, 8, "#2C3038", "#3A3E42", "bg"),
      ell(158, 332, 12, 6, "#2C3038", "#3A3E42", "bg"),
      path("M36 390h132v110h-132Z", "#E7E1D6", counterLine, "bgDetail"),
      path("M48 430h108", "transparent", "#8A8E92", "bgDetail"),
      ell(78, 292, 26, 18, "#7EB6A8", "#3E5C54", "bg", { shadow: true, shadowFill: "#5E9488" }),
      path("M98 284c16-6 24 8 16 16", "transparent", "#3E5C54", "bg"),
      path("M58 280c-14 2-18 14-6 18", "transparent", "#2C3038", "bgDetail"),
      ...doors,
      ell(560, 352, 48, 16, "#9AA6AE", "#5C6A72", "bg"),
      ell(670, 352, 48, 16, "#8A97A0", "#5C6A72", "bg"),
      path("M600 318v28M630 318v34M615 352v-8", "transparent", "#8A97A0", "bg"),
      ell(615, 314, 16, 6, "#C5CED4", "#5C6A72", "bg"),
      path("M400 312h90l6 28h-102Z", "#C8C2B6", counterLine, "bgDetail"),
      ell(424, 322, 14, 10, "#F7F4EA", counterLine, "bgDetail"),
      ell(452, 318, 12, 16, "#E7F0EA", counterLine, "bgDetail"),
      ell(860, 328, 40, 14, "#C6D39A", "#5C6A3A", "bg"),
      ell(838, 312, 12, 12, "#D24A3A", "#6A3030", "bg"),
      ell(868, 306, 14, 10, "#E2B13C", "#6A5018", "bg"),
      ell(900, 314, 16, 12, "#4FA39A", "#245850", "bg"),
      path("M892 304c8-10 18-2 10 8c-8 2-16 0-10-8Z", "#7FE6E0", "#245850", "bgDetail"),
      rect(1024, 168, 230, 392, "#A2AA9F", "#4A5248", "bg", { shadow: true, shadowFill: "#8B9488" }),
      path("M1044 188h190v150h-190Z", "#B7BEB4", "#4A5248", "bgDetail"),
      path("M1036 360h206", "transparent", "#4A5248", "bg"),
      rect(1236, 210, 14, 120, "#5C6560", "#3A423E", "bg"),
      rect(1236, 400, 14, 110, "#5C6560", "#3A423E", "bg"),
      rect(1060, 200, 70, 58, "#F7F4EA", "#4A5248", "bgDetail"),
      rect(1150, 230, 62, 48, "#F7F4EA", "#4A5248", "bgDetail"),
      rect(1088, 400, 54, 70, "#F4EFE2", "#4A5248", "bgDetail"),
      ell(1094, 214, 6, 6, "#D24A3A", "none", "none"),
      ell(1170, 246, 6, 6, "#E2B13C", "none", "none"),
      ell(1110, 430, 6, 6, "#7EB6A8", "none", "none"),
      rect(20, 470, 8, 70, cabLine, "none", "none"),
    ]),
    layer("floor", 1, floorTiles(548, 4, 8, "#CBD0B0", "#E3DDC4")),
    layer("foreground", 1.3, [
      path("M150 560h18v90h-18Z", "#7A5538", woodLine, "bg"),
      path("M118 548h80v16h-70Z", "#8A6446", woodLine, "bg"),
      path("M300 568h18v82h-18Z", "#7A5538", woodLine, "bg"),
      path("M286 556h70v14h-62Z", "#8A6446", woodLine, "bg"),
      ell(230, 650, 140, 22, "#6D4E34", "none", "none"),
      ell(226, 636, 136, 20, wood, woodLine, "bg", { shadow: true, shadowFill: "#6D4E34" }),
      path("M110 648h18v58h-18Z", "#6D4C32", woodLine, "bg"),
      path("M310 644h18v62h-18Z", "#6D4C32", woodLine, "bg"),
    ]),
  ];
}

export function garagePlate() {
  const wall = "#D2BF9C";
  const wallLine = "#6A5B3E";
  const bench = "#9C6C46";
  const benchLine = "#5C3D24";
  const tools = [
    [70, 86, 18, 70],
    [110, 80, 16, 78],
    [150, 92, 22, 64],
    [196, 78, 14, 82],
    [236, 88, 20, 68],
    [278, 84, 16, 74],
  ].map(([x, y, w, h], i) => path(
    `M${x} ${y}h${w}v${h * 0.35}h${-w * 0.3}v${h * 0.65}h${-w * 0.4}v${-h * 0.65}h${-w * 0.3}Z`,
    i % 2 ? "#4A4E52" : "#C7C2B8",
    "#2A2C30",
    "bgDetail",
  ));
  return [
    layer("far_street", 0.15, [
      rect(0, 0, 1280, 520, wall, "none", "none"),
      rect(860, 48, 380, 400, "#C8B7D2", "#5D5168", "bgFar"),
      path("M880 250h340v18h-340Z", "#8D8A84", "#5A564E", "bgFar"),
      path("M900 268h300v90h-280Z", "#6D9A62", "#3D5A38", "bg"),
      path("M980 150h90l16 40h-110Z", "#E4D8C8", "#6A6458", "bgFar"),
      path("M1048 168h40l8 28h-52Z", "#CDB892", "#6A6458", "bgFar"),
      ell(1168, 86, 16, 14, "#F4EFE2", "#5D5168", "bgFar"),
      path("M860 36h400v28h-400Z", "#8E9094", "#4A4E52", "bg"),
      path("M848 36h28v420h-28Z", wall, wallLine, "bg"),
    ]),
    layer("workshop", 0.4, [
      rect(36, 48, 300, 210, "#C4A574", "#6A5336", "bg", { shadow: true, shadowFill: "#B09060" }),
      ...tools,
      path("M48 40h280v16H48Z", "#6A5336", "#4A3824", "bg"),
      rect(40, 250, 560, 22, bench, benchLine, "bg"),
      rect(54, 272, 24, 150, "#7A5238", benchLine, "bg"),
      rect(520, 272, 24, 150, "#7A5238", benchLine, "bg"),
      rect(70, 300, 470, 16, "#8A5E3C", benchLine, "bgDetail"),
      ell(96, 236, 16, 10, "#2C3038", "#1C1E22", "bg"),
      path("M78 230h36v8H86l-8 28h-8Z", "#3A3E42", "#1C1E22", "bg"),
      path("M150 214c-30 6-48 28-40 48", "transparent", "#E7E2D8", "bgDetail"),
      rect(168, 176, 230, 78, "#D5D2CC", "#3C4244", "bg", { shadow: true, shadowFill: "#B7B4AE" }),
      ell(250, 214, 26, 26, "#A6E8B0", "#2E4A38", "bg"),
      ell(250, 214, 12, 12, "#E7FFF0", "none", "none"),
      path("M168 206C120 196 86 230 74 270", "transparent", "#E7E2D8", "bg"),
      path("M168 220C130 214 100 236 92 268", "transparent", "#D0CBC2", "bgDetail"),
      path("M20 340C70 300 90 310 120 360", "transparent", "#D27A3E", "bg"),
      rect(430, 70, 280, 16, "#6A6560", "#3A3834", "bg"),
      rect(470, 86, 70, 46, "#C4A882", "#6A5336", "bgDetail"),
      rect(550, 78, 80, 54, "#C4A882", "#6A5336", "bgDetail"),
      rect(500, 48, 60, 28, "#B89468", "#6A5336", "bgDetail"),
      path("M620 100c30-6 50 8 40 16", "transparent", "#D27A3E", "bgDetail"),
      rect(700, 180, 150, 280, "#9DAA95", "#4E5A48", "bg", { shadow: true, shadowFill: "#879480" }),
      path("M712 310h126", "transparent", "#4E5A48", "bg"),
      rect(834, 210, 12, 80, "#4A5248", "#2E342C", "bg"),
      rect(730, 200, 40, 30, "#F4EFE2", "#4E5A48", "bgDetail"),
      path("M1120 470h16v70h-16Z", "#6D533C", "#5C4634", "bg"),
      path("M1088 530h80v12h-96Z", "#8D7358", "#5C4634", "bg"),
      path("M1100 542h70v10h-70Z", "#6D533C", "#5C4634", "bg"),
    ]),
    layer("floor", 1, [
      rect(0, 500, 1280, 220, "#9A948C", "none", "none"),
      path("M0 560L1280 530L1280 720L0 720Z", "#8E8880", "none", "none"),
      path("M180 600L520 584L540 660L160 676Z", "#7C766E", "none", "none", { opacity: 0.55 }),
      path("M0 500h1280", "transparent", "#6A6560", "bgDetail"),
    ]),
  ];
}

export function marketPlate() {
  const vpX = 1480;
  const vpY = 288;
  const stalls = [];
  const awnings = ["#8E5550", "#58435C", "#2F5A5A", "#8E5550", "#2F5A5A"];
  for (let i = 0; i < 5; i++) {
    const t = i / 6;
    const x = 40 + t * (vpX - 40) * 0.62;
    const y = 300 + t * (vpY - 300) * 0.35;
    const s = 1 - t * 0.62;
    const w = 230 * s;
    const h = 150 * s;
    const glow = i % 2 ? "#FFC46B" : "#7FE6E0";
    const other = i % 2 ? "#7FE6E0" : "#FFC46B";
    stalls.push(
      path(`M${x} ${y}L${x + w} ${y + (vpY - y) * 0.08}L${x + w * 0.92} ${y + h * 0.35}L${x - w * 0.04} ${y + h * 0.42}Z`, awnings[i], "#241C28", "bg"),
      path(`M${x + 8 * s} ${y + h * 0.38}h${w * 0.84}l${8 * s} ${h * 0.7}h${-w * 0.9}Z`, "#6A5344", "#3A2C24", "bg", { shadow: true, shadowFill: "#4E3B30" }),
      path(`M${x + w * 0.15} ${y + h * 0.55}h${w * 0.7}v${h * 0.28}h${-w * 0.7}Z`, i === 2 ? "#8A4A48" : "#7F92A4", "#3A2C24", "bgDetail"),
      ell(x + w * 0.28, y + h * 0.22, 8 * s, 14 * s, glow, "#241C28", "bg"),
      ell(x + w * 0.62, y + h * 0.18, 8 * s, 14 * s, other, "#241C28", "bg"),
      path(`M${x + w * 0.28} ${y}v${h * 0.12}`, "transparent", "#C8B48A", "bgDetail"),
    );
  }
  const ribs = [];
  for (let i = 0; i < 7; i++) {
    const x = 80 + i * 180;
    ribs.push(path(`M${x} 40Q${640} ${-20 + i * 4} ${1200 - i * 20} ${60 + i * 8}`, "transparent", "#8E93A8", "bgFar"));
  }
  return [
    layer("dome", 0.15, [
      rect(0, 0, 1280, 720, "#1F2542", "none", "none"),
      path("M0 180Q320 20 640 40Q980 10 1280 150L1280 0L0 0Z", "#2A3158", "none", "none"),
      ...ribs,
      ell(820, 120, 78, 34, "#C8C4D8", "#8A86A0", "bgFar"),
      path("M730 128Q820 86 930 132", "transparent", "#A8A4B8", "bgFar"),
      path("M0 230Q400 180 1280 210L1280 360L0 390Z", "#243048", "none", "none"),
      path("M40 250h80M200 230h40M980 210h70", "transparent", "#9AA4B8", "bgFar"),
    ]),
    layer("stalls", 0.4, stalls),
    layer("stones", 1, [
      ...floorTiles(470, 4, 7, "#3A3A41", "#46434B").map((shape) => ({ ...shape, fill: shape.fill })),
      path("M80 560l180-16 30 90-200 20Z", "#4A474F", "#2C2A30", "bgDetail"),
      path("M360 548l220-18 24 100-230 16Z", "#3E3C44", "#2C2A30", "bgDetail"),
      path("M700 540l240-12 20 96-250 14Z", "#4A474F", "#2C2A30", "bgDetail"),
    ]),
    layer("foreground", 1.3, [
      path("M0 640h180l-20 80H0Z", "#2A2830", "none", "none"),
      path("M1120 620h160v100h-180Z", "#2A2830", "none", "none"),
    ]),
  ];
}
