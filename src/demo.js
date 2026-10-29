import { validateEpisode } from "./model.js";
const ink = "#202937";
const rect = (x, y, width, height, fill, extra = {}) => ({
  type: "rect",
  x,
  y,
  width,
  height,
  fill,
  stroke: ink,
  strokeWidth: 3,
  ...extra,
});
const ell = (x, y, rx, ry, fill, extra = {}) => ({
  type: "ellipse",
  x,
  y,
  rx,
  ry,
  fill,
  stroke: ink,
  strokeWidth: 3,
  ...extra,
});
const poly = (points, fill, extra = {}) => ({
  type: "polygon",
  points,
  fill,
  stroke: ink,
  strokeWidth: 3,
  ...extra,
});
const line = (x, y, x2, y2, stroke = ink, strokeWidth = 3) => ({
  type: "line",
  x,
  y,
  x2,
  y2,
  stroke,
  strokeWidth,
});
const text = (x, y, text, fontSize, fill) => ({
  type: "text",
  x,
  y,
  text,
  fontSize,
  fill,
});
const group = (role, children, pivotX = 0, pivotY = 0) => ({
  type: "group",
  role,
  pivotX,
  pivotY,
  children,
});
function eye(x, y, rx = 16, ry = 21) {
  return group(
    "eye",
    [
      ell(x, y, rx, ry, "#fffaf0"),
      ell(x + 3, y, 4, 6, ink, { strokeWidth: 0 }),
    ],
    x,
    y,
  );
}
const nova = {
  id: "nova",
  name: "Nova",
  kind: "character",
  description:
    "An overqualified space mechanic with copper hair, a turquoise jumpsuit, and a very tired expression.",
  width: 250,
  height: 400,
  shapes: [
    group(
      "leftLeg",
      [
        rect(76, 282, 38, 88, "#324656", { radius: 12 }),
        rect(64, 362, 53, 26, "#172731", { radius: 10 }),
      ],
      95,
      286,
    ),
    group(
      "rightLeg",
      [
        rect(135, 282, 37, 88, "#324656", { radius: 12 }),
        rect(131, 362, 57, 26, "#172731", { radius: 10 }),
      ],
      153,
      286,
    ),
    group(
      "leftArm",
      [
        poly(
          [
            [73, 169],
            [52, 181],
            [35, 270],
            [53, 281],
            [91, 195],
          ],
          "#74bac2",
        ),
        ell(43, 278, 14, 20, "#edb48e"),
      ],
      72,
      178,
    ),
    group(
      "rightArm",
      [
        poly(
          [
            [174, 169],
            [196, 180],
            [213, 259],
            [193, 272],
            [160, 191],
          ],
          "#74bac2",
        ),
        ell(207, 272, 14, 20, "#edb48e"),
      ],
      174,
      178,
    ),
    {
      type: "path",
      path: "M73 168 Q125 151 176 168 L185 294 Q125 311 64 294 Z",
      fill: "#62a8b5",
      stroke: ink,
      strokeWidth: 4,
      role: "body",
    },
    rect(115, 151, 26, 36, "#edb48e", { radius: 9 }),
    line(125, 191, 125, 293, "#285964", 3),
    rect(77, 198, 31, 29, "#8ac7c7", { radius: 3 }),
    text(79, 218, "N", 15, "#264655"),
    line(70, 273, 180, 273, "#294451", 13),
    rect(115, 266, 21, 14, "#e3ba69", { radius: 2 }),
    group(
      "head",
      [
        {
          type: "path",
          path: "M65 72 Q53 8 108 16 Q167 -4 193 49 L186 131 L59 135 Z",
          fill: "#b65b3c",
          stroke: ink,
          strokeWidth: 4,
        },
        ell(64, 106, 13, 21, "#edb48e"),
        ell(185, 106, 13, 21, "#edb48e"),
        {
          type: "path",
          path: "M68 66 Q124 37 180 63 L182 117 Q170 160 125 164 Q79 157 68 119 Z",
          fill: "#edb48e",
          stroke: ink,
          strokeWidth: 4,
        },
        poly(
          [
            [64, 77],
            [73, 36],
            [139, 24],
            [180, 50],
            [182, 81],
            [147, 57],
            [102, 64],
            [84, 85],
          ],
          "#c76e44",
        ),
        eye(102, 98, 18, 23),
        eye(150, 98, 18, 23),
        line(83, 72, 119, 76),
        line(133, 77, 166, 72),
        {
          type: "path",
          path: "M125 105 L119 124 L130 126",
          stroke: ink,
          strokeWidth: 3,
          fill: "transparent",
        },
        ell(131, 142, 12, 3, "#603c3a", { role: "mouth" }),
        line(82, 131, 99, 135, "#d89573", 2),
      ],
      125,
      153,
    ),
  ],
};
const sprout = {
  id: "sprout",
  name: "Sprout",
  kind: "creature",
  description:
    "A small lime-green three-eyed creature with long antennae, a pink belly, and a spectacularly misplaced sense of confidence.",
  width: 240,
  height: 310,
  shapes: [
    group(
      "leftLeg",
      [
        rect(62, 242, 29, 47, "#a2c46b", { radius: 12 }),
        ell(65, 288, 27, 11, "#a2c46b"),
      ],
      77,
      245,
    ),
    group(
      "rightLeg",
      [
        rect(147, 242, 29, 47, "#a2c46b", { radius: 12 }),
        ell(174, 288, 27, 11, "#a2c46b"),
      ],
      161,
      245,
    ),
    group(
      "leftArm",
      [
        {
          type: "path",
          path: "M52 174 Q10 161 22 222 L43 226 Q32 203 62 211 Z",
          fill: "#b6d579",
          stroke: ink,
          strokeWidth: 4,
        },
      ],
      55,
      176,
    ),
    group(
      "rightArm",
      [
        {
          type: "path",
          path: "M187 172 Q236 152 217 219 L197 222 Q210 194 181 205 Z",
          fill: "#b6d579",
          stroke: ink,
          strokeWidth: 4,
        },
      ],
      187,
      176,
    ),
    {
      type: "path",
      path: "M53 101 Q113 60 179 105 Q217 162 191 246 Q118 273 47 245 Q21 171 53 101 Z",
      fill: "#b6d579",
      stroke: ink,
      strokeWidth: 4,
      role: "body",
    },
    ell(121, 221, 47, 29, "#dcab91", { strokeWidth: 0 }),
    group(
      "head",
      [
        line(79, 98, 63, 37, ink, 8),
        line(155, 94, 178, 31, ink, 8),
        ell(61, 32, 12, 17, "#d3e795"),
        ell(181, 27, 12, 17, "#d3e795"),
        eye(74, 129, 23, 29),
        eye(118, 108, 24, 30),
        eye(162, 132, 23, 29),
        ell(123, 175, 22, 8, "#704648", { role: "mouth" }),
        poly(
          [
            [104, 172],
            [112, 182],
            [116, 172],
          ],
          "#fff4d0",
          { strokeWidth: 1 },
        ),
        ell(58, 169, 10, 5, "#a5bb65", { strokeWidth: 0 }),
        ell(183, 173, 10, 5, "#a5bb65", { strokeWidth: 0 }),
      ],
      120,
      180,
    ),
  ],
};
const toaster = {
  id: "toaster",
  name: "The oracle",
  kind: "prop",
  description: "A peach-colored toaster that may or may not know the future.",
  width: 160,
  height: 130,
  shapes: [
    rect(20, 30, 120, 80, "#e8ac8b", { radius: 20, strokeWidth: 4 }),
    rect(38, 22, 83, 20, "#e7c8a5", { radius: 10 }),
    rect(49, 26, 59, 6, "#3d4147", { radius: 3 }),
    eye(62, 60, 12, 15),
    eye(101, 60, 12, 15),
    ell(83, 87, 12, 4, "#513b40", { role: "mouth" }),
    line(142, 48, 151, 48),
    line(149, 45, 149, 81),
    rect(31, 109, 20, 9, ink),
    rect(110, 109, 20, 9, ink),
  ],
};
function environment(id, name, interior = false) {
  const shapes = [
    rect(0, 0, 1280, 720, interior ? "#324653" : "#273348", { strokeWidth: 0 }),
    ell(1030, 135, 116, 116, "#ab9aaf", { stroke: "#586275", strokeWidth: 2 }),
    ell(995, 101, 25, 18, "#9c8caa", { strokeWidth: 0 }),
    ell(1082, 150, 32, 41, "#9c8caa", { strokeWidth: 0 }),
  ];
  for (let i = 0; i < 70; i++) {
    const x = (i * 137 + 23) % 1280,
      y = (i * 67 + 19) % 390;
    shapes.push(
      ell(x, y, i % 4 ? 1.2 : 2, i % 4 ? 1.2 : 2, "#c9d6d3", {
        strokeWidth: 0,
      }),
    );
  }
  shapes.push(
    poly(
      [
        [0, 440],
        [115, 250],
        [183, 361],
        [247, 296],
        [398, 476],
        [487, 300],
        [579, 448],
        [716, 304],
        [831, 458],
        [1003, 331],
        [1136, 450],
        [1242, 316],
        [1280, 400],
        [1280, 720],
        [0, 720],
      ],
      "#675f78",
      { stroke: "#3c455b", strokeWidth: 3 },
    ),
  );
  shapes.push(
    poly(
      [
        [0, 511],
        [192, 466],
        [331, 495],
        [590, 450],
        [779, 492],
        [994, 476],
        [1280, 503],
        [1280, 720],
        [0, 720],
      ],
      "#9b807e",
      { stroke: "#514d63", strokeWidth: 3 },
    ),
    rect(0, 591, 1280, 129, "#b99b85", { strokeWidth: 0 }),
  );
  if (interior) {
    shapes.push(
      rect(0, 0, 1280, 100, "#3d5157"),
      rect(0, 90, 61, 500, "#586f6d"),
      rect(1219, 90, 61, 500, "#586f6d"),
      rect(60, 100, 1158, 365, "#647e79", { strokeWidth: 6 }),
      rect(86, 120, 1108, 315, "#263c49", { strokeWidth: 5 }),
    );
    for (let i = 0; i < 5; i++)
      shapes.push(
        rect(100 + i * 219, 132, 200, 287, "#2e4b58", { strokeWidth: 2 }),
        ell(170 + i * 219, 211, 2, 2, "#f4dbac", { strokeWidth: 0 }),
        line(205 + i * 219, 133, 205 + i * 219, 420, "#78968d", 4),
      );
    shapes.push(
      rect(358, 26, 564, 99, "#142e37", {
        radius: 16,
        stroke: "#a4b8a0",
        strokeWidth: 5,
      }),
      text(421, 91, "THE LAST STOP", 46, "#e6bd85"),
      rect(0, 488, 1280, 47, "#ddd1b0", { strokeWidth: 5 }),
      rect(0, 536, 1280, 57, "#6b8a83"),
      line(0, 564, 1280, 564, "#a9b2a0", 4),
    );
    for (let i = 0; i < 6; i++)
      shapes.push(
        rect(110 + i * 210, 584, 57, 61, "#7b7572", { strokeWidth: 2 }),
        ell(138 + i * 210, 584, 42, 13, "#cc8a78", { strokeWidth: 3 }),
      );
    shapes.push(
      rect(81, 446, 95, 44, "#a1b8b3", { radius: 6 }),
      rect(95, 428, 63, 19, "#5b7377", { radius: 5 }),
      ell(1113, 459, 34, 30, "#a5b785"),
      poly(
        [
          [1089, 444],
          [1073, 404],
          [1111, 432],
          [1124, 394],
          [1141, 441],
        ],
        "#7d9c7c",
      ),
    );
  } else {
    shapes.push(
      rect(71, 336, 464, 231, "#b8c1af", { radius: 22, strokeWidth: 5 }),
      rect(57, 327, 492, 30, "#d5b59b", { radius: 10, strokeWidth: 4 }),
      rect(115, 371, 169, 111, "#547d83", { radius: 8, strokeWidth: 4 }),
      rect(316, 371, 169, 111, "#547d83", { radius: 8, strokeWidth: 4 }),
      rect(97, 541, 417, 38, "#697d79", { radius: 5 }),
      line(198, 371, 198, 482, "#b8c1af", 5),
      line(400, 371, 400, 482, "#b8c1af", 5),
      line(300, 330, 300, 230, "#394c57", 8),
      rect(119, 196, 363, 94, "#283e43", {
        radius: 14,
        stroke: "#a0b695",
        strokeWidth: 5,
      }),
      text(146, 254, "LAST STOP", 45, "#e7c18c"),
      text(149, 280, "DINER  •  OPEN FOREVER", 14, "#b9c6b1"),
    );
    shapes.push(
      ell(967, 549, 108, 22, "#5f757b"),
      ell(969, 525, 65, 26, "#8faaa6"),
      ell(969, 511, 41, 27, "#c0d3be"),
      line(907, 548, 893, 571, "#283e4b", 5),
      line(1029, 548, 1047, 571, "#283e4b", 5),
    );
  }
  for (let i = 0; i < 20; i++)
    shapes.push(
      line(
        (i * 91) % 1280,
        615 + ((i * 17) % 105),
        ((i * 91) % 1280) + 13,
        615 + ((i * 17) % 105),
        "#a58778",
        2,
      ),
    );
  return {
    id,
    name,
    kind: "environment",
    description:
      "An illustrated roadside diner at the edge of the galaxy. Muted desert colors, distant mountains and a ringless lavender moon.",
    width: 1280,
    height: 720,
    shapes,
  };
}
const exterior = environment("exterior", "The edge of nowhere");
const diner = environment("diner", "Last Stop diner", true);
const actor = (
  id,
  assetId,
  x,
  y,
  scale = 1,
  motion = "idle",
  keyframes = [],
) => ({ id, assetId, x, y, scale, motion, flip: false, keyframes });
export function demoEpisode() {
  return validateEpisode({
    version: 1,
    title: "The Last Stop",
    logline:
      "Two unlikely travelers discover that the universe’s last diner serves breakfast. And prophecies.",
    genre: "Cosmic comedy",
    style:
      "Adult sci-fi cartoon. Clean black outlines, flat muted colors, eccentric alien anatomy, large expressive eyes, simple articulated limbs and painted desert backgrounds.",
    assets: [nova, sprout, toaster, exterior, diner],
    scenes: [
      {
        id: "arrival",
        name: "A very normal shift",
        description:
          "Wide establishing shot. Nova and Pip arrive at a lonely diner at the edge of the galaxy.",
        duration: 12,
        environment: "exterior",
        camera: { zoom: 1, x: 640, y: 360, panX: 15, panY: 0 },
        instances: [
          actor("nova1", "nova", 667, 666, 0.86, "walk", [
            { t: 0, x: 570 },
            { t: 5, x: 685 },
          ]),
          actor("pip1", "sprout", 890, 666, 0.87, "bounce", [
            { t: 0, x: 830 },
            { t: 5, x: 918 },
          ]),
        ],
        dialogue: [
          {
            id: "a1",
            speaker: "nova",
            text: "The last diner in the universe. Please tell me they have coffee.",
            at: 1,
            duration: 5,
          },
          {
            id: "a2",
            speaker: "sprout",
            text: "Better. Their toaster can predict the future.",
            at: 7,
            duration: 4,
          },
        ],
      },
      {
        id: "order",
        name: "Breakfast with destiny",
        description:
          "Inside the diner. The toaster waits on the counter, glowing with unwarranted confidence.",
        duration: 13,
        environment: "diner",
        camera: { zoom: 1, x: 640, y: 360 },
        instances: [
          actor("nova2", "nova", 405, 687, 1),
          actor("pip2", "sprout", 877, 686, 1, "wave"),
          actor("toast2", "toaster", 650, 487, 0.9, "float"),
        ],
        dialogue: [
          {
            id: "b1",
            speaker: "nova",
            text: "Fine. What does my future look like?",
            at: 1,
            duration: 3,
          },
          {
            id: "b2",
            speaker: "toaster",
            text: "In approximately thirty seconds, you will be disappointed.",
            at: 5,
            duration: 5,
          },
        ],
      },
      {
        id: "reveal",
        name: "The prophecy",
        description:
          "Push in toward the toaster. Pip leans closer as Nova processes the news.",
        duration: 11,
        environment: "diner",
        camera: { zoom: 1.25, x: 650, y: 399, panX: -15, panY: 5 },
        instances: [
          actor("nova3", "nova", 385, 687, 1, "still"),
          actor("pip3", "sprout", 907, 686, 1, "bounce", [
            { t: 0, x: 907 },
            { t: 5, x: 835 },
          ]),
          actor("toast3", "toaster", 650, 487, 0.9, "bounce"),
        ],
        dialogue: [
          {
            id: "c1",
            speaker: "sprout",
            text: "Incredible. How does it know?",
            at: 1,
            duration: 3,
          },
          {
            id: "c2",
            speaker: "toaster",
            text: "We are out of coffee.",
            at: 5,
            duration: 3,
          },
        ],
      },
      {
        id: "ending",
        name: "Some things are universal",
        description:
          "Back outside. Pip follows Nova into the desert. Hold on the diner for the final beat.",
        duration: 12,
        environment: "exterior",
        camera: { zoom: 1, x: 640, y: 360 },
        instances: [
          actor("nova4", "nova", 689, 666, 0.86, "walk", [
            { t: 0, x: 689 },
            { t: 11, x: 1040 },
          ]),
          actor("pip4", "sprout", 870, 666, 0.87, "walk", [
            { t: 0, x: 870 },
            { t: 11, x: 1210 },
          ]),
        ],
        dialogue: [
          {
            id: "d1",
            speaker: "nova",
            text: "Next time, we are stopping at a gas station.",
            at: 1,
            duration: 4,
          },
          {
            id: "d2",
            speaker: "sprout",
            text: "Their microwave only predicts the past.",
            at: 6,
            duration: 4,
          },
        ],
      },
    ],
  });
}
