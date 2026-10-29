import { validateAsset, validateEpisode } from "./model.js";
import { ellipsePts, roundRectPts } from "./line-engine.mjs";
import visemes from "./mouth-visemes.dot.json" with { type: "json" };

const INK = "#221D26";

function pathFrom(points, close = true) {
  const body = points
    .map((p, i) => `${i ? "L" : "M"}${p[0].toFixed(2)} ${p[1].toFixed(2)}`)
    .join(" ");
  return close ? `${body} Z` : body;
}

function shape(pts, fill, line, extra = {}) {
  const open = extra.open === true;
  return {
    type: "path",
    path: pathFrom(pts, !open),
    fill: open ? "transparent" : fill,
    stroke: extra.stroke || (line === "none" ? "none" : INK),
    strokeWidth: 0,
    line,
    ...(extra.shadow === false || open || line === "none" || line === "interior" || line === "detail"
      ? { shadow: extra.shadow === true }
      : { shadow: true }),
    ...(extra.shadowFill ? { shadowFill: extra.shadowFill } : {}),
    ...(extra.shadowK !== undefined ? { shadowK: extra.shadowK } : {}),
    ...(extra.id ? { id: extra.id } : {}),
    ...(extra.role ? { role: extra.role } : {}),
    ...(extra.pivotX !== undefined ? { pivotX: extra.pivotX, pivotY: extra.pivotY } : {}),
    seed: extra.seed ?? 1,
  };
}

function ellipse(x, y, rx, ry, fill, line, extra = {}) {
  return {
    type: "ellipse",
    x,
    y,
    rx: Math.max(0.5, rx),
    ry: Math.max(0.5, ry),
    fill,
    stroke: line === "none" ? "none" : extra.stroke || INK,
    strokeWidth: 0,
    line,
    ...(extra.shadow
      ? { shadow: true, shadowFill: extra.shadowFill, shadowK: extra.shadowK ?? 0.12 }
      : { shadow: false }),
    ...(extra.id ? { id: extra.id } : {}),
    ...(extra.role ? { role: extra.role } : {}),
    seed: extra.seed ?? 1,
  };
}

function group(id, x, y, children, extra = {}) {
  return {
    type: "group",
    id,
    pivotX: x,
    pivotY: y,
    ...(extra.x !== undefined ? { x: extra.x, y: extra.y } : {}),
    ...(extra.role ? { role: extra.role } : {}),
    ...(extra.scaleX ? { scaleX: extra.scaleX, scaleY: extra.scaleY } : {}),
    ...(extra.turnaround ? { turnaround: true } : {}),
    children,
    ...(extra.variants ? { variants: extra.variants } : {}),
  };
}

function limbPolygon(ax, ay, bx, by, w0, w1) {
  const dx = bx - ax;
  const dy = by - ay;
  const len = Math.hypot(dx, dy) || 1;
  const ux = dx / len;
  const uy = dy / len;
  const overlap = Math.max(w0, w1) * 0.26;
  const a = [ax - ux * overlap, ay - uy * overlap];
  const b = [bx + ux * overlap * 0.85, by + uy * overlap * 0.85];
  const ang = Math.atan2(uy, ux);
  const pts = [];
  const arc = (cx, cy, r, a0, a1, steps) => {
    for (let i = 0; i <= steps; i++) {
      const t = a0 + ((a1 - a0) * i) / steps;
      pts.push([cx + Math.cos(t) * r, cy + Math.sin(t) * r]);
    }
  };
  arc(a[0], a[1], w0 / 2, ang + Math.PI / 2, ang + Math.PI * 1.5, 8);
  arc(b[0], b[1], w1 / 2, ang - Math.PI / 2, ang + Math.PI / 2, 8);
  return pts;
}

function frameFor(id) {
  const spec = LEADS[id];
  const HH = spec.hh;
  const cx = spec.width / 2;
  const top = 28;
  return { spec, HH, cx, top, Y: (y) => top + y * HH };
}

function at(f, x, y) {
  return [f.cx + x * f.HH, f.Y(y)];
}

function poly(f, pairs) {
  return pairs.map(([x, y]) => at(f, x, y));
}

function smoothClosed(pairs) {
  const n = pairs.length;
  const out = [];
  for (let i = 0; i < n; i++) {
    const p0 = pairs[(i - 1 + n) % n];
    const p1 = pairs[i];
    const p2 = pairs[(i + 1) % n];
    const p3 = pairs[(i + 2) % n];
    const c1 = [p1[0] + (p2[0] - p0[0]) / 6, p1[1] + (p2[1] - p0[1]) / 6];
    const c2 = [p2[0] - (p3[0] - p1[0]) / 6, p2[1] - (p3[1] - p1[1]) / 6];
    for (let s = 0; s < 5; s++) {
      const t = s / 5;
      const v = 1 - t;
      out.push([
        v * v * v * p1[0] + 3 * v * v * t * c1[0] + 3 * v * t * t * c2[0] + t * t * t * p2[0],
        v * v * v * p1[1] + 3 * v * v * t * c1[1] + 3 * v * t * t * c2[1] + t * t * t * p2[1],
      ]);
    }
  }
  return out;
}

function fill(f, pairs, color, line, extra) {
  return shape(poly(f, pairs), color, line, extra);
}

function stroke(f, pairs, line, extra = {}) {
  return shape(poly(f, pairs), "transparent", line, { ...extra, open: true, shadow: false });
}

function cap(x, y, width, color) {
  return ellipse(x, y, width / 2, width / 2, color, "none");
}

function limb(id, a, b, w0, w1, color, shadow) {
  return group(id, a[0], a[1], [
    cap(a[0], a[1], Math.max(w0, w1), color),
    shape(limbPolygon(a[0], a[1], b[0], b[1], w0, w1), color, "contour", {
      shadowFill: shadow,
      shadowK: 0.18,
      seed: 4,
    }),
  ], { role: "decoration" });
}

function handDraw(x, y, skin, shadow, side, pose, length) {
  const s = side === "left" ? -1 : 1;
  const w = Math.max(12, length * 0.16);
  const parts = [
    shape(ellipsePts(x + s * 2, y + length * 0.42, length * 0.24, length * 0.34, 18), skin, "contour", {
      shadowFill: shadow,
      shadowK: 0.16,
      seed: 8,
    }),
  ];
  const add = (x0, y0, x1, y1, width) => {
    parts.push(
      shape(limbPolygon(x0, y0, x1, y1, width, width * 0.78), skin, "contour", {
        shadowFill: shadow,
        shadowK: 0.14,
        seed: 9,
      }),
    );
  };
  if (pose === "point") {
    add(x, y + length * 0.2, x - s * 2, y + length * 0.95, w * 0.7);
    add(x + s * w * 0.7, y + length * 0.35, x + s * w, y + length * 0.62, w * 0.75);
    add(x - s * w * 0.15, y + length * 0.4, x + s * w * 0.4, y + length * 0.58, w * 0.7);
    add(x + s * w * 0.9, y + length * 0.15, x + s * w * 1.7, y + length * 0.42, w * 0.8);
  } else if (pose === "fist") {
    add(x, y + length * 0.25, x + s * 4, y + length * 0.58, w * 1.3);
    add(x + s * w, y + length * 0.2, x + s * w * 1.5, y + length * 0.48, w * 0.85);
  } else if (pose === "spread") {
    for (let i = -1; i <= 1; i++)
      add(x + s * i * w * 0.35, y + length * 0.3, x + s * i * w * 0.85, y + length * 0.92, w * 0.72);
    add(x + s * w, y + length * 0.18, x + s * w * 1.8, y + length * 0.48, w * 0.8);
  } else if (pose === "hold") {
    add(x - s * 2, y + length * 0.28, x + s * w * 0.4, y + length * 0.7, w * 0.85);
    add(x + s * w * 0.45, y + length * 0.32, x + s * w, y + length * 0.62, w * 0.8);
    add(x + s * w * 0.8, y + length * 0.12, x + s * w * 1.6, y + length * 0.4, w * 0.8);
  } else {
    for (let i = -1; i <= 1; i++)
      add(x + s * i * w * 0.55, y + length * 0.28, x + s * i * w * 0.62, y + length * 0.92, w * 0.85);
    add(x + s * w * 0.7, y + length * 0.16, x + s * w * 1.55, y + length * 0.48, w * 0.9);
  }
  return parts;
}

const LEADS = {
  dot: {
    name: "Dot Lind",
    voice: { id: "af_nicole", speed: 0.96 },
    hh: 148,
    heightHH: 4.16,
    width: 420,
    hand: 0.5,
    description:
      "Dot Lind, claims adjuster. Blunt bob, slate blazer, cream shirt. Original. No glasses.",
    skin: ["#8A5B3A", "#6B432B"],
    hair: ["#211C24", "#151218"],
    hairHi: "#3A3342",
    cloth: ["#4A6385", "#35496A"],
    shirt: ["#EDE3CC", "#CDBE9E"],
    pants: ["#3B3E46", "#2A2C33"],
    shoes: ["#1F1E23", "#151418"],
    shoeHi: "#3C3B44",
  },
  teo: {
    name: "Teo Lind",
    voice: { id: "am_puck", speed: 1.05 },
    hh: 140,
    heightHH: 4.7,
    width: 420,
    hand: 0.52,
    description:
      "Teo Lind, Dot's brother, repairs off-world appliances. Curl crown, beard, olive overalls.",
    skin: ["#EBC3A0", "#CC9E7E"],
    hair: ["#9A4E2C", "#783A1F"],
    hairHi: "#C98B66",
    cloth: ["#66704A", "#4C5536"],
    shirt: ["#8E9092", "#707274"],
    pants: ["#66704A", "#4C5536"],
    shoes: ["#7A5233", "#5B3C24"],
    shoeHi: "#E2D3A0",
    buckle: "#B9A46A",
  },
  gloam: {
    name: "Gloam",
    voice: { id: "bm_george", speed: 0.9 },
    hh: 200,
    heightHH: 2.12,
    width: 380,
    hand: 0.22,
    description: "Gloam, an alien bookkeeper. Dome head, pear body, brown vest.",
    skin: ["#8AB3A2", "#6B9282"],
    hair: ["#8AB3A2", "#6B9282"],
    hairHi: "#A9CBBE",
    cloth: ["#7A5A44", "#5D4332"],
    shirt: ["#8AB3A2", "#6B9282"],
    pants: ["#8AB3A2", "#6B9282"],
    shoes: ["#6B9282", "#567568"],
    shoeHi: "#A9CBBE",
  },
};

function mouthGroup(f, x, y, width, canonical, view) {
  const scale = width / 40;
  if (!canonical) {
    return shape(
      [
        [x - width * 0.42, y],
        [x, y + width * 0.08],
        [x + width * 0.42, y],
      ],
      "transparent",
      "mouth",
      { open: true, shadow: false, seed: 3 },
    );
  }
  const drawn = visemes.variants.map((variant) => ({
    name: variant.name,
    children: variant.children.map((child) => ({ ...child })),
  }));
  return group("jaw", x, y, [
    group("mouth", 0, 0, drawn.find((item) => item.name === "X").children, {
      x,
      y,
      scaleX: scale,
      scaleY: scale,
      role: "mouth",
      variants: drawn,
    }),
  ], { role: "jaw" });
}

function eyePair(f, y, radius, canonical, view, aspect = 1) {
  const prefix = canonical ? "" : `${view}_`;
  const nodes = [];
  const place = (side) => {
    const far = side === "left";
    const sign = side === "left" ? -1 : 1;
    let rx = radius;
    let x = f.cx + sign * 0.142 * f.HH;
    if (view === "three") {
      if (far) {
        rx = radius * 0.7;
        x = f.cx - 0.06 * f.HH;
      } else x = f.cx + 0.17 * f.HH;
    }
    if (view === "profile") {
      rx = radius * 0.8;
      x = f.cx + (0.46 * f.HH - rx);
    }
    const id = `${prefix}eye_${side === "near" ? "right" : side}`;
    nodes.push(
      group(id, x, y, [
        ellipse(x, y, rx, rx * aspect, "#F4F0E4", "eye", { id: `${prefix}sclera_${side}`, seed: 5 }),
        ellipse(x + (view === "three" && !far ? rx * 0.12 : 0), y, Math.max(3.4, rx * 0.22), Math.max(3.4, rx * 0.22), INK, "none", {
          id: `${prefix}pupil_${side}`,
          role: canonical ? "pupil" : undefined,
        }),
      ], { role: canonical ? "eye" : undefined }),
    );
  };
  if (view === "profile") place("right");
  else {
    place("left");
    place("right");
  }
  return nodes;
}

function brows(f, y, canonical, view) {
  const sides = view === "profile" ? ["right"] : ["left", "right"];
  return sides.map((side) => {
    const sign = side === "left" ? -1 : 1;
    const x = view === "profile" ? 0.28 : sign * 0.2;
    const id = canonical ? `brow_${side}` : undefined;
    return stroke(
      f,
      [
        [x - 0.12, y],
        [x + 0.12, y - 0.015],
      ],
      "interior",
      {
        id,
        role: canonical ? (side === "left" ? "leftBrow" : "rightBrow") : undefined,
        seed: 6,
      },
    );
  });
}

function dotHead(f, canonical, view) {
  const skin = LEADS.dot.skin;
  const hair = LEADS.dot.hair;
  const faceW = view === "three" ? 0.92 * 0.95 : 0.92;
  const nodes = [];
  if (view === "profile") {
    nodes.push(
      fill(f, [
        [-0.58, 0.2], [-0.42, -0.08], [0.05, -0.12], [0.4, 0.02], [0.46, 0.28],
        [0.08, 0.34], [-0.22, 0.58], [-0.58, 0.5],
      ], hair[0], "contour", { id: canonical ? "hair" : undefined, role: canonical ? "hair" : undefined, shadowFill: hair[1], seed: 2 }),
      fill(f, [
        [-0.08, 1.02], [-0.02, 0.4], [0.22, 0.02], [0.46, 0.16], [0.44, 0.48],
        [0.52, 0.58], [0.44, 0.66], [0.38, 0.78], [0.32, 1.02],
      ], skin[0], "contour", { id: canonical ? "skull" : undefined, shadowFill: skin[1], shadowK: 0.12, seed: 2 }),
      ...eyePair(f, f.Y(0.42), 0.147 * f.HH, canonical, view),
      stroke(f, [[0.44, 0.5], [0.52, 0.58], [0.4, 0.66]], "interior", { id: canonical ? "nose" : undefined, seed: 6 }),
      ...brows(f, 0.22, canonical, view),
      mouthGroup(f, f.cx + 0.368 * f.HH, f.Y(0.78), 0.3 * 0.92 * f.HH, canonical, view),
    );
    return nodes;
  }
  const skull = roundRectPts(-faceW / 2, 0.02, faceW, 0.98, 0.2, 0.3).map(([x, y]) => at(f, x, y));
  const bob = roundRectPts(-0.62, -0.1, 1.24, 0.7, 0.48, 0.08).map(([x, y]) => at(f, x, y));
  nodes.push(
    shape(bob, hair[0], "contour", {
      id: canonical ? "hair" : undefined,
      role: canonical ? "hair" : undefined,
      shadowFill: hair[1],
      shadowK: 0.12,
      seed: 2,
    }),
    ellipse(f.cx - 0.18 * f.HH, f.Y(0.08), 0.16 * f.HH, 0.06 * f.HH, LEADS.dot.hairHi, "none"),
    shape(skull, skin[0], "contour", {
      id: canonical ? "skull" : undefined,
      shadowFill: skin[1],
      shadowK: 0.12,
      seed: 2,
    }),
    ...eyePair(f, f.Y(0.42), 0.147 * f.HH, canonical, view),
    fill(f, [
      [-0.58, 0.02], [-0.15, -0.04], [0.28, -0.02], [0.58, 0.05],
      [0.56, 0.31], [0.16, 0.33], [-0.18, 0.33], [-0.56, 0.3],
    ], hair[0], "contour", { shadow: false, seed: 2 }),
    stroke(
      f,
      view === "three"
        ? [[0.04, 0.52], [-0.1, 0.62], [0.02, 0.68]]
        : [[-0.02, 0.52], [0.08, 0.62], [-0.02, 0.68]],
      "interior",
      { id: canonical ? "nose" : undefined, seed: 6 },
    ),
    ...brows(f, 0.22, canonical, view),
    mouthGroup(
      f,
      f.cx + (view === "three" ? -0.12 * 0.92 * f.HH : 0),
      f.Y(0.78),
      0.3 * faceW * f.HH,
      canonical,
      view,
    ),
  );
  return nodes;
}

function teoHead(f, canonical, view) {
  const skin = LEADS.teo.skin;
  const hair = LEADS.teo.hair;
  const W = view === "three" ? 0.78 * 0.95 : 0.78;
  const nodes = [];
  const spots = [
    [-0.34, -0.02, 0.11], [-0.18, -0.12, 0.12], [0.02, -0.14, 0.12],
    [0.2, -0.08, 0.11], [0.34, 0.04, 0.1], [-0.32, 0.12, 0.09], [0.3, 0.16, 0.09],
  ];
  spots.forEach((spot, index) => {
    if (view === "profile" && spot[0] < -0.05) return;
    const x = f.cx + spot[0] * f.HH * (view === "profile" ? 0.75 : 1) + (view === "three" ? 6 : 0);
    nodes.push(
      ellipse(x, f.Y(spot[1] + 0.12), spot[2] * f.HH, spot[2] * f.HH * 0.9, hair[0], "contour", {
        id: canonical && index === 2 ? "hair" : undefined,
        role: canonical && index === 2 ? "hair" : undefined,
        shadow: true,
        shadowFill: hair[1],
        shadowK: 0.1,
        seed: 2 + index,
      }),
    );
  });
  if (view === "profile") {
    nodes.push(
      fill(f, [
        [-0.04, 1.08], [0.02, 0.28], [0.28, 0.02], [0.48, 0.22], [0.46, 0.5],
        [0.54, 0.58], [0.42, 0.68], [0.22, 1.08], [-0.02, 1.12],
      ], skin[0], "contour", { shadowFill: skin[1], shadowK: 0.12, seed: 3 }),
    );
  } else {
    const skull = roundRectPts(-W / 2, 0.02, W, 1.02, 0.36, 0.22).map(([x, y]) => at(f, x, y));
    nodes.push(shape(skull, skin[0], "contour", { shadowFill: skin[1], shadowK: 0.12, seed: 3 }));
  }
  const beardShift = view === "three" ? 0.04 : 0;
  nodes.push(
    fill(f, [
      [-0.34 + beardShift, 0.56], [-0.3, 1.02], [-0.08, 1.12], [0.16, 1.1],
      [0.36, 0.58], [0.16, 0.7], [0, 0.74], [-0.16, 0.68],
    ], hair[0], "contour", { shadowFill: hair[1], shadowK: 0.14, seed: 3 }),
  );
  for (const [fx, fy] of [[-0.16, 0.48], [-0.08, 0.52], [0.1, 0.5], [0.18, 0.46], [0.04, 0.56]]) {
    if (view === "profile" && fx < 0) continue;
    nodes.push(ellipse(f.cx + fx * f.HH, f.Y(fy), 1.6, 1.6, LEADS.teo.hairHi, "none"));
  }
  const eyeR = (0.36 * 0.78 * f.HH) / 2;
  nodes.push(
    ...eyePair(f, f.Y(0.4), eyeR, canonical, view, 1.06),
    stroke(
      f,
      view === "profile"
        ? [[0.42, 0.5], [0.54, 0.58], [0.4, 0.66]]
        : [[0.01, 0.5], [0.1, 0.6], [0, 0.66]],
      "interior",
      { id: canonical ? "nose" : undefined, seed: 6 },
    ),
    ...brows(f, 0.2, canonical, view),
    mouthGroup(
      f,
      f.cx + (view === "profile" ? 0.28 * f.HH : view === "three" ? -0.12 * W * f.HH : 0),
      f.Y(0.8),
      0.3 * W * f.HH,
      canonical,
      view,
    ),
  );
  return nodes;
}

function gloamHead(f, canonical, view) {
  const skin = LEADS.gloam.skin;
  const cloth = LEADS.gloam.cloth;
  const w = view === "profile" ? 0.82 : view === "three" ? 0.95 : 1;
  const side = [
    [0, -0.02], [0.2 * w, 0.0], [0.48 * w, 0.18], [0.5 * w, 0.55], [0.36 * w, 0.95],
    [0.34 * w, 1.08], [0.46 * w, 1.35], [0.48 * w, 1.58], [0.2 * w, 1.78],
    [0.18 * w, 2.08], [0.04 * w, 2.12], [0, 2.12],
  ];
  const outline = view === "profile"
    ? smoothClosed([
      [-0.06, 2.1], [0.02, 1.2], [0.12, 0.35], [0.42, 0.05], [0.5, 0.5],
      [0.34, 1.0], [0.46, 1.45], [0.28, 1.75], [0.16, 2.1],
    ])
    : smoothClosed([...side, ...side.slice(1, -1).reverse().map(([x, y]) => [-x, y])]);
  const vest = smoothClosed(view === "profile"
    ? [[0.04, 1.14], [0.32, 1.08], [0.3, 1.48], [0.04, 1.5]]
    : [[-0.28 * w, 1.16], [-0.1 * w, 1.28], [0, 1.22], [0.1 * w, 1.28], [0.28 * w, 1.16], [0.26 * w, 1.5], [-0.26 * w, 1.5]]);
  const eyeR = (0.3 * f.HH) / 2;
  return [
    shape(outline.map(([x, y]) => at(f, x, y)), skin[0], "contour", {
      id: canonical ? "skull" : undefined,
      shadowFill: skin[1],
      shadowK: 0.12,
      seed: 2,
    }),
    shape(vest.map(([x, y]) => at(f, x, y)), cloth[0], "contour", { shadowFill: cloth[1], shadowK: 0.14, seed: 4 }),
    ...eyePair(f, f.Y(0.45), eyeR * (view === "profile" ? 0.8 : 1), canonical, view),
    mouthGroup(
      f,
      f.cx + (view === "profile" ? 0.18 * f.HH : view === "three" ? -0.05 * f.HH : 0),
      f.Y(0.7),
      0.18 * f.HH,
      canonical,
      view,
    ),
  ];
}

function shoes(f, spec, signs) {
  return signs.flatMap((sign) => [
    fill(f, [
      [sign * 0.02, spec.ankle],
      [sign * 0.32, spec.ankle],
      [sign * 0.36, spec.ankle + 0.12],
      [sign * 0.0, spec.ankle + 0.1],
    ], spec.colors[0], "contour", { shadowFill: spec.colors[1], seed: 7 }),
    ellipse(f.cx + sign * 0.18 * f.HH, f.Y(spec.ankle + 0.03), 7, 2.5, spec.hi, "none"),
  ]);
}

function dotOutfit(f, view) {
  const spec = LEADS.dot;
  const parts = [];
  if (view === "profile") {
    parts.push(
      fill(f, [
        [-0.02, 1.02], [0.14, 1.02], [0.2, 1.16], [0.52, 1.2], [0.46, 1.85],
        [0.4, 2.34], [0.08, 2.38], [0.02, 1.2],
      ], spec.cloth[0], "contour", { shadowFill: spec.cloth[1], shadowK: 0.12, seed: 4 }),
      fill(f, [[0.16, 1.18], [0.34, 1.16], [0.28, 1.7], [0.14, 1.55]], spec.shirt[0], "contour", { shadowFill: spec.shirt[1], shadow: false, seed: 4 }),
    );
    return parts;
  }
  const tuck = view === "three" ? 0.1 : 0;
  parts.push(
    fill(f, [[-0.12, 0.98], [0.12, 0.98], [0.14, 1.24], [-0.14, 1.24]], spec.skin[0], "contour", { shadowFill: spec.skin[1], shadowK: 0.16, seed: 4 }),
    fill(f, [
      [-0.52 + tuck, 1.24], [-0.46 + tuck, 1.08], [-0.18, 1.16], [-0.08, 1.86],
      [0.08, 1.86], [0.18, 1.16], [0.46, 1.08], [0.52, 1.24],
      [0.48, 2.12], [0.4, 2.52], [-0.38 + tuck * 0.4, 2.52], [-0.48 + tuck, 2.12],
    ], spec.cloth[0], "contour", { shadowFill: spec.cloth[1], shadowK: 0.12, role: "body", seed: 4 }),
    fill(f, [[-0.1, 1.2], [0, 1.78], [0.1, 1.2]], spec.shirt[0], "contour", { shadowFill: spec.shirt[1], shadow: false, seed: 4 }),
    fill(f, [[-0.2, 1.16], [-0.02, 1.22], [-0.06, 1.72], [-0.18, 1.4]], spec.cloth[0], "contour", { shadowFill: spec.cloth[1], shadow: false, seed: 4 }),
    fill(f, [[0.02, 1.22], [0.2, 1.16], [0.18, 1.4], [0.06, 1.72]], spec.cloth[0], "contour", { shadowFill: spec.cloth[1], shadow: false, seed: 4 }),
    ellipse(f.cx, f.Y(1.92), 4, 4, spec.cloth[1], "interior", { shadow: false }),
    fill(f, [[-0.46, 1.72], [-0.24, 1.7], [-0.22, 1.96], [-0.48, 1.98]], spec.cloth[0], "contour", { shadow: false, seed: 5 }),
    fill(f, [[0.24, 1.7], [0.46, 1.72], [0.48, 1.98], [0.22, 1.96]], spec.cloth[0], "contour", { shadow: false, seed: 5 }),
    stroke(f, [[-0.46, 1.72], [0.46, 1.72]], "interior", { seed: 5 }),
  );
  return parts;
}

function teoOutfit(f, view) {
  const spec = LEADS.teo;
  const parts = [];
  if (view === "profile") {
    parts.push(
      fill(f, [[0.02, 1.05], [0.16, 1.08], [0.48, 1.2], [0.4, 2.2], [0.28, 2.55], [0.06, 2.5]], spec.shirt[0], "contour", { shadowFill: spec.shirt[1], seed: 4 }),
      fill(f, [[0.08, 1.18], [0.42, 1.22], [0.36, 2.58], [0.1, 2.55]], spec.cloth[0], "contour", { shadowFill: spec.cloth[1], seed: 4 }),
    );
    return parts;
  }
  parts.push(
    fill(f, [[-0.1, 0.98], [0.1, 0.98], [0.12, 1.28], [-0.12, 1.28]], spec.skin[0], "contour", { shadowFill: spec.skin[1], shadowK: 0.16, seed: 4 }),
    fill(f, [
      [-0.48, 1.18], [-0.16, 1.12], [0.16, 1.12], [0.48, 1.18],
      [0.42, 2.2], [0.22, 2.55], [-0.22, 2.55], [-0.42, 2.2],
    ], spec.shirt[0], "contour", { shadowFill: spec.shirt[1], shadowK: 0.12, seed: 4 }),
    fill(f, [
      [-0.34, 1.35], [-0.16, 1.42], [0.16, 1.42], [0.34, 1.35],
      [0.4, 2.7], [0.16, 2.78], [-0.16, 2.78], [-0.4, 2.7],
    ], spec.cloth[0], "contour", { shadowFill: spec.cloth[1], shadowK: 0.12, role: "body", seed: 4 }),
    fill(f, [[-0.28, 1.12], [-0.2, 1.16], [-0.18, 1.42], [-0.3, 1.38]], spec.cloth[0], "contour", { shadowFill: spec.cloth[1], shadow: false, seed: 5 }),
    fill(f, [[0.2, 1.16], [0.28, 1.12], [0.3, 1.38], [0.18, 1.42]], spec.cloth[0], "contour", { shadowFill: spec.cloth[1], shadow: false, seed: 5 }),
    ellipse(f.cx - 0.24 * f.HH, f.Y(1.28), 6, 4, spec.buckle, "prop", { shadow: false }),
    ellipse(f.cx + 0.24 * f.HH, f.Y(1.28), 6, 4, spec.buckle, "prop", { shadow: false }),
    ellipse(f.cx - 0.24 * f.HH, f.Y(1.27), 2.5, 1.4, spec.shoeHi, "none"),
    ellipse(f.cx + 0.24 * f.HH, f.Y(1.27), 2.5, 1.4, spec.shoeHi, "none"),
    fill(f, [[-0.16, 1.7], [0.16, 1.7], [0.16, 2.05], [-0.16, 2.05]], spec.cloth[1], "interior", { shadow: false, seed: 5 }),
    fill(f, [[-0.02, 1.78], [0.03, 1.78], [0.04, 2.02], [-0.03, 2.02]], "#C7B27A", "prop", { shadow: false, seed: 5 }),
  );
  return parts;
}

function gloamOutfit() {
  return [];
}

function arms(id, f, view, canonical) {
  const spec = LEADS[id];
  const shoulderY = id === "gloam" ? 1.12 : 1.22;
  const elbowY = id === "gloam" ? 1.42 : id === "teo" ? 2.02 : 1.95;
  const wristY = id === "gloam" ? 1.62 : id === "teo" ? 2.82 : 2.58;
  const reach = id === "gloam" ? 0.36 : id === "teo" ? 0.46 : 0.5;
  const elbowOut = id === "gloam" ? 0.4 : reach + 0.06;
  const upperW = f.HH * (id === "gloam" ? 0.18 : id === "dot" ? 0.32 : 0.2);
  const lowerW = upperW * 0.82;
  const fillColor = id === "teo" ? spec.shirt[0] : id === "dot" ? spec.cloth[0] : spec.skin[0];
  const shadow = id === "teo" ? spec.shirt[1] : id === "dot" ? spec.cloth[1] : spec.skin[1];
  const sides = view === "profile" ? ["right"] : ["left", "right"];
  const nodes = { far: [], near: [] };
  for (const side of sides) {
    const sign = side === "left" ? -1 : 1;
    const prefix = canonical ? "" : `${view}_`;
    const shoulder = at(f, sign * (id === "gloam" ? 0.3 : id === "teo" ? 0.38 : 0.46), shoulderY);
    const elbow = at(f, sign * elbowOut, elbowY);
    const wrist = at(f, sign * reach, wristY);
    const poses = ["relaxed", "point", "fist", "spread", "hold"];
    const hand = (pose) => handDraw(wrist[0], wrist[1], spec.skin[0], spec.skin[1], side, pose, spec.hand * f.HH);
    const upperId = `${prefix}${side}_upper_arm`;
    const node = group(upperId, shoulder[0], shoulder[1], [
      limb(`${upperId}_shape`, shoulder, elbow, upperW, upperW * 0.86, fillColor, shadow),
      group(`${prefix}${side}_forearm`, elbow[0], elbow[1], [
        limb(`${prefix}${side}_fore_shape`, elbow, wrist, upperW * 0.86, lowerW, fillColor, shadow),
        ...(id === "dot"
          ? [ellipse(wrist[0], wrist[1] - 4, lowerW * 0.46, 6, spec.shirt[0], "contour", { shadow: false })]
          : []),
        group(`${prefix}${side}_hand`, wrist[0], wrist[1], hand("relaxed"), {
          role: canonical ? "hand" : undefined,
          ...(canonical
            ? { variants: poses.map((pose) => ({ name: pose, children: hand(pose) })) }
            : {}),
        }),
      ]),
    ], { role: canonical ? (side === "left" ? "leftArm" : "rightArm") : undefined });
    (side === "left" ? nodes.far : nodes.near).push(node);
  }
  return nodes;
}

function legs(id, f, view, canonical) {
  if (id === "gloam") return { far: [], near: [] };
  const spec = LEADS[id];
  const hipY = id === "teo" ? 2.48 : 2.32;
  const kneeY = id === "teo" ? 3.65 : 3.3;
  const ankleY = id === "teo" ? 4.55 : 4.08;
  const x = 0.13;
  const w = f.HH * (id === "teo" ? 0.3 : 0.28);
  const sides = view === "profile" ? ["right"] : ["left", "right"];
  const out = { far: [], near: [] };
  for (const side of sides) {
    const sign = side === "left" ? -1 : 1;
    const prefix = canonical ? "" : `${view}_`;
    const hip = at(f, sign * x, hipY);
    const knee = at(f, sign * (x + 0.02), kneeY);
    const ankle = at(f, sign * x, ankleY);
    const node = group(`${prefix}${side}_thigh`, hip[0], hip[1], [
      limb(`${prefix}${side}_thigh_shape`, hip, knee, w, w * 0.9, spec.pants[0], spec.pants[1]),
      group(`${prefix}${side}_shin`, knee[0], knee[1], [
        limb(`${prefix}${side}_shin_shape`, knee, ankle, w * 0.9, w * 0.78, spec.pants[0], spec.pants[1]),
        ...(id === "teo"
          ? [
            shape(limbPolygon(ankle[0], ankle[1], ankle[0] + sign * w * 0.35, ankle[1] + f.HH * 0.16, w * 0.9, w * 0.7), spec.shoes[0], "contour", {
              shadowFill: spec.shoes[1],
              seed: 7,
            }),
            ellipse(ankle[0] + sign * 8, ankle[1] + 8, 8, 3, spec.shoeHi, "none"),
          ]
          : [
            shape(
              [
                [ankle[0] - w * 0.2, ankle[1] - 2],
                [ankle[0] + sign * w * 0.15, ankle[1] - 2],
                [ankle[0] + sign * w * 0.55, ankle[1] + 14],
                [ankle[0] - w * 0.35, ankle[1] + 12],
              ],
              spec.shoes[0],
              "contour",
              { shadowFill: spec.shoes[1], seed: 7 },
            ),
            ellipse(ankle[0] + sign * 6, ankle[1] + 4, 7, 2.4, spec.shoeHi, "none"),
          ]),
      ]),
    ], { role: canonical ? (side === "left" ? "leftLeg" : "rightLeg") : undefined });
    (side === "left" ? out.far : out.near).push(node);
  }
  return out;
}

function backFigure(id, f) {
  const spec = LEADS[id];
  if (id === "gloam") {
    return [
      shape(ellipsePts(f.cx, f.Y(1.42), 0.46 * f.HH, 0.5 * f.HH, 32), spec.skin[0], "contour", { shadowFill: spec.skin[1], seed: 2 }),
      shape(ellipsePts(f.cx, f.Y(0.46), 0.5 * f.HH, 0.5 * f.HH, 36), spec.skin[0], "contour", { shadowFill: spec.skin[1], seed: 2 }),
      fill(f, [[-0.3, 1.08], [0.3, 1.08], [0.28, 1.5], [-0.28, 1.5]], spec.cloth[0], "contour", { shadowFill: spec.cloth[1], seed: 4 }),
    ];
  }
  const hair = id === "dot"
    ? [shape(roundRectPts(-0.62, -0.1, 1.24, 0.68, 0.48, 0.1).map(([x, y]) => at(f, x, y)), spec.hair[0], "contour", { shadowFill: spec.hair[1], seed: 2 })]
    : [[-0.34, -0.02, 0.11], [0, -0.12, 0.12], [0.28, -0.04, 0.11], [-0.2, 0.1, 0.1], [0.22, 0.12, 0.09]].map((spot, index) =>
      ellipse(f.cx + spot[0] * f.HH, f.Y(spot[1] + 0.14), spot[2] * f.HH, spot[2] * f.HH, spec.hair[0], "contour", {
        shadow: true,
        shadowFill: spec.hair[1],
        seed: index + 2,
      }));
  const cloth = id === "dot" ? spec.cloth : spec.shirt;
  const body = id === "dot" ? spec.cloth : spec.cloth;
  return [
    ...hair,
    fill(f, [[-0.12, 0.95], [0.12, 0.95], [0.14, 1.22], [-0.14, 1.22]], id === "dot" ? spec.skin[0] : spec.skin[0], "contour", { shadowFill: spec.skin[1], seed: 3 }),
    fill(f, [
      [-0.62, 1.18], [-0.2, 1.1], [0.2, 1.1], [0.62, 1.18], [0.52, 2.34], [-0.52, 2.34],
    ], id === "dot" ? spec.cloth[0] : cloth[0], "contour", { shadowFill: id === "dot" ? spec.cloth[1] : cloth[1], seed: 4 }),
    ...(id === "teo"
      ? [
        fill(f, [[-0.22, 1.16], [-0.08, 1.55], [0.08, 1.55], [0.22, 1.16], [0.16, 1.2], [-0.16, 1.2]], spec.cloth[0], "contour", { shadowFill: spec.cloth[1], seed: 5 }),
        fill(f, [[-0.36, 2.2], [0.36, 2.2], [0.34, 4.55], [-0.34, 4.55]], spec.pants[0], "contour", { shadowFill: spec.pants[1], seed: 5 }),
      ]
      : [
        stroke(f, [[0, 1.2], [0, 2.2]], "interior", { seed: 5 }),
        fill(f, [[-0.28, 2.28], [0.28, 2.28], [0.26, 4.08], [-0.26, 4.08]], spec.pants[0], "contour", { shadowFill: spec.pants[1], seed: 5 }),
      ]),
    ...shoes(f, { colors: spec.shoes, hi: spec.shoeHi, ankle: id === "teo" ? 4.55 : 4.08 }, [-1, 1]),
  ];
}

function buildFigure(id, view, canonical) {
  const f = frameFor(id);
  if (view === "back") return backFigure(id, f);
  const headParts = id === "dot" ? dotHead(f, canonical, view) : id === "teo" ? teoHead(f, canonical, view) : gloamHead(f, canonical, view);
  const head = group(canonical ? "head" : `head_${view}`, f.cx, f.Y(0.4), headParts, {
    role: canonical ? "head" : undefined,
  });
  const arm = arms(id, f, view, canonical);
  const leg = legs(id, f, view, canonical);
  const outfit = id === "dot" ? dotOutfit(f, view) : id === "teo" ? teoOutfit(f, view) : gloamOutfit();
  return [...arm.far, ...leg.far, ...outfit, ...leg.near, head, ...arm.near];
}

export function leadLimbs(id = "dot") {
  const f = frameFor(id);
  const shoulderY = id === "gloam" ? 1.12 : 1.22;
  const elbowY = id === "gloam" ? 1.42 : id === "teo" ? 2.02 : 1.95;
  const wristY = id === "gloam" ? 1.62 : id === "teo" ? 2.82 : 2.58;
  const reach = id === "gloam" ? 0.36 : id === "teo" ? 0.46 : 0.5;
  const elbowOut = id === "gloam" ? 0.4 : reach + 0.06;
  const shoulderX = id === "gloam" ? 0.3 : id === "teo" ? 0.38 : 0.46;
  const arm = (sign) => ({
    shoulder: { x: f.cx + sign * f.HH * shoulderX, y: f.Y(shoulderY) },
    elbow: { x: f.cx + sign * f.HH * elbowOut, y: f.Y(elbowY) },
    wrist: { x: f.cx + sign * f.HH * reach, y: f.Y(wristY) },
  });
  return { left: arm(-1), right: arm(1) };
}

export const DOT_LIMBS = leadLimbs("dot");

export function buildLead(id, options = {}) {
  const spec = LEADS[id];
  if (!spec) throw new Error("Unknown lead.");
  const primary = options.primaryView || "front";
  const viewName = { front: "front", threeQuarter: "three", profile: "profile", back: "back" };
  const primaryKey = viewName[primary] || "front";
  const shapes = ["front", "three", "profile", "back"].map((view) =>
    group(
      view === "three" ? "turn_three" : `turn_${view}`,
      spec.width / 2,
      80,
      buildFigure(id, view, primaryKey === view),
      { turnaround: true },
    ),
  );
  return validateAsset({
    id: options.id || id,
    name: options.name || spec.name,
    kind: "character",
    description: spec.description,
    width: spec.width,
    height: Math.ceil(28 + spec.heightHH * spec.hh + 4),
    voice: spec.voice,
    shapes,
  });
}

export const CAST = ["dot", "teo", "gloam"].map((id) => ({
  id,
  name: LEADS[id].name,
  kind: "character",
  description: LEADS[id].description,
  defaultParameters: { ink: INK },
}));

export function castShowcase() {
  return validateEpisode({
    version: 1,
    title: "Lind house",
    logline: "Dot, Teo and Gloam.",
    genre: "Adult animated sitcom",
    style: "Flat cel, ink on characters, local colour on the set.",
    assets: ["dot", "teo", "gloam"].map((id) => buildLead(id)),
    scenes: [
      {
        id: "lineup",
        name: "Lineup",
        duration: 4,
        background: "#E0D3B4",
        lightAngleDeg: 135,
        contactShadow: "#898d73",
        camera: { x: 640, y: 390, zoom: 1, zoomEnd: 1 },
        instances: [
          { id: "dot", assetId: "dot", x: 280, y: 700, scale: 0.86, motion: "still", view: "front" },
          { id: "teo", assetId: "teo", x: 640, y: 708, scale: 0.82, motion: "still", view: "threeQuarter" },
          { id: "gloam", assetId: "gloam", x: 980, y: 690, scale: 0.9, motion: "still", view: "front" },
        ],
        dialogue: [],
      },
    ],
  });
}
