import { validateAsset, validateEpisode } from "./model.js";

// Rest pivots shared by the IK solver and the drawn limbs. Local asset space.
export const FAMILY_LIMBS = {
  left: {
    shoulder: { x: 114, y: 290 },
    elbow: { x: 82, y: 406 },
    wrist: { x: 76, y: 505 },
  },
  right: {
    shoulder: { x: 234, y: 290 },
    elbow: { x: 267, y: 406 },
    wrist: { x: 265, y: 505 },
  },
};

// Original Quantumania cast. All coordinates and replacement drawings are editable.
export const FAMILY = [
  {
    id: "oona",
    name: "Dr. Oona Quark",
    role: "Grandmother / reckless quantum engineer",
    skin: "#d8bb97",
    shade: "#ac8e7b",
    hair: "#c7d8cf",
    coat: "#765481",
    shirt: "#65b8ac",
    pants: "#394951",
    voice: { id: "bf_emma", speed: 0.94 },
    line: "Relax. I have made this mistake in seven dimensions. I am practically an expert.",
  },
  {
    id: "pip",
    name: "Pip Quark",
    role: "Grandson / reluctant field assistant",
    skin: "#e9bc8c",
    shade: "#c28d72",
    hair: "#654331",
    coat: "#d77848",
    shirt: "#8bb7be",
    pants: "#4e6474",
    voice: { id: "am_puck", speed: 1.11 },
    line: "Does the emergency exit have to be a mouth? It is looking at me.",
  },
  {
    id: "mara",
    name: "Mara Quark",
    role: "Mother / orbital salvage captain",
    skin: "#cfa17f",
    shade: "#a77a67",
    hair: "#3b3446",
    coat: "#bd6865",
    shirt: "#e0c69a",
    pants: "#424a59",
    voice: { id: "af_nicole", speed: 1.02 },
    line: "Nobody touches the singularity until they have cleared the dinner table.",
  },
  {
    id: "bram",
    name: "Bram Quark",
    role: "Father / interplanetary insurance salesman",
    skin: "#d3ad8f",
    shade: "#a58272",
    hair: "#694c3d",
    coat: "#a59554",
    shirt: "#c9d6bd",
    pants: "#525166",
    voice: { id: "bm_george", speed: 0.97 },
    line: "Good news! Our policy covers acts of god. Bad news. Your grandmother is excluded.",
  },
  {
    id: "zig",
    name: "Zig Quark",
    role: "Older sister / illegal reality remixer",
    skin: "#cfb7a1",
    shade: "#a28d86",
    hair: "#8e669d",
    coat: "#719da0",
    shirt: "#342c46",
    pants: "#594b65",
    voice: { id: "af_heart", speed: 1.08 },
    line: "I sold our timeline. The reviews were terrible, but the deposit was nonrefundable.",
  },
];

export function familyAsset(characterId, options = {}) {
  const f = FAMILY.find((c) => c.id === characterId);
  if (!f) throw new Error("Unknown Quantumania character.");
  const palette = options.parameters || {};
  for (const [key, value] of Object.entries(palette)) {
    if (
      [
        "ink",
        "skin",
        "accent",
        "light",
        "wood",
        "foliage",
        "stone",
        "sky",
        "shadow",
      ].includes(key) &&
      !/^#[0-9a-f]{6}$/i.test(value)
    )
      throw new Error("Invalid family palette color.");
  }
  const ink = palette.ink || "#24242c",
    skin = palette.skin || f.skin,
    shade = f.shade,
    coat = palette.accent || f.coat,
    hair = f.hair,
    shirt = f.shirt,
    tooth = "#eee0ba",
    cavity = "#35262e";
  const P = (path, fill = "transparent", extra = {}) => ({
    type: "path",
    path,
    fill,
    stroke: ink,
    strokeWidth: fill === "transparent" || fill === "none" ? 3.1 : 5.5,
    ...extra,
  });
  const E = (x, y, rx, ry, fill, extra = {}) => ({
    type: "ellipse",
    x,
    y,
    rx,
    ry,
    fill,
    stroke: ink,
    strokeWidth: 4.2,
    ...extra,
  });
  const G = (id, pivotX, pivotY, children, extra = {}) => ({
    type: "group",
    id,
    pivotX,
    pivotY,
    children,
    ...extra,
  });
  const L = (path, extra = {}) =>
    P(path, "transparent", { strokeWidth: 2.7, ...extra });
  const pupil = (x, y) =>
    P(
      `M${x - 2.1} ${y} L${x - 0.55} ${y - 0.55} L${x} ${y - 3.1} L${x + 0.55} ${y - 0.55} L${x + 2.4} ${y} L${x + 0.55} ${y + 0.55} L${x} ${y + 2.2} L${x - 0.55} ${y + 0.55} Z`,
      ink,
      { strokeWidth: 0.8 },
    );
  const old = f.id === "oona",
    young = ["pip", "zig"].includes(f.id),
    dad = f.id === "bram",
    mom = f.id === "mara";
  const mouth = (name) => {
    const drawings = {
      closed: [
        P("M0 2 Q23 12 43 7 L66 2 L83 9 Q45 27 12 18 Z", skin),
        L("M3 7 Q22 17 44 12 L61 16 L81 9"),
        L("M17 25 L37 28", { stroke: shade }),
      ],
      open: [
        P("M-2 0 Q35 13 84 3 L81 32 Q52 59 17 35 Z", skin),
        P("M4 5 Q39 17 79 8 L73 30 Q47 48 22 31 Z", cavity),
        P("M13 11 L18 21 L30 22 L31 15 L47 17 L48 25 L59 22 L63 13", tooth, {
          strokeWidth: 1.5,
        }),
        P("M30 35 Q40 25 50 33 Q61 25 68 34 Q48 44 30 35 Z", "#be7775", {
          strokeWidth: 1.5,
        }),
        L("M48 32 L46 38"),
        P("M46 46 Q43 66 36 76 Q47 68 51 48 Z", "#93c4b4", {
          strokeWidth: 2.1,
        }),
      ],
      wide: [
        P("M-8 -1 L20 5 L49 1 L90 5 L84 39 Q39 65 3 33 Z", skin),
        P("M-2 5 L23 10 L48 7 L83 10 L77 34 Q36 52 9 28 Z", cavity),
        P(
          "M8 8 L11 21 L24 23 L27 12 L45 12 L46 24 L58 22 L61 12 L75 12 L74 21 L80 19",
          tooth,
          { strokeWidth: 1.5 },
        ),
        P("M22 34 Q34 25 45 32 Q60 25 67 36 Q42 48 22 34 Z", "#ba7276", {
          strokeWidth: 1.5,
        }),
        L("M43 32 L42 40"),
        L("M-12 0 L-7 -8 M88 2 L95 -3"),
        P("M48 50 Q44 70 37 82 Q50 72 54 52 Z", "#93c4b4", {
          strokeWidth: 2.1,
        }),
      ],
      round: [
        P("M12 8 Q36 -9 61 4 L73 23 L63 43 Q39 56 21 34 Z", skin),
        P("M32 11 Q48 2 59 17 L59 31 Q42 45 30 28 Z", cavity),
        P("M33 29 Q46 23 57 31 L48 37 Z", "#ba7276", { strokeWidth: 1.5 }),
        L("M19 8 L25 0 M62 42 L73 33", { stroke: shade }),
      ],
      teeth: [
        P("M-3 2 Q29 14 82 2 L84 23 Q42 43 6 24 Z", skin),
        P("M2 7 Q35 19 78 7 L77 21 Q44 33 10 21 Z", tooth),
        L("M6 15 L29 23 L45 18 L62 23 L79 14"),
        L("M19 12 L18 24 M34 16 L34 27 M50 15 L53 27 M65 12 L68 23", {
          strokeWidth: 1.5,
        }),
      ],
      smirk: [
        P("M-1 9 Q37 14 85 -2 L79 24 Q42 41 8 23 Z", skin),
        P("M5 13 Q42 20 80 4 L73 21 Q38 31 16 21 Z", cavity),
        P("M55 13 L58 22 L69 18 L73 8 Z", tooth, { strokeWidth: 1.5 }),
        L("M80 -1 L89 -7 M14 31 L35 34", { stroke: shade }),
      ],
      snarl: [
        P("M-7 2 L16 -4 L39 6 L62 -3 L89 2 L83 34 Q39 48 2 28 Z", skin),
        P("M-1 7 L18 2 L39 12 L63 3 L83 7 L76 28 Q38 37 9 23 Z", cavity),
        P(
          "M6 6 L13 20 L25 20 L27 7 L38 13 L43 23 L56 19 L58 7 L75 7 L74 19 L81 14",
          tooth,
          { strokeWidth: 1.5 },
        ),
        L("M-12 0 L-7 -9 M88 -2 L94 -10"),
      ],
      frown: [
        P("M3 20 Q33 -1 76 17 L84 30 Q44 14 11 32 Z", skin),
        L("M8 25 Q38 5 80 25"),
        L("M27 34 L50 36", { stroke: shade }),
      ],
      grin: [
        P("M-5 2 Q35 13 88 -1 L80 30 Q39 48 9 26 Z", skin),
        P("M1 7 Q37 19 82 5 L75 25 Q42 36 15 23 Z", tooth),
        L("M8 15 Q39 29 78 15 M24 14 L24 27 M41 15 L43 30 M60 12 L62 27", {
          strokeWidth: 1.5,
        }),
      ],
    };
    return drawings[name];
  };
  const hand = (name, side) => {
    const x = side === "left" ? 76 : 265,
      y = 505;
    const drawings = {
      relaxed: [
        P(
          `M${x - 9} ${y} L${x + 9} ${y} L${x + 14} ${y + 17} L${x + 9} ${y + 35} L${x + 2} ${y + 40} L${x - 3} ${y + 33} L${x - 9} ${y + 37} L${x - 15} ${y + 27} L${x - 17} ${y + 11} Z`,
          skin,
        ),
        L(
          `M${x - 5} ${y + 13} L${x - 3} ${y + 31} M${x + 3} ${y + 13} L${x + 4} ${y + 30}`,
        ),
      ],
      point: [
        P(
          `M${x - 9} ${y} L${x - 11} ${y - 32} Q${x - 7} ${y - 45} ${x - 3} ${y - 31} L${x + 1} ${y + 2} L${x + 10} ${y - 7} L${x + 17} ${y - 3} L${x + 15} ${y + 23} L${x + 5} ${y + 34} L${x - 13} ${y + 27} L${x - 19} ${y + 12} Z`,
          skin,
        ),
        L(
          `M${x + 3} ${y + 7} L${x + 11} ${y + 9} M${x - 10} ${y + 16} L${x + 7} ${y + 21}`,
        ),
      ],
      fist: [
        P(
          `M${x - 15} ${y + 1} L${x - 6} ${y - 6} L${x + 2} ${y - 2} L${x + 10} ${y - 5} L${x + 19} ${y + 5} L${x + 14} ${y + 28} L${x - 5} ${y + 32} L${x - 18} ${y + 18} Z`,
          skin,
        ),
        L(
          `M${x - 10} ${y + 4} L${x + 10} ${y + 11} M${x - 7} ${y + 16} L${x + 10} ${y + 20} M${x + 2} ${y + 3} L${x + 2} ${y + 11}`,
        ),
      ],
      spread: [
        P(
          `M${x - 10} ${y} L${x - 27} ${y - 15} L${x - 31} ${y - 7} L${x - 16} ${y + 9} L${x - 17} ${y + 30} L${x + 1} ${y + 40} L${x + 17} ${y + 26} L${x + 28} ${y - 2} L${x + 22} ${y - 8} L${x + 12} ${y + 8} L${x + 14} ${y - 24} L${x + 7} ${y - 26} L${x + 4} ${y + 3} L${x - 2} ${y - 28} L${x - 9} ${y - 26} Z`,
          skin,
        ),
        L(`M${x - 8} ${y + 14} L${x + 8} ${y + 17}`),
      ],
    };
    return G(name, x, y, drawings.relaxed, {
      variants: Object.entries(drawings).map(([name, children]) => ({
        name,
        children,
      })),
    });
  };
  const arm = (side) => {
    const left = side === "left",
      sx = left ? 114 : 234,
      ex = left ? 82 : 267,
      wx = left ? 76 : 265;
    return G(
      side + "_upper_arm",
      sx,
      290,
      [
        P(
          `M${sx - 12} 276 Q${ex - 19} 322 ${ex - 14} 411 L${ex + 13} 417 Q${ex + 15} 354 ${sx + 16} 304 Z`,
          coat,
        ),
        L(`M${sx - 6} 307 L${ex - 9} 382`, { stroke: shade }),
        G(side + "_forearm", ex, 406, [
          P(
            `M${ex - 14} 404 L${ex + 13} 409 L${wx + 11} 507 L${wx - 11} 509 Z`,
            old || dad ? coat : skin,
          ),
          P(
            `M${wx - 14} 491 L${wx + 13} 493 L${wx + 12} 508 L${wx - 13} 507 Z`,
            shirt,
          ),
          hand(side + "_hand", side),
        ]),
      ],
      { role: left ? "leftArm" : "rightArm" },
    );
  };
  const leg = (side) => {
    const left = side === "left",
      x = left ? 143 : 206,
      kx = left ? 130 : 215,
      fx = left ? 124 : 220;
    return G(
      side + "_thigh",
      x,
      462,
      [
        P(
          `M${x - 25} 452 L${x + 23} 457 L${kx + 17} 601 L${kx - 17} 603 Z`,
          f.pants,
        ),
        G(side + "_shin", kx, 592, [
          P(
            `M${kx - 17} 590 L${kx + 17} 592 L${fx + 13} 705 L${fx - 15} 707 Z`,
            f.pants,
          ),
          L(`M${kx + 5} 615 L${fx + 4} 692`, { stroke: "#858b96" }),
          G(side + "_foot", fx, 700, [
            P(
              left
                ? "M109 695 L139 696 L144 721 L93 724 L82 717 L88 707 Z"
                : "M205 697 L233 696 L242 706 L259 713 L260 721 L201 722 Z",
              "#35323e",
            ),
            L(left ? "M88 718 L140 717" : "M206 716 L255 717", {
              stroke: "#a4a19e",
            }),
          ]),
        ]),
      ],
      { role: left ? "leftLeg" : "rightLeg" },
    );
  };
  const eye = (side, x, y, rx, ry, prefix = "") =>
    G(
      `${prefix}eye_${side}`,
      x,
      y,
      [
        E(x, y, rx, ry, "#f4f0e2", { strokeWidth: 4.4 }),
        E(
          x - rx * 0.34,
          y - ry * 0.38,
          Math.max(2.2, rx * 0.14),
          Math.max(1.6, ry * 0.1),
          "#fffdf8",
          { strokeWidth: 0 },
        ),
        G(`${prefix}pupil_${side}`, x + 1, y + 2, [pupil(x + 1, y + 2)], {
          role: "pupil",
        }),
        P(
          `M${x - rx} ${y - 4} Q${x} ${y - ry - 7} ${x + rx} ${y - 2} L${x + rx - 2} ${y + 3} Q${x} ${y - 3} ${x - rx + 1} ${y + 1} Z`,
          skin,
          {
            id: `${prefix}lid_${side}`,
            pivotX: x,
            pivotY: y - 8,
            strokeWidth: 2.5,
            opacity: f.id === "pip" ? 0.42 : 1,
          },
        ),
      ],
      {
        role: "eye",
        scaleX: mom ? 0.9 : dad ? 0.92 : 1,
        scaleY: f.id === "zig" ? 0.9 : 1,
      },
    );
  const headPath = old
    ? "M117 93 Q132 58 180 64 Q231 63 240 108 L231 169 L239 213 L218 246 L164 254 L124 228 L116 183 L103 148 Z"
    : dad
      ? "M117 91 Q156 63 208 78 L240 105 L237 219 L214 251 L141 249 L110 219 L108 119 Z"
      : mom
        ? "M127 84 Q183 58 224 92 L237 144 L227 201 L233 228 L205 254 L157 248 L122 218 L111 156 Z"
        : "M114 93 Q155 59 208 77 Q248 96 242 146 L232 207 Q216 252 173 252 Q127 248 111 212 L99 148 Z";
  const hairPath = old
    ? "M107 143 L80 126 L97 111 L78 84 L111 86 L111 48 L142 62 L163 28 L183 59 L218 46 L227 76 L253 86 L242 120 L222 105 L210 85 L182 99 L158 84 L133 108 L128 144 Z"
    : mom
      ? "M103 191 Q73 117 115 71 Q166 27 226 66 Q267 96 239 180 L225 143 L215 98 Q182 124 136 113 L122 151 L122 203 Z"
      : dad
        ? "M108 151 L96 117 L113 82 Q147 53 189 67 L220 82 L245 109 L238 142 L226 121 L212 101 L181 94 L168 106 L135 104 L120 139 L120 155 Z"
        : f.id === "zig"
          ? "M102 198 L86 146 Q74 65 143 55 L207 45 Q266 63 251 126 L232 179 L225 122 L208 89 Q169 131 124 122 L124 202 L114 229 Z"
          : "M100 153 L84 122 L95 97 L78 83 L116 78 L126 51 L149 66 L174 47 L186 66 L218 61 L241 86 L252 115 L236 159 L224 126 L211 105 L192 113 L160 98 L129 120 L120 155 Z";
  const hairShape = (id) =>
    P(hairPath, hair, {
      ...(id ? { id } : {}),
      pivotX: 174,
      pivotY: 85,
      strokeWidth: 5.6,
      follow: 1.15,
    });
  const ears = [
    P("M111 155 Q89 141 94 177 Q99 195 115 185 Z", skin, {
      strokeWidth: 4.4,
    }),
    L("M106 163 Q98 156 103 179"),
    P("M234 154 Q251 142 250 169 Q249 185 235 185 Z", skin, {
      strokeWidth: 4.4,
    }),
  ];
  const faceExtras = [
    ...(f.id === "zig"
      ? [
          P("M211 84 L205 116 L184 137 L159 142 L173 126 L188 91 Z", "#bb8ec7"),
          E(245, 182, 9, 12, "transparent", {
            stroke: "#dfba73",
            strokeWidth: 4,
          }),
        ]
      : []),
    ...(mom
      ? [
          P("M117 103 L149 82 L157 91 L125 113 Z", "#dfb783"),
          L("M121 103 L150 88"),
        ]
      : []),
  ];
  const head = G(
    "head",
    174,
    252,
    [
      G("turn_front", 174, 160, [
        P(headPath, skin, { strokeWidth: 6.2 }),
        ...ears,
        P(
          "M125 212 Q142 242 177 242 L217 230 L212 248 L166 257 L139 245 Z",
          shade,
          { strokeWidth: 0 },
        ),
        hairShape("hair"),
        ...faceExtras,
        eye("left", 142, 156, old ? 26 : 30, old ? 30 : 36),
        eye("right", 208, 152, dad ? 26 : 29, old ? 28 : 34),
        P("M116 118 Q144 104 172 122", "transparent", {
          id: "brow_left",
          role: "leftBrow",
          pivotX: 145,
          pivotY: 118,
          stroke: old ? hair : ink,
          strokeWidth: old ? 7.5 : 4.6,
        }),
        P("M186 114 L208 108 L232 122", "transparent", {
          id: "brow_right",
          role: "rightBrow",
          pivotX: 208,
          pivotY: 116,
          stroke: old ? hair : ink,
          strokeWidth: old ? 7.5 : 4.6,
        }),
        P(
          old
            ? "M177 154 L168 189 L182 201 L199 189 L191 181"
            : "M177 156 L170 184 Q176 195 190 186 L185 179",
          skin,
          { id: "nose", pivotX: 180, pivotY: 170, strokeWidth: 3.4 },
        ),
      G("cheeks", 171, 201, [
        L("M118 194 L124 202 M226 194 L234 201", { stroke: shade }),
        ...(old
          ? [
              L(
                "M124 187 L144 194 L159 187 M184 184 L203 191 L220 183 M127 203 L122 214 M222 204 L228 218",
                { stroke: shade },
              ),
              L("M143 104 L164 108 M188 101 L211 107", { stroke: shade }),
            ]
          : []),
        ...(f.id === "pip"
          ? [
              E(124, 190, 2, 2, shade, { strokeWidth: 0 }),
              E(134, 194, 2, 2, shade, { strokeWidth: 0 }),
              E(221, 190, 2, 2, shade, { strokeWidth: 0 }),
            ]
          : []),
      ]),
      ...(dad
        ? [
            L(
              "M137 235 L139 240 M145 239 L147 244 M157 243 L158 248 M201 238 L202 243 M211 231 L215 238",
              { stroke: shade },
            ),
          ]
        : []),
      ...(old
        ? [
            P("M95 134 L106 132 L111 171 L101 174 Z", "#dcac68"),
            E(101, 151, 4, 6, "#70d5c4", { strokeWidth: 1 }),
          ]
        : []),
      ]),
      G("turn_three", 174, 160, [
        P(headPath, skin, { strokeWidth: 6.2 }),
        P("M234 150 Q258 134 256 172 Q252 196 232 188 Z", skin, {
          strokeWidth: 4.4,
        }),
        P(
          "M148 214 Q164 240 190 242 L214 228 L208 250 L170 256 L150 236 Z",
          shade,
          { strokeWidth: 0 },
        ),
        hairShape(null),
        eye("far", 134, 158, old ? 16 : 18, old ? 20 : 24, "tq_"),
        eye("near", 214, 150, old ? 28 : 32, old ? 32 : 38, "tq_"),
        P("M168 112 Q196 100 214 118", "transparent", {
          id: "tq_brow_near",
          role: "rightBrow",
          pivotX: 196,
          pivotY: 112,
          stroke: old ? hair : ink,
          strokeWidth: old ? 7 : 4.6,
        }),
        P("M188 148 L236 162 L214 196 L190 178 Z", skin, {
          id: "tq_nose",
          pivotX: 206,
          pivotY: 170,
          strokeWidth: 3.6,
        }),
      ]),
      G("turn_profile", 174, 160, [
        P(
          "M168 250 L150 214 Q142 156 168 112 Q206 68 248 104 Q286 146 270 196 Q258 236 236 252 L196 262 Z",
          skin,
          { strokeWidth: 6.2 },
        ),
        P("M156 146 Q132 136 138 176 Q148 204 170 188 Z", skin, {
          strokeWidth: 4.4,
        }),
        L("M148 160 Q140 154 146 178"),
        hairShape(null),
        eye("near", 214, 150, old ? 26 : 30, old ? 30 : 36, "pf_"),
        P("M198 118 Q230 104 246 124", "transparent", {
          id: "pf_brow",
          role: "leftBrow",
          pivotX: 224,
          pivotY: 116,
          stroke: old ? hair : ink,
          strokeWidth: old ? 7 : 4.8,
        }),
        P("M228 146 L286 170 L240 196 L222 172 Z", skin, {
          id: "pf_nose",
          pivotX: 240,
          pivotY: 170,
          strokeWidth: 3.8,
        }),
        P("M236 214 Q214 236 196 228 L214 252 L248 236 Z", shade, {
          strokeWidth: 0,
        }),
      ]),
      G("jaw", 173, 216, [
        G("mouth", 172, 212, mouth("closed"), {
          x: 130,
          y: 207,
          role: "mouth",
          scaleX: dad ? 0.8 : mom ? 0.84 : 1,
          scaleY: old ? 0.83 : 1,
          variants: [
            "closed",
            "open",
            "wide",
            "round",
            "teeth",
            "smirk",
            "snarl",
            "frown",
            "grin",
          ].map((name) => ({ name, children: mouth(name) })),
        }),
      ]),
    ],
    {
      role: "head",
      turnaround: true,
      scaleX: old ? 0.86 : dad ? 1.12 : mom ? 0.93 : 1,
      scaleY: old ? 1.12 : f.id === "pip" ? 1.04 : 1,
      rotation: f.id === "zig" ? -3 : old ? 3 : 0,
    },
  );
  const torso = P(
    dad
      ? "M119 272 L154 258 L203 260 L234 278 Q270 350 246 459 L222 480 L124 481 Q94 400 100 332 Z"
      : mom
        ? "M126 273 L153 255 L200 258 L228 275 L217 351 L243 459 L218 486 L126 480 L110 456 L135 352 Z"
        : "M123 271 L151 259 L202 258 L230 279 L219 350 L237 469 L199 481 L122 470 L114 419 L128 345 Z",
    shirt,
    { strokeWidth: 6 },
  );
  const wardrobe = old
    ? [
        P(
          "M127 269 L153 258 L168 307 L147 376 L145 527 L105 517 L116 417 L108 330 Z",
          coat,
          { id: "coat_left", pivotX: 130, pivotY: 284, follow: 0.75 },
        ),
        P(
          "M198 260 L228 278 L240 331 L225 404 L249 520 L202 533 L189 373 L180 307 Z",
          coat,
          { id: "coat_right", pivotX: 213, pivotY: 284, follow: 0.85 },
        ),
        P("M136 276 L153 306 L136 329 L153 348 L146 384", coat),
        P("M206 276 L190 308 L210 325 L192 346 L190 373", coat),
        P("M208 381 L228 378 L227 418 L209 419 Z", coat),
        L("M210 391 L226 388"),
        P("M214 380 L213 359 L221 360 L222 379 Z", "#d6b669"),
        L("M118 490 L129 498 M218 504 L234 499", { stroke: "#ba91c7" }),
      ]
    : dad
      ? [
          P("M121 272 L150 262 L173 321 L164 469 L119 470 L104 385 Z", coat),
          P("M201 263 L231 276 L246 383 L236 474 L184 475 L175 321 Z", coat),
          P("M156 273 L178 290 L195 271 L188 313 L168 318 Z", "#d9d4aa"),
          P("M175 311 L187 316 L191 379 L177 393 L166 375 Z", "#63798b", {
            id: "tie",
            pivotX: 178,
            pivotY: 313,
          }),
          E(185, 413, 3, 3, ink),
          E(186, 441, 3, 3, ink),
        ]
      : mom
        ? [
            P(
              "M125 275 L155 264 L173 296 L196 264 L225 278 L212 352 L239 462 L218 481 L123 475 L114 454 L137 348 Z",
              coat,
            ),
            L("M173 297 L175 451"),
            P("M182 320 L211 317 L208 348 L181 350 Z", coat),
            P("M120 437 L230 435 L233 452 L119 453 Z", "#383746"),
            P("M165 436 L185 437 L185 453 L165 452 Z", "#d5bb7e"),
          ]
        : f.id === "pip"
          ? [
              P(
                "M125 274 L146 265 L157 299 L151 449 L119 444 L115 344 Z",
                coat,
              ),
              P(
                "M202 263 L230 279 L233 342 L222 451 L190 451 L186 300 Z",
                coat,
              ),
              P(
                "M152 263 Q172 277 201 264 L207 284 L189 301 L157 297 L144 280 Z",
                coat,
              ),
              L("M155 302 L151 348 M194 304 L198 351", { stroke: "#e9d7b7" }),
              P("M139 381 L149 379 L146 410 L130 408 Z", coat),
            ]
          : [
              P(
                "M125 275 L150 262 L160 299 L149 424 L116 417 L116 338 Z",
                coat,
              ),
              P(
                "M200 263 L228 279 L237 341 L225 424 L190 429 L184 298 Z",
                coat,
              ),
              L("M126 285 L147 303 L132 322 M212 283 L193 306 L213 322"),
              P("M162 335 L173 320 L185 340 L175 356 Z", "#c8d672"),
              P("M128 439 L219 436 L221 452 L127 453 Z", "#2e2b38"),
              E(176, 445, 7, 7, "transparent", {
                stroke: "#b7bec8",
                strokeWidth: 2,
              }),
            ];
  const asset = {
    id: options.id || "quark_" + f.id,
    name: options.name || f.name,
    kind: "character",
    description: `${f.role}. Original Quantumania family rig: front, three-quarter and profile head turns, separate shoulders, elbows, wrists, hips, knees and feet, nine mouth drawings and four hand poses. ${old ? "Lopsided white crest, brass hearing implant, split plum engineer coat." : young ? "Uneven youthful features, big eyes and a reluctant slouch." : "Distinct adult silhouette and expressive tired eyes."}`,
    width: 350,
    height: 750,
    voice: { ...f.voice },
    shapes: [
      leg("left"),
      leg("right"),
      arm("left"),
      G("torso", 173, 464, [
        torso,
        ...wardrobe,
        P("M155 254 L157 233 L197 234 L202 260 L178 284 Z", skin),
        L("M163 259 L180 270 L194 258", { stroke: shade }),
      ]),
      arm("right"),
      head,
    ],
  };
  const sx = old ? 0.9 : dad ? 1.19 : mom ? 1.03 : f.id === "zig" ? 0.88 : 0.98;
  const sy = old
    ? 1.04
    : f.id === "pip"
      ? 0.81
      : dad
        ? 0.94
        : f.id === "zig"
          ? 0.96
          : 1;
  // Deliberate silhouette variation, with shared joint names for reusable acting.
  asset.shapes = [
    G("character_root", 175, 0, asset.shapes, { scaleX: sx, scaleY: sy }),
  ];
  asset.height = Math.ceil(750 * sy);
  return validateAsset(asset);
}

export function familyPoseTracks(pose = "neutral") {
  const key = (target, values) => ({
    target,
    keyframes: [{ t: 0, ...values }],
  });
  const poses = {
    neutral: [key("mouth", { variant: "closed" })],
    smug: [
      key("head", { rotation: -7 }),
      key("brow_left", { y: -7, rotation: -12 }),
      key("brow_right", { rotation: 9 }),
      key("mouth", { variant: "smirk" }),
      key("right_upper_arm", { rotation: -22 }),
      key("right_forearm", { rotation: -112 }),
      key("right_hand", { variant: "point", rotation: 12 }),
    ],
    shocked: [
      key("head", { rotation: 6, y: -5 }),
      key("brow_left", { y: -10 }),
      key("brow_right", { y: -12 }),
      key("eye_left", { scaleY: 1.15 }),
      key("eye_right", { scaleY: 1.15 }),
      key("lid_left", { y: -12 }),
      key("lid_right", { y: -12 }),
      key("mouth", { variant: "round" }),
      key("left_upper_arm", { rotation: 28 }),
      key("left_forearm", { rotation: 80 }),
      key("left_hand", { variant: "spread" }),
      key("right_upper_arm", { rotation: -29 }),
      key("right_forearm", { rotation: -75 }),
      key("right_hand", { variant: "spread" }),
    ],
    angry: [
      key("head", { rotation: -4, y: 4 }),
      key("brow_left", { rotation: 20, y: 4 }),
      key("brow_right", { rotation: -20, y: 4 }),
      key("mouth", { variant: "snarl" }),
      key("left_upper_arm", { rotation: -10 }),
      key("left_forearm", { rotation: 16 }),
      key("left_hand", { variant: "fist" }),
      key("right_upper_arm", { rotation: 8 }),
      key("right_forearm", { rotation: -20 }),
      key("right_hand", { variant: "fist" }),
    ],
    talking: [
      key("mouth", { variant: "auto" }),
      {
        target: "head",
        keyframes: [
          { t: 0, rotation: 0 },
          { t: 0.4, rotation: -4 },
          { t: 1.2, rotation: 2, easing: "hold" },
          { t: 2, rotation: 2 },
          { t: 2.3, rotation: -5 },
        ],
      },
      {
        target: "right_forearm",
        keyframes: [
          { t: 0, rotation: -15 },
          { t: 0.3, rotation: -80, easing: "hold" },
          { t: 1.2, rotation: -80 },
          { t: 1.5, rotation: -55, easing: "hold" },
          { t: 2.4, rotation: -55 },
        ],
      },
      key("right_hand", { variant: "spread" }),
    ],
  };
  if (!poses[pose]) throw new Error("Unknown family pose.");
  return poses[pose];
}

export function familyShowcase() {
  const assets = FAMILY.map((f) => familyAsset(f.id));
  return validateEpisode({
    version: 1,
    title: "Quantumania — Family performance tests",
    logline:
      "Original cast pose studies, hand poses, facial acting and voice auditions.",
    genre: "Character development",
    style:
      "Deliberately crooked adult science-fiction cartoon; controlled contours, asymmetric faces, tiny star pupils and expressive replacement mouths.",
    assets,
    scenes: FAMILY.map((f, i) => ({
      id: "audition_" + f.id,
      name: f.name,
      duration: 12,
      background: "#c3c0ab",
      instances: [
        {
          id: "actor_" + f.id,
          assetId: assets[i].id,
          x: 640,
          y: 690,
          scale: 0.82,
          motion: "still",
          tracks: auditionTracks(),
        },
      ],
      camera: { x: 640, y: 360, zoom: 1 },
      shots: [
        {
          at: 0,
          label: "Full-body performance",
          camera: { x: 640, y: 360, zoom: 1 },
        },
        {
          at: 6,
          label: "Face and hand acting",
          camera: { x: 640, y: 275, zoom: 1.55 },
        },
      ],
      dialogue: [
        {
          id: "family_" + f.id,
          speaker: assets[i].id,
          text: f.line,
          at: 0.5,
          duration: 9.5,
        },
      ],
    })),
  });
}

function auditionTracks() {
  const stages = [
    ["neutral", 0],
    ["smug", 7],
    ["shocked", 8.6],
    ["angry", 10.2],
  ];
  const tracks = new Map(
    familyPoseTracks("talking").map((t) => [t.target, structuredClone(t)]),
  );
  const targets = new Set(
    stages.flatMap(([pose]) => familyPoseTracks(pose).map((t) => t.target)),
  );
  for (const target of targets) {
    if (!tracks.has(target))
      tracks.set(target, {
        target,
        keyframes: [
          {
            t: 0,
            rotation: 0,
            x: 0,
            y: 0,
            scaleX: 1,
            scaleY: 1,
            ...(target === "mouth"
              ? { variant: "auto" }
              : target.endsWith("_hand")
                ? { variant: "relaxed" }
                : {}),
          },
        ],
      });
    for (const [pose, at] of stages.slice(1)) {
      const value =
        familyPoseTracks(pose).find((t) => t.target === target)?.keyframes[0] ||
        {};
      const previous = {
        rotation: 0,
        x: 0,
        y: 0,
        scaleX: 1,
        scaleY: 1,
        ...(target === "mouth"
          ? { variant: "closed" }
          : target.endsWith("_hand")
            ? { variant: "relaxed" }
            : {}),
      };
      tracks
        .get(target)
        .keyframes.push({ ...previous, ...value, t: at, easing: "hold" });
    }
  }
  return [...tracks.values()];
}
