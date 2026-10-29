import { validateAsset } from "./model.js";
import { dragonEpisode } from "./dragon.js";
import { familyAsset } from "./family.js";
import { buildSet, SET_CATALOG } from "./sets.js";
import { CAST, buildLead } from "./cast.js";
export const STYLE_KIT = {
  name: "Crooked cosmos",
  ink: "#181e23",
  skin: "#a5bd61",
  foliage: "#718c57",
  wood: "#736055",
  stone: "#68727a",
  accent: "#c985a0",
  light: "#e2cc8d",
  sky: "#26394b",
  shadow: "#394759",
};
export const STANDARDS = [
  ...CAST.map((lead) => ({
    ...lead,
    defaultParameters: { ink: "#221D26" },
  })),
  {
    id: "performer_rig",
    name: "Creature performance rig",
    kind: "creature",
    description:
      "Jointed adult-cartoon creature with authored mouth shapes, lids, hands, wings, tail and clothing.",
  },
  {
    id: "human_rig",
    name: "Human rig",
    kind: "character",
    defaultParameters: {
      ink: "#24242c",
      skin: "#8A5B3A",
      accent: "#4A6385",
    },
    description:
      "Reusable biped with head, eyes, mouth and independently pivoted limbs.",
  },
  {
    id: "building",
    name: "Crooked building",
    kind: "prop",
    description:
      "Skewed facade with recessed windows, a side plane and an uneven roof.",
  },
  {
    id: "tree",
    name: "Twisted tree",
    kind: "prop",
    description:
      "Bent trunk, angular branches and asymmetrical layered foliage.",
  },
  {
    id: "plant",
    name: "Alien plant",
    kind: "prop",
    description: "Forked leaves and a peculiar flower on a curved stem.",
  },
  {
    id: "moon",
    name: "Cratered moon",
    kind: "prop",
    description:
      "Uneven lunar silhouette with a shadow crescent and off-center craters.",
  },
  {
    id: "planet",
    name: "Ringed planet",
    kind: "prop",
    description: "Squashed planet, broken rings, stripes and an orbital moon.",
  },
  {
    id: "rock",
    name: "Alien rock",
    kind: "prop",
    description: "Faceted irregular rock with shadow planes and a crack.",
  },
  {
    id: "crate",
    name: "Battered crate",
    kind: "prop",
    description: "Reusable wooden prop with a side plane, seams and bolts.",
  },
  {
    id: "seam",
    name: "Reality seam",
    kind: "effect",
    description:
      "A vertical tear with layered offset edges. Not a ring and not a swirl.",
  },
  {
    id: "city",
    name: "Crooked street",
    kind: "environment",
    description:
      "Authored overlapping street planes, skewed windows and foreground framing.",
  },
  {
    id: "forest",
    name: "Strange forest",
    kind: "environment",
    description:
      "Layered twisted trees, a receding trail and foreground plants.",
  },
  {
    id: "space",
    name: "Deep space",
    kind: "environment",
    description:
      "A reusable star field with a ringed planet, moon and orbital silhouettes.",
  },
  ...SET_CATALOG,
];
export function instantiateStandard(
  standardId,
  { id = "standard_asset", name, parameters = {} } = {},
) {
  const item = STANDARDS.find((x) => x.id === standardId);
  if (!item) throw new Error("Unknown standard.");
  const c = { ...STYLE_KIT };
  for (const key of Object.keys(c))
    if (key !== "name" && parameters[key] !== undefined) {
      if (!/^#[0-9a-f]{6}$/i.test(parameters[key]))
        throw new Error(`Invalid ${key} color.`);
      c[key] = parameters[key];
    }
  const density = parameters.density ?? 6;
  if (!Number.isInteger(density) || density < 2 || density > 10)
    throw new Error("Density must be an integer from 2 to 10.");
  const seed = parameters.seed ?? 1;
  if (!Number.isInteger(seed) || seed < 0 || seed > 100000)
    throw new Error("Seed must be an integer from 0 to 100000.");
  if (standardId === "dot" || standardId === "teo" || standardId === "gloam")
    return buildLead(standardId, { id, name });
  if (standardId.startsWith("family_"))
    return familyAsset(standardId.slice(7), { id, name, parameters });
  if (standardId === "human_rig") return buildLead("dot", { id, name });
  const set = buildSet(standardId, {
    id,
    name,
    description: item.description,
    palette: c,
  });
  if (set) return set;
  const P = (path, fill, extra = {}) => ({
    type: "path",
    path,
    fill,
    stroke: c.ink,
    strokeWidth: 4,
    ...extra,
  });
  const E = (x, y, rx, ry, fill, extra = {}) => ({
    type: "ellipse",
    x,
    y,
    rx,
    ry,
    fill,
    stroke: c.ink,
    strokeWidth: 3,
    ...extra,
  });
  const L = (x, y, x2, y2, stroke = c.ink, strokeWidth = 3) => ({
    type: "line",
    x,
    y,
    x2,
    y2,
    stroke,
    strokeWidth,
  });
  const G = (id, x, y, children) => ({ type: "group", id, x, y, children });
  const star = (x, y, r) =>
    P(
      `M${x - r} ${y} L${x - 2} ${y - 2} L${x} ${y - r} L${x + 2} ${y - 2} L${x + r} ${y} L${x + 2} ${y + 2} L${x} ${y + r} L${x - 2} ${y + 2} Z`,
      c.light,
      { strokeWidth: 0 },
    );
  const tree = () => [
    P(
      "M91 390 Q112 289 99 251 L54 193 L59 170 L110 207 L137 120 L148 116 L137 239 L174 202 L185 212 L137 273 L147 392 Z",
      c.wood,
    ),
    P("M107 390 L117 250 L103 229 L126 243 L128 390 Z", c.shadow, {
      strokeWidth: 0,
    }),
    G("canopy", 0, 0, [
      P(
        "M18 166 Q-12 108 55 89 Q38 35 109 41 Q162 2 188 58 Q241 71 208 133 L229 158 Q168 196 142 168 Q90 217 60 177 Z",
        c.foliage,
      ),
      P(
        "M22 149 Q81 171 103 133 Q130 185 200 141 L220 160 Q166 196 142 168 Q90 217 60 177 Z",
        c.shadow,
        { strokeWidth: 0 },
      ),
      L(77, 112, 92, 93, c.light, 2),
      L(148, 67, 174, 79, c.light, 2),
    ]),
  ];
  const plant = () => [
    P("M94 253 Q105 185 83 120 Q72 78 115 34", "transparent", {
      stroke: c.foliage,
      strokeWidth: 10,
    }),
    P("M94 207 Q25 194 20 143 Q87 145 94 207 Z", c.foliage),
    P("M97 167 Q148 103 172 121 Q167 182 97 167 Z", c.foliage),
    P("M85 118 Q27 88 39 60 Q83 70 85 118 Z", c.foliage),
    G("flower", 0, 0, [
      P(
        "M105 44 L87 11 L117 23 L136 2 L140 30 L168 23 L147 51 L156 71 L124 65 L107 81 L108 56 L82 60 Z",
        c.accent,
      ),
      E(126, 43, 15, 12, c.light),
      E(129, 43, 3, 4, c.ink, { strokeWidth: 0 }),
    ]),
  ];
  const moon = () => [
    E(152, 151, 131, 126, c.light),
    P(
      "M183 28 Q78 74 90 159 Q99 248 196 269 Q59 299 24 195 Q-4 74 113 24 Z",
      c.stone,
      { strokeWidth: 0 },
    ),
    E(208, 104, 22, 28, c.stone),
    E(145, 195, 29, 21, c.stone),
    E(235, 196, 11, 14, c.stone),
    L(186, 88, 206, 82, c.shadow, 2),
    L(126, 184, 151, 179, c.shadow, 2),
  ];
  let width = 260,
    height = 420,
    shapes = [];
  if (["performer_rig", "city"].includes(standardId)) {
    const source =
      standardId === "performer_rig"
        ? dragonEpisode().assets.find((a) => a.id === "scorch")
        : dragonEpisode().assets.find((a) => a.kind === "environment");
    const asset = structuredClone(source);
    asset.id = id;
    asset.name = name || item.name;
    asset.description = item.description;
    const replacement = {
      "#181e23": c.ink,
      "#a5bd61": c.skin,
      "#667f50": c.foliage,
      "#d9cb79": c.light,
    };
    const walk = (nodes) =>
      nodes.forEach((n) => {
        if (replacement[n.fill]) n.fill = replacement[n.fill];
        if (n.stroke) n.stroke = c.ink;
        if (n.children) walk(n.children);
        if (n.variants) n.variants.forEach((v) => walk(v.children));
      });
    walk(asset.shapes);
    return validateAsset(asset);
  }
  if (standardId === "tree") {
    width = 250;
    height = 410;
    shapes = tree();
  }
  if (standardId === "plant") {
    width = 190;
    height = 270;
    shapes = plant();
  }
  if (standardId === "moon") {
    width = 305;
    height = 305;
    shapes = moon();
  }
  if (standardId === "rock") {
    width = 260;
    height = 170;
    shapes = [
      P("M18 149 L3 91 L56 24 L166 8 L238 71 L251 151 Z", c.stone),
      P("M56 24 L99 91 L18 149 L3 91 Z", c.shadow),
      P("M99 91 L166 8 L238 71 L210 131 Z", c.wood),
      P("M136 35 L126 70 L152 96 L139 129", "transparent", { strokeWidth: 3 }),
    ];
  }
  if (standardId === "building") {
    width = 350;
    height = 510;
    shapes = [
      P("M30 112 L273 92 L279 484 L19 503 Z", c.wood),
      P("M273 92 L333 129 L329 470 L279 484 Z", c.shadow),
      P("M5 119 L110 12 L205 31 L296 105 Z", c.shadow),
      P("M205 31 L341 121 L296 105 Z", c.stone),
      P("M118 497 L121 392 Q158 362 186 391 L192 491 Z", c.ink),
      L(28, 303, 275, 285),
    ];
    for (let y = 0; y < 2; y++)
      for (let x = 0; x < 3; x++) {
        const xx = 45 + x * 75,
          yy = 153 + y * 171;
        shapes.push(
          P(
            `M${xx} ${yy} L${xx + 44} ${yy - 4} L${xx + 48} ${yy + 58} L${xx + 2} ${yy + 62} Z`,
            c.ink,
          ),
          P(
            `M${xx + 8} ${yy + 5} L${xx + 40} ${yy + 1} L${xx + 42} ${yy + 48} L${xx + 10} ${yy + 53} Z`,
            c.light,
          ),
          L(xx + 24, yy + 4, xx + 26, yy + 53, c.wood, 3),
        );
      }
  }
  if (standardId === "crate") {
    width = 230;
    height = 210;
    shapes = [
      P("M20 52 L161 32 L173 184 L12 200 Z", c.wood),
      P("M161 32 L217 62 L218 173 L173 184 Z", c.shadow),
      P("M20 52 L70 18 L217 62 L161 32 Z", c.light),
      L(20, 78, 165, 60),
      L(16, 163, 169, 145),
      L(37, 62, 145, 171),
      L(140, 52, 44, 183),
      E(40, 71, 3, 3, c.ink),
      E(141, 162, 3, 3, c.ink),
    ];
  }
  if (standardId === "seam") {
    width = 280;
    height = 520;
    shapes = [
      P("M132 20 L150 80 L138 160 L156 250 L140 340 L158 430 L146 500 L118 500 L128 420 L112 330 L130 240 L114 150 L126 70 Z", "#2a3140", { line: "bg" }),
      P("M150 24 L176 90 L160 170 L184 260 L166 350 L188 440 L170 500 L150 500 L162 430 L144 340 L164 250 L146 160 L158 80 Z", "#6d5a78", { line: "bgDetail" }),
      P("M118 40 L126 120 L110 210 L128 300 L112 390 L130 470", "transparent", { line: "bgDetail", stroke: "#c8b7d2" }),
    ];
  }
  if (standardId === "planet") {
    width = 440;
    height = 340;
    shapes = [
      E(223, 167, 132, 125, c.accent),
      P("M110 96 Q210 129 340 93 L351 124 Q218 164 95 128 Z", c.light, {
        strokeWidth: 0,
      }),
      P("M94 183 Q200 217 353 178 L347 208 Q215 246 103 215 Z", c.shadow, {
        strokeWidth: 0,
      }),
      P(
        "M97 167 Q-17 244 66 264 Q177 290 363 185 Q480 111 389 104 L357 115 Q412 117 356 155 Q165 274 73 241 Q49 226 97 191 Z",
        c.light,
      ),
      E(378, 37, 21, 20, c.stone),
    ];
  }
  if (standardId === "space") {
    width = 1280;
    height = 720;
    shapes = [{ type: "rect", x: 0, y: 0, width, height, fill: c.sky }];
    for (let i = 0; i < 75; i++)
      shapes.push(
        star(
          (i * 179 + seed * 29) % 1280,
          (i * 97 + seed * 7) % 720,
          2 + (i % 3),
        ),
      );
    shapes.push(
      G("distant_moon", 840, 60, moon()),
      E(285, 408, 200, 187, c.accent),
      P("M111 315 Q290 385 470 301 L482 341 Q277 437 91 359 Z", c.shadow, {
        strokeWidth: 0,
      }),
      P(
        "M115 390 Q-10 522 157 541 Q354 548 533 374 L496 359 Q315 511 151 505 Q63 494 120 421 Z",
        c.light,
      ),
    );
  }
  if (standardId === "forest") {
    width = 1280;
    height = 720;
    shapes = [
      { type: "rect", x: 0, y: 0, width, height, fill: c.sky },
      P(
        "M0 401 Q185 300 366 391 Q704 288 975 386 L1280 326 L1280 720 L0 720 Z",
        c.shadow,
        { strokeWidth: 0 },
      ),
      P("M584 384 L670 386 L1081 720 L280 720 Z", c.wood, { strokeWidth: 0 }),
    ];
    for (let i = 0; i < density; i++) {
      const nodes = tree();
      nodes[2].id = `canopy_${i}`;
      shapes.push(
        G(
          `tree_${i}`,
          i < density / 2 ? i * 97 - 90 : 720 + (i - density / 2) * 116,
          175 + (i % 3) * 45,
          nodes,
        ),
      );
    }
    const nodes = plant();
    nodes[4].id = "foreground_flower";
    shapes.push(G("foreground_plant", 1050, 451, nodes));
  }
  return validateAsset({
    id,
    name: name || item.name,
    kind: item.kind,
    description: item.description,
    width,
    height,
    shapes,
  });
}
