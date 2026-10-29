import { validateAsset } from "./model.js";
import { HEADS, eyes, tf } from "./heads.mjs";
import visemes from "./mouth-visemes.dot.json" with { type: "json" };

const INK = "#221D26";

function pathFrom(points, close = true) {
  if (!points.length) return "";
  const body = points
    .map((p, i) => `${i ? "L" : "M"}${p[0].toFixed(2)} ${p[1].toFixed(2)}`)
    .join(" ");
  return close ? `${body} Z` : body;
}

const LEADS = {
  dot: {
    name: "Dot Lind",
    voice: { id: "af_nicole", speed: 0.96 },
    hh: 108,
    heightHH: 4.25,
    width: 340,
    description:
      "Dot Lind, a claims adjuster for the municipal Office of Anomalous Losses. Rectangle head, blunt bob, slate blazer. Original. No glasses.",
    parts: {
      skin: ["#8A5B3A", "#6B432B"],
      hair: ["#211C24", "#151218"],
      blazer: ["#4A6385", "#35496A"],
      shirt: ["#EDE3CC", "#CDBE9E"],
      trousers: ["#3B3E46", "#2A2C33"],
      shoes: ["#1F1E23", "#151418"],
    },
    hairHighlight: "#3A3342",
    shoeHighlight: "#3C3B44",
  },
  teo: {
    name: "Teo Lind",
    voice: { id: "am_puck", speed: 1.05 },
    hh: 100,
    heightHH: 4.75,
    width: 360,
    description:
      "Teo Lind, Dot's younger brother. He repairs off-world appliances. Capsule head, curl crown, olive overalls. Original tradesman, not a scientist.",
    parts: {
      skin: ["#EBC3A0", "#CC9E7E"],
      hair: ["#9A4E2C", "#783A1F"],
      shirt: ["#8E9092", "#707274"],
      overalls: ["#66704A", "#4C5536"],
      boots: ["#7A5233", "#5B3C24"],
    },
    buckle: "#B9A46A",
    buckleHi: "#E2D3A0",
    freckle: "#C98B66",
  },
  gloam: {
    name: "Gloam",
    voice: { id: "bm_george", speed: 0.9 },
    hh: 168,
    heightHH: 2.15,
    width: 300,
    description:
      "Gloam, a centuries-old alien bookkeeper lodging in Dot's spare room. Dome head, pear body, brown vest. Original.",
    parts: {
      skin: ["#8AB3A2", "#6B9282"],
      vest: ["#7A5A44", "#5D4332"],
    },
  },
};

function mouthVariants(scale = 1) {
  return visemes.variants.map((variant) => ({
    name: variant.name,
    children: variant.children.map((shape) => ({
      ...shape,
      line: shape.line,
      seed: shape.seed,
    })),
    scale,
  }));
}

function leadAsset(id, options = {}) {
  const spec = LEADS[id];
  if (!spec) throw new Error("Unknown lead.");
  const HH = spec.hh;
  const cx = spec.width / 2;
  const top = 28;
  const X = (x) => cx + x * HH;
  const Y = (y) => top + y * HH;
  const map = (pts) => pts.map(([x, y]) => [X(x), Y(y)]);
  const P = (pts, fill, line, extra = {}) => ({
    type: "path",
    path: pathFrom(pts, extra.open ? false : true),
    fill: extra.open ? "transparent" : fill,
    stroke: line === "none" || line === "detail" ? extra.stroke || fill : INK,
    strokeWidth: 0,
    line,
    shadow: extra.shadow !== false && !extra.open && line !== "none" && line !== "detail" && line !== "interior" && line !== "mouth",
    shadowK: extra.shadowK ?? (line === "contour" ? 0.14 : 0.18),
    seed: extra.seed ?? 1,
    ...extra,
  });
  const E = (x, y, rx, ry, fill, line, extra = {}) => ({
    type: "ellipse",
    x,
    y,
    rx,
    ry,
    fill,
    stroke: line === "none" ? "none" : INK,
    strokeWidth: 0,
    line,
    shadow: extra.shadow === true,
    seed: extra.seed ?? 1,
    ...extra,
  });
  const G = (gid, px, py, children, extra = {}) => ({
    type: "group",
    id: gid,
    pivotX: px,
    pivotY: py,
    children,
    ...extra,
  });
  const headSpec = HEADS[id];
  const [lx, rx] = eyes(headSpec);
  const eyeShapes = (prefix, sideScale = 1) => {
    const nodes = [];
    for (const [ex, ey, erx, ery] of [lx, rx]) {
      const side = ex < 0 ? "left" : "right";
      if (prefix === "pf_" && side === "left") continue;
      const s = prefix === "pf_" ? 0.8 : prefix === "tq_" && side === "left" ? 0.7 : sideScale;
      const shift = prefix === "tq_" && side === "left" ? headSpec.W * 0.2 : prefix === "pf_" ? headSpec.W * 0.08 : 0;
      const x = X(ex * (prefix === "tq_" ? 0.9 : 1) + shift);
      const y = Y(ey);
      nodes.push(
        G(`${prefix}eye_${side}`, x, y, [
          E(x, y, erx * HH * s, ery * HH * s, "#F4F0E4", "eye", {
            id: `${prefix}sclera_${side}`,
            shadow: false,
          }),
          E(
            x,
            y,
            Math.max(2.2, erx * HH * s * 0.11),
            Math.max(2.2, erx * HH * s * 0.11),
            INK,
            "none",
            { id: `${prefix}pupil_${side}`, shadow: false, role: "pupil" },
          ),
        ], { role: "eye" }),
      );
    }
    return nodes;
  };
  const skull = map(headSpec.skull());
  const neck = headSpec.neck ? map(headSpec.neck()) : map([[-0.16, 0.92], [0.16, 0.92], [0.18, 1.15], [-0.18, 1.15]]);
  const nose = headSpec.nose ? P(map(headSpec.nose()), "transparent", "interior", { open: true, id: "nose", role: "decoration", shadow: false, stroke: INK }) : null;
  const mouthW = headSpec.mouthW * HH;
  const mouthScale = mouthW / 40;
  const mouth = G("mouth", X(0), Y(headSpec.mouthY), visemes.variants.map(() => []) && [
    {
      type: "group",
      id: "mouth_draw",
      x: X(0),
      y: Y(headSpec.mouthY),
      scaleX: mouthScale,
      scaleY: mouthScale,
      role: "mouth",
      children: [],
      variants: visemes.variants.map((variant) => ({
        name: variant.name,
        children: variant.children.map((shape) => ({ ...shape })),
      })),
    },
  ]);
  // The inner group carries the drawing; outer jaw is the pivot.
  const jaw = G("jaw", X(0), Y(headSpec.mouthY), [
    {
      type: "group",
      id: "mouth",
      x: X(0),
      y: Y(headSpec.mouthY),
      pivotX: X(0),
      pivotY: Y(headSpec.mouthY),
      scaleX: mouthScale,
      scaleY: mouthScale,
      role: "mouth",
      children: visemes.variants[0].children.map((shape) => ({ ...shape })),
      variants: visemes.variants.map((variant) => ({
        name: variant.name,
        children: variant.children.map((shape) => ({ ...shape })),
      })),
    },
  ], { role: "jaw" });

  const limb = (gid, role, a, b, width, fill, shadow) => {
    const dx = b[0] - a[0];
    const dy = b[1] - a[1];
    const len = Math.hypot(dx, dy) || 1;
    const nx = (-dy / len) * width * 0.5;
    const ny = (dx / len) * width * 0.5;
    const overlap = width * 0.22;
    const ux = (dx / len) * overlap;
    const uy = (dy / len) * overlap;
    return G(gid, a[0], a[1], [
      E(a[0], a[1], width * 0.52, width * 0.52, fill, "none", { shadow: false }),
      P(
        [
          [a[0] + nx - ux, a[1] + ny - uy],
          [a[0] - nx - ux, a[1] - ny - uy],
          [b[0] - nx + ux, b[1] - ny + uy],
          [b[0] + nx + ux, b[1] + ny + uy],
        ],
        fill,
        "contour",
        { shadow: true, shadowK: 0.2 },
      ),
    ], { role });
  };

  const yShoulder = Y(1.22);
  const yElbow = Y(id === "gloam" ? 1.45 : 1.95);
  const yWrist = Y(id === "gloam" ? 1.58 : 2.6);
  const yHip = Y(id === "gloam" ? 1.55 : id === "teo" ? 2.6 : 2.35);
  const yKnee = Y(id === "gloam" ? 1.85 : id === "teo" ? 3.65 : 3.3);
  const yAnkle = Y(id === "gloam" ? 2.05 : id === "teo" ? 4.6 : 4.1);
  const armW = HH * (id === "gloam" ? 0.16 : 0.2);
  const legW = HH * (id === "gloam" ? 0.18 : 0.22);
  const cloth = id === "dot" ? spec.parts.blazer : id === "teo" ? spec.parts.overalls : spec.parts.skin;
  const legCloth = id === "dot" ? spec.parts.trousers : id === "teo" ? spec.parts.overalls : spec.parts.skin;
  const armFill = id === "teo" ? spec.parts.shirt[0] : id === "dot" ? spec.parts.blazer[0] : spec.parts.skin[0];

  const hand = (side, wrist) => {
    const x = wrist[0];
    const y = wrist[1];
    const s = side === "left" ? -1 : 1;
    const skin = spec.parts.skin[0];
    const relaxed = [
      P(
        [
          [x - 8 * s, y],
          [x + 10 * s, y - 4],
          [x + 14 * s, y + 18],
          [x + 6 * s, y + 28],
          [x - 8 * s, y + 24],
          [x - 14 * s, y + 10],
        ],
        skin,
        "contour",
        { shadowK: 0.2 },
      ),
    ];
    return G(`${side}_hand`, x, y, relaxed, {
      role: "hand",
      variants: [
        { name: "relaxed", children: relaxed },
        { name: "point", children: relaxed },
        { name: "fist", children: relaxed },
        { name: "spread", children: relaxed },
        { name: "hold", children: relaxed },
      ],
    });
  };

  const arm = (side) => {
    const sign = side === "left" ? -1 : 1;
    const shoulder = [X(sign * (id === "gloam" ? 0.28 : 0.46)), yShoulder];
    const elbow = [X(sign * (id === "gloam" ? 0.34 : 0.5)), yElbow];
    const wrist = [X(sign * (id === "gloam" ? 0.32 : 0.55)), yWrist];
    return G(
      `${side}_upper_arm`,
      shoulder[0],
      shoulder[1],
      [
        limb(`${side}_upper`, side === "left" ? "leftArm" : "rightArm", shoulder, elbow, armW, armFill),
        G(`${side}_forearm`, elbow[0], elbow[1], [
          limb(`${side}_fore`, "decoration", elbow, wrist, armW * 0.92, id === "dot" ? spec.parts.shirt[0] : armFill),
          hand(side, wrist),
        ]),
      ],
      { role: side === "left" ? "leftArm" : "rightArm" },
    );
  };

  const leg = (side) => {
    const sign = side === "left" ? -1 : 1;
    const hip = [X(sign * 0.14), yHip];
    const knee = [X(sign * 0.14), yKnee];
    const ankle = [X(sign * 0.15), yAnkle];
    const shoe = spec.parts.shoes || spec.parts.boots || spec.parts.skin;
    return G(
      `${side}_thigh`,
      hip[0],
      hip[1],
      [
        limb(`${side}_thigh_shape`, side === "left" ? "leftLeg" : "rightLeg", hip, knee, legW, legCloth[0]),
        G(`${side}_shin`, knee[0], knee[1], [
          limb(`${side}_shin_shape`, "decoration", knee, ankle, legW * 0.9, legCloth[0]),
          G(`${side}_foot`, ankle[0], ankle[1], [
            P(
              [
                [ankle[0] - 16, ankle[1]],
                [ankle[0] + 22, ankle[1] + 2],
                [ankle[0] + 20, ankle[1] + 16],
                [ankle[0] - 18, ankle[1] + 14],
              ],
              shoe[0],
              "contour",
              { shadowK: 0.16 },
            ),
            E(ankle[0] + 6, ankle[1] + 4, 5, 2.2, spec.shoeHighlight || shoe[0], "none", {
              shadow: false,
            }),
          ]),
        ]),
      ],
      { role: side === "left" ? "leftLeg" : "rightLeg" },
    );
  };

  const torsoPath = map(
    id === "gloam"
      ? [[-0.34, 1.05], [0.34, 1.05], [0.42, 1.55], [0.28, 1.7], [-0.28, 1.7], [-0.42, 1.55]]
      : id === "teo"
        ? [[-0.42, 1.15], [0.42, 1.15], [0.34, 2.55], [-0.34, 2.55]]
        : [[-0.48, 1.15], [0.48, 1.15], [0.4, 2.3], [-0.4, 2.3]],
  );
  const shirtPath = map(
    id === "dot"
      ? [[-0.16, 1.16], [0.16, 1.16], [0.12, 2.05], [-0.12, 2.05]]
      : id === "teo"
        ? [[-0.28, 1.16], [0.28, 1.16], [0.22, 2.2], [-0.22, 2.2]]
        : [],
  );
  const vest = id === "gloam"
    ? map([[-0.3, 1.12], [0.3, 1.12], [0.26, 1.48], [-0.26, 1.48]])
    : null;

  const hair = () => {
    if (id === "teo") {
      const curls = headSpec.hairBack();
      return curls.map((curl, index) =>
        E(X(curl[0]), Y(curl[1]), curl[2] * HH, curl[2] * HH, spec.parts.hair[0], "contour", {
          id: index === 0 ? "hair" : undefined,
          role: index === 0 ? "hair" : undefined,
          shadow: true,
          shadowK: 0.12,
        }),
      );
    }
    if (id === "gloam") return [];
    return [
      P(map(headSpec.hairBack()), spec.parts.hair[0], "contour", {
        id: "hair",
        role: "hair",
        shadowK: 0.12,
      }),
      P(map(headSpec.fringe()), spec.parts.hair[0], "contour", { shadow: false }),
      E(X(-0.05), Y(0.12), HH * 0.12, HH * 0.04, spec.hairHighlight, "none", {
        shadow: false,
      }),
    ];
  };

  const brows = () => {
    if (id === "gloam") return [];
    const y = headSpec.eyeY - 0.1;
    return ["left", "right"].map((side) => {
      const sign = side === "left" ? -1 : 1;
      return P(
        map([
          [sign * 0.22, y],
          [sign * 0.05, y - 0.01],
        ]),
        "transparent",
        "interior",
        {
          open: true,
          id: `brow_${side}`,
          role: side === "left" ? "leftBrow" : "rightBrow",
          shadow: false,
        },
      );
    });
  };

  const frontFace = [
    ...hair().filter((shape) => shape.role === "hair" || shape.id === "hair"),
    P(skull, spec.parts.skin[0], "contour", { id: "skull", shadowK: 0.12 }),
    ...hair().filter((shape) => shape.id !== "hair" && shape.role !== "hair"),
    ...eyeShapes(""),
    ...brows(),
    ...(nose ? [nose] : []),
    ...(id === "teo"
      ? [P(map(headSpec.beard()), spec.parts.hair[0], "contour", { shadowK: 0.12 })]
      : []),
    ...(id === "teo"
      ? [0, 1, 2].map((i) =>
          E(X(-0.12 + i * 0.08), Y(0.5), 1.6, 1.6, spec.freckle, "none", { shadow: false }),
        )
      : []),
  ];
  const threeFace = [
    P(
      map(headSpec.skull()).map(([x, y]) => [cx + (x - cx) * 0.95, y]),
      spec.parts.skin[0],
      "contour",
      { shadowK: 0.12 },
    ),
    ...eyeShapes("tq_"),
    ...(headSpec.nose
      ? [
          P(map(headSpec.nose()), "transparent", "interior", {
            open: true,
            shadow: false,
            stroke: INK,
          }),
        ]
      : []),
  ];
  const profileSkull = map([
    [-0.02, 0.08],
    [0.28, 0.02],
    [0.42, 0.35],
    [0.46, 0.58],
    [0.36, 0.92],
    [0.08, 1],
    [-0.08, 0.7],
    [-0.06, 0.3],
  ]);
  const profileFace = [
    P(profileSkull, spec.parts.skin[0], "contour", { shadowK: 0.12 }),
    ...eyeShapes("pf_"),
    ...(headSpec.nose
      ? [
          P(
            [
              [X(0.4), Y(0.55)],
              [X(0.52), Y(0.62)],
              [X(0.38), Y(0.66)],
            ],
            "transparent",
            "interior",
            { open: true, shadow: false },
          ),
        ]
      : []),
  ];

  const shapes = [
    leg("left"),
    leg("right"),
    arm("left"),
    G("torso", X(0), Y(id === "teo" ? 2.25 : 2.2), [
      P(neck, spec.parts.skin[0], "contour", { shadowK: 0.16 }),
      P(torsoPath, id === "gloam" ? spec.parts.skin[0] : cloth[0], "contour", {
        id: "torso_fill",
        role: "body",
        shadowK: 0.12,
      }),
      ...(shirtPath.length ? [P(shirtPath, spec.parts.shirt[0], "contour", { shadowK: 0.12 })] : []),
      ...(vest ? [P(vest, spec.parts.vest[0], "contour", { shadowK: 0.12 })] : []),
      ...(id === "teo"
        ? [
            E(X(0), Y(1.7), 7, 5, spec.buckle, "prop", { shadow: false }),
            E(X(0), Y(1.7), 3, 2, spec.buckleHi, "none", { shadow: false }),
          ]
        : []),
      ...(id === "dot"
        ? [
            P(
              map([
                [-0.22, 1.7],
                [0.02, 1.68],
                [0.04, 1.95],
                [-0.2, 1.98],
              ]),
              "#2C3038",
              "prop",
              { id: "tablet", shadow: false },
            ),
            E(X(-0.08), Y(1.82), 8, 5, "#6F7B8C", "none", { shadow: false }),
          ]
        : []),
    ], { role: "body" }),
    arm("right"),
    G(
      "head",
      X(0),
      Y(1.02),
      [
        G("turn_front", X(0), Y(0.4), [...frontFace, jaw]),
        G("turn_three", X(0), Y(0.4), [...threeFace, jaw && { type: "group", id: "jaw_tq_skip", children: [] }].filter(Boolean)),
        G("turn_profile", X(0), Y(0.4), profileFace),
      ],
      { role: "head", turnaround: true },
    ),
  ];

  // Jaw must be visible in front only; it is inside turn_front. Profile has no shared mouth
  // because variant IDs must be unique. Front carries the lip-sync mouth.
  const asset = {
    id: options.id || id,
    name: options.name || spec.name,
    kind: "character",
    description: spec.description,
    width: spec.width,
    height: Math.ceil(top + spec.heightHH * HH + 24),
    voice: spec.voice,
    shapes,
  };
  return validateAsset(asset);
}

export const CAST = [
  { id: "dot", name: "Dot Lind", kind: "character", description: LEADS.dot.description },
  { id: "teo", name: "Teo Lind", kind: "character", description: LEADS.teo.description },
  { id: "gloam", name: "Gloam", kind: "character", description: LEADS.gloam.description },
];

export function buildLead(id, options) {
  return leadAsset(id, options);
}

export { LEADS };
