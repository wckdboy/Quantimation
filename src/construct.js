// Vector construction drawings. Each pose is a head sphere and jaw, a rib cage,
// a pelvis, and tapered limbs. Clothing is drawn over those forms. Folds, cuffs,
// the jaw and the neck are inner lines. A hand is one contour built from a palm,
// a thumb pad and finger groups.

function clamp(v, a, b) {
  return Math.max(a, Math.min(b, v));
}

function poly(pts, fill, stroke, line, extra = {}) {
  const body = pts
    .map((p, i) => `${i ? "L" : "M"}${p[0].toFixed(1)} ${p[1].toFixed(1)}`)
    .join("");
  return {
    type: "path",
    path: extra.open ? body : `${body}Z`,
    fill: fill || "none",
    stroke: stroke || "none",
    strokeWidth: 0,
    line,
    shadow: false,
    seed: extra.seed ?? 1,
    ...(extra.role ? { role: extra.role } : {}),
  };
}

function ink(pts, color, line = "interior", seed = 4) {
  return poly(pts, "none", color, line, { open: true, seed });
}

function areaOf(pts) {
  let a = 0;
  for (let i = 0; i < pts.length; i++) {
    const j = (i + 1) % pts.length;
    a += pts[i][0] * pts[j][1] - pts[j][0] * pts[i][1];
  }
  return Math.abs(a) * 0.5;
}

function limbPts(a, b, r0, r1) {
  const dx = b[0] - a[0];
  const dy = b[1] - a[1];
  const len = Math.hypot(dx, dy) || 1;
  const px = -dy / len;
  const py = dx / len;
  const ux = dx / len;
  const uy = dy / len;
  return [
    [a[0] + px * r0 - ux * r0 * 0.25, a[1] + py * r0 - uy * r0 * 0.25],
    [a[0] + px * r0 * 0.96, a[1] + py * r0 * 0.96],
    [b[0] + px * r1, b[1] + py * r1],
    [b[0] + ux * r1 * 0.35, b[1] + uy * r1 * 0.35],
    [b[0] - px * r1, b[1] - py * r1],
    [a[0] - px * r0 * 0.96, a[1] - py * r0 * 0.96],
    [a[0] - px * r0 - ux * r0 * 0.25, a[1] - py * r0 - uy * r0 * 0.25],
    [a[0] - ux * r0 * 0.45, a[1] - uy * r0 * 0.45],
  ];
}

function fk(origin, len1, len2, deg1, deg2) {
  const a1 = (deg1 * Math.PI) / 180;
  const joint = [origin[0] + Math.sin(a1) * len1, origin[1] + Math.cos(a1) * len1];
  const a2 = a1 + (deg2 * Math.PI) / 180;
  const end = [joint[0] + Math.sin(a2) * len2, joint[1] + Math.cos(a2) * len2];
  return { joint, end, a1, a2 };
}

function ik(a, b, len1, len2, sign) {
  let dx = b[0] - a[0];
  let dy = b[1] - a[1];
  let dist = Math.hypot(dx, dy) || 1;
  const max = len1 + len2 - 0.6;
  const min = Math.abs(len1 - len2) + 0.6;
  if (dist > max) {
    dx *= max / dist;
    dy *= max / dist;
    dist = max;
  } else if (dist < min) {
    dx *= min / dist;
    dy *= min / dist;
    dist = min;
  }
  const ang = Math.atan2(dy, dx);
  const cos = clamp((len1 * len1 + dist * dist - len2 * len2) / (2 * len1 * dist), -1, 1);
  const theta = Math.acos(cos) * sign;
  return [a[0] + Math.cos(ang + theta) * len1, a[1] + Math.sin(ang + theta) * len1];
}

function lerp(a, b, t) {
  return [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t];
}

function headFront(cx, cy, rx, ry, jaw) {
  const pts = [];
  for (let i = 0; i < 28; i++) {
    const a = (i / 28) * Math.PI * 2;
    const s = Math.sin(a);
    const jawScale = s > 0 ? 1 + jaw + s * 0.08 : 1;
    pts.push([cx + Math.cos(a) * rx * (s > 0 ? 0.92 : 1), cy + s * ry * jawScale]);
  }
  return pts;
}

function headThree(cx, cy, rx, ry, jaw) {
  const pts = [];
  for (let i = 0; i <= 14; i++) {
    const t = i / 14;
    const a = Math.PI * 0.92 + t * Math.PI * 1.22;
    const side = Math.cos(a) > 0 ? 0.72 : 1;
    pts.push([cx + Math.cos(a) * rx * side, cy + Math.sin(a) * ry]);
  }
  pts.push(
    [cx + rx * 0.62, cy + ry * 0.08],
    [cx + rx * 0.78, cy + ry * 0.34],
    [cx + rx * 0.28, cy + ry * (0.84 + jaw)],
    [cx - rx * 0.05, cy + ry * (0.7 + jaw)],
    [cx - rx * 0.55, cy + ry * 0.28],
  );
  return pts;
}

function headProfile(cx, cy, rx, ry, jaw) {
  return [
    [cx - rx * 0.05, cy + ry * (0.92 + jaw)],
    [cx + rx * 0.18, cy + ry * (0.7 + jaw * 0.5)],
    [cx + rx * 0.34, cy + ry * 0.48],
    [cx + rx * 0.22, cy + ry * 0.34],
    [cx + rx * 0.78, cy + ry * 0.16],
    [cx + rx * 0.5, cy - ry * 0.02],
    [cx + rx * 0.22, cy - ry * 0.32],
    [cx - rx * 0.02, cy - ry * 0.88],
    [cx - rx * 0.48, cy - ry * 0.9],
    [cx - rx * 0.9, cy - ry * 0.15],
    [cx - rx * 0.72, cy + ry * 0.42],
    [cx - rx * 0.38, cy + ry * 0.88],
  ];
}

function handContour(wrist, dir, side, gesture, scale, kind) {
  const f = dir;
  const len = Math.hypot(f[0], f[1]) || 1;
  const fx = f[0] / len;
  const fy = f[1] / len;
  const px = -fy * side;
  const py = fx * side;
  const s = scale;
  const p = (x, y) => [wrist[0] + fx * x * s + px * y * s, wrist[1] + fy * x * s + py * y * s];
  if (kind === "gloam") {
    return [
      p(0.02, -0.35), p(0.08, -0.85), p(0.45, -0.95), p(0.85, -0.55),
      p(1.05, -0.15), p(0.95, 0.2), p(0.7, 0.05), p(0.55, 0.45),
      p(0.22, 0.72), p(0.02, 0.2),
    ];
  }
  if (gesture === "grip") {
    return [
      p(0.02, -0.42), p(0.12, -0.78), p(0.72, -0.62), p(1.02, -0.18),
      p(0.88, 0.22), p(0.62, 0.08), p(0.78, 0.42), p(0.5, 0.28),
      p(0.42, 0.72), p(0.12, 0.28), p(0.02, -0.05),
    ];
  }
  if (gesture === "point") {
    return [
      p(0.04, -0.4), p(0.16, -0.72), p(0.7, -0.5), p(1.55, -0.18),
      p(1.58, 0.08), p(0.78, 0.02), p(0.7, 0.38), p(0.48, 0.62),
      p(0.22, 0.78), p(0.02, 0.2),
    ];
  }
  if (gesture === "open") {
    return [
      p(0.02, -0.48), p(0.18, -0.86), p(0.62, -0.7),
      p(1.15, -0.95), p(1.22, -0.62), p(0.78, -0.42),
      p(1.28, -0.15), p(1.22, 0.18), p(0.75, 0.05),
      p(1.05, 0.48), p(0.95, 0.78), p(0.6, 0.35),
      p(0.28, 0.95), p(0.02, 0.35),
    ];
  }
  return [
    p(0.04, -0.46), p(0.16, -0.82), p(0.78, -0.64),
    p(1.12, -0.28), p(1.02, 0.02), p(1.18, 0.22), p(0.95, 0.32),
    p(1.08, 0.55), p(0.82, 0.48), p(0.42, 0.88), p(0.06, 0.32),
  ];
}

function fingerSeams(wrist, dir, side, scale, gesture) {
  if (gesture === "grip" || gesture === "point") return [];
  const len = Math.hypot(dir[0], dir[1]) || 1;
  const fx = dir[0] / len;
  const fy = dir[1] / len;
  const px = -fy * side;
  const py = fx * side;
  const p = (x, y) => [wrist[0] + fx * x * scale + px * y * scale, wrist[1] + fy * x * scale + py * y * scale];
  return [
    [p(0.78, -0.5), p(0.95, -0.05)],
    [p(0.74, -0.05), p(0.92, 0.4)],
  ];
}

export function constructCharacter(id, pose, model) {
  const facing = pose.facing < 0 ? -1 : 1;
  const view = pose.view;
  const turn = view === "profile" ? 1 : view === "threeQuarter" ? 0.62 : 0;
  const wide = view === "profile" ? 0.46 : view === "threeQuarter" ? 0.8 : 1;
  const pitch = pose.pitch || 0;
  const W = 480;
  const sole = model.world + 28;
  const cx = W / 2;
  const headD = model.head;
  const rx0 = headD * 0.5;
  const neck = headD * (id === "gloam" ? 0.1 : 0.2);
  const torso = (model.world - headD - neck) * (id === "gloam" ? 0.58 : 0.46);
  const leg = model.world - headD - neck - torso;
  const thigh = leg * 0.52;
  const shin = leg * 0.48;
  const sitBend = Math.min(-pose.lHip, -pose.rHip);
  const sit = clamp((sitBend - 12) / 58, 0, 1);
  const squash = pose.squash || 1;
  const hipY = sole - shin * (1 - sit * 0.04) - thigh * (1 - sit * 0.9) + (1 - squash) * 10;
  const hipX = cx + pose.weight * 18 * wide - sit * 52;
  const shoulderY = hipY - torso * (1 - sit * 0.06);
  const skullCy = shoulderY - rx0 * 0.72 - neck * 0.25;
  const crown = skullCy - rx0;
  const chestY = shoulderY;
  const chestW = rx0 * (id === "gloam" ? 0.85 : 1.15) * wide;
  const waistW = chestW * (id === "teo" ? 0.92 : 0.78);
  const hipW = chestW * (id === "gloam" ? 0.9 : 1.05);
  const arm = model.world * (id === "gloam" ? 0.32 : 0.4);
  const upperArm = arm * 0.54;
  const foreArm = arm * 0.46;
  const lagHair = (pose.hairLag || 0) * 14;
  const lagBeard = (pose.beardLag || 0) * 16;
  const lagCloth = (pose.clothLag || 0) * 12;

  const commit = (x, y) => {
    let px = facing < 0 ? cx - (x - cx) : x;
    const u = clamp((y - crown) / Math.max(1, sole - crown), 0, 1.2);
    const widen = 1 + Math.max(0, pitch) * 0.004 * u;
    px = cx + (px - cx) * widen;
    const lean = (pose.lean || 0) * ((sole - y) / model.world) * 1.1;
    return [px + lean, y];
  };
  const shapes = [];
  let volume = 0;
  let hands = 0;
  const add = (pts, fill, stroke, line, extra) => {
    const mapped = pts.map(([x, y]) => commit(x, y));
    if (!extra?.open) volume += areaOf(mapped);
    shapes.push(poly(mapped, fill, stroke, line, extra));
  };
  const line = (pts, color, cls = "interior", seed = 5) => {
    shapes.push(ink(pts.map(([x, y]) => commit(x, y)), color, cls, seed));
  };

  const shoulderL = [hipX - chestW * (view === "front" ? 0.92 : 0.05), shoulderY + 4];
  const shoulderR = [hipX + chestW * (view === "front" ? 0.92 : 0.72), shoulderY + 6 + turn * 4];
  const nearShoulder = view === "front" ? shoulderL : [hipX + chestW * 0.2, shoulderY + 2];
  const farShoulder = view === "front" ? shoulderR : [hipX - chestW * 0.35, shoulderY + 10];

  const reachTablet = pose.prop === "tablet" && (pose.handL === "grip" || pose.handR === "grip");
  const tabletAt = [hipX + rx0 * 0.15, chestY + rx0 * 0.15];

  function solveArm(shoulder, deg1, deg2, plantWrist) {
    const free = fk(shoulder, upperArm, foreArm, deg1, deg2);
    if (!plantWrist) return free;
    const joint = ik(shoulder, plantWrist, upperArm, foreArm, 1);
    return { joint, end: plantWrist, a1: 0, a2: 0 };
  }

  const gripWrist = reachTablet ? [tabletAt[0] - 8, tabletAt[1] + 16] : null;
  const leftArm = solveArm(
    view === "front" ? shoulderL : nearShoulder,
    pose.lShoulder || 0,
    pose.lElbow || 0,
    pose.handL === "grip" && gripWrist ? gripWrist : null,
  );
  const rightArm = solveArm(
    view === "front" ? shoulderR : farShoulder,
    pose.rShoulder || 0,
    pose.rElbow || 0,
    pose.handR === "grip" && gripWrist ? [gripWrist[0] + 28, gripWrist[1]] : null,
  );

  function solveLeg(hip, foot, deg1, deg2, plant) {
    if (sit > 0.4) {
      const knee = [hip[0] + 28 + sit * 18, hip[1] + 4];
      return { knee, foot: [knee[0] + 2, sole], hip };
    }
    const free = fk(hip, thigh, shin, deg1, deg2);
    const joint = ik(hip, foot, thigh, shin, 1);
    const t = clamp(plant, 0, 1);
    return { knee: lerp(free.joint, joint, t), foot: lerp(free.end, foot, t) };
  }

  const stance = (view === "profile" ? 8 : 18) * wide;
  const footTargetL = [cx - stance, sole];
  const footTargetR = [cx + stance * (view === "profile" ? 0.2 : 1), sole];
  const hipL = [hipX - hipW * 0.45, hipY];
  const hipR = [hipX + hipW * 0.35, hipY];
  const leftLeg = solveLeg(hipL, footTargetL, pose.lHip || 0, pose.lKnee || 0, pose.plantL ?? 1);
  const rightLeg = solveLeg(hipR, footTargetR, -(pose.rHip || 0), pose.rKnee || 0, pose.plantR ?? 1);

  const showFar = view !== "profile";
  const skin = model.skin[0];
  const skinLine = model.skin[1];
  const cloth = model.cloth[0];
  const clothLine = model.cloth[1];
  const shirt = model.shirt[0];
  const shirtLine = model.shirt[1];
  const pants = model.pants[0];
  const pantsLine = model.pants[1];
  const shoe = model.shoes[0];
  const shoeLine = model.shoes[1];
  const hair = model.hair[0];
  const hairLine = model.hair[1];

  const drawLeg = (leg, radius, seed) => {
    const r0 = radius * (1 + Math.max(0, pitch) * 0.01);
    const r1 = r0 * 0.72;
    add(limbPts(leg.hip || hipL, leg.knee, r0, r1 * 0.95), pants, pantsLine, "contour", { seed });
    add(limbPts(leg.knee, leg.foot, r1 * 0.9, r1 * 0.62), pants, pantsLine, "contour", { seed: seed + 1 });
    const bend = Math.hypot(leg.knee[0] - (leg.hip?.[0] ?? hipX), 1);
    const folded = Math.abs((leg.foot[0] - leg.knee[0]) - (leg.knee[0] - hipX)) > 6 || sit > 0.2;
    if (folded) {
      line(
        [
          [leg.knee[0] - r1 * 0.4, leg.knee[1]],
          [leg.knee[0] + r1 * 0.15, leg.knee[1] + 2],
          [leg.knee[0] + r1 * 0.45, leg.knee[1] - 1],
        ],
        pantsLine,
        "interior",
        seed,
      );
    }
    add(
      [
        [leg.foot[0] - r1 * 0.85, leg.foot[1] - r1 * 0.35],
        [leg.foot[0] + r1 * 1.15, leg.foot[1] - r1 * 0.2],
        [leg.foot[0] + r1 * 1.25, leg.foot[1] + 2],
        [leg.foot[0] - r1 * 0.7, leg.foot[1] + 2],
      ],
      shoe,
      shoeLine,
      "contour",
      { seed: seed + 2 },
    );
    void bend;
  };

  leftLeg.hip = hipL;
  rightLeg.hip = hipR;
  if (showFar) drawLeg(rightLeg, rx0 * 0.34 * (view === "front" ? 1 : 0.7), 12);
  drawLeg(leftLeg, rx0 * 0.36, 14);

  if (showFar) {
    add(limbPts(farShoulder, rightArm.joint, rx0 * 0.34, rx0 * 0.24), id === "gloam" ? skin : shirt, id === "gloam" ? skinLine : shirtLine, "contour", { seed: 21 });
    add(limbPts(rightArm.joint, rightArm.end, rx0 * 0.24, rx0 * 0.18), id === "gloam" ? skin : shirt, id === "gloam" ? skinLine : shirtLine, "contour", { seed: 22 });
  }

  const hem = hipY + rx0 * 0.35 + lagCloth * 0.15;
  const hemSag = lagCloth;
  if (id === "gloam") {
    add(
      [
        [farShoulder[0], farShoulder[1]],
        [nearShoulder[0], nearShoulder[1]],
        [hipX + hipW, hipY],
        [hipX + hipW * 0.4, hem],
        [hipX - hipW * 0.7, hem + 3],
        [hipX - hipW, hipY],
      ],
      skin,
      skinLine,
      "contour",
      { seed: 30 },
    );
    add(
      [
        [hipX - hipW * 0.2, chestY],
        [hipX + hipW * 0.85, chestY + 4],
        [hipX + hipW * 0.7, hipY + 2],
        [hipX - hipW * 0.05, hipY - 2],
      ],
      cloth,
      clothLine,
      "contour",
      { seed: 31 },
    );
    line(
      [
        [hipX + hipW * 0.1, chestY + 8],
        [hipX + hipW * 0.35, hipY - 4],
      ],
      clothLine,
    );
  } else {
    add(
      [
        [hipX - chestW * (view === "profile" ? 0.2 : 1), chestY - rx0 * 0.15],
        [hipX + chestW, chestY],
        [hipX + waistW, hipY - torso * 0.35],
        [hipX + hipW, hipY],
        [hipX + hipW * 0.55, hem + hemSag],
        [hipX - hipW * 0.2, hem + 6 + hemSag * 0.4],
        [hipX - hipW * (view === "profile" ? 0.15 : 0.9), hipY],
        [hipX - waistW, hipY - torso * 0.28],
      ],
      shirt,
      shirtLine,
      "contour",
      { seed: 30 },
    );
    if (id === "dot") {
      add(
        [
          [hipX - chestW * 1.08, chestY - rx0 * 0.05],
          [hipX + chestW * 1.12, chestY + 2],
          [hipX + chestW * 0.7, hem - rx0 * 0.05],
          [hipX + chestW * 0.15, hem + rx0 * 0.28 + hemSag],
          [hipX - chestW * 0.2, hem + rx0 * 0.42 + hemSag],
          [hipX - chestW * 0.95, hem - rx0 * 0.1],
        ],
        cloth,
        clothLine,
        "contour",
        { seed: 32 },
      );
      line(
        [
          [hipX - chestW * 0.2, chestY + rx0 * 0.35],
          [hipX + chestW * 0.1, hipY - torso * 0.2],
          [hipX - chestW * 0.05, hem],
        ],
        clothLine,
        "interior",
        33,
      );
    }
    line(
      [
        [hipX - waistW * 0.2, hipY - torso * 0.15],
        [hipX + waistW * 0.15, hipY + rx0 * 0.05],
        [hipX + hipW * 0.1, hem - 2],
      ],
      shirtLine,
      "interior",
      34,
    );
    line(
      [
        [nearShoulder[0] - 4, nearShoulder[1] + 6],
        [nearShoulder[0] + 8, nearShoulder[1] + rx0 * 0.45],
      ],
      clothLine,
      "detail",
      35,
    );
  }

  add(limbPts(view === "front" ? shoulderL : nearShoulder, leftArm.joint, rx0 * 0.4, rx0 * 0.28), id === "gloam" ? skin : shirt, id === "gloam" ? skinLine : shirtLine, "contour", { seed: 40 });
  add(limbPts(leftArm.joint, leftArm.end, rx0 * 0.28, rx0 * 0.22), id === "gloam" ? skin : shirt, id === "gloam" ? skinLine : shirtLine, "contour", { seed: 41 });
  const elbowBend = Math.hypot(leftArm.end[0] - leftArm.joint[0], leftArm.end[1] - leftArm.joint[1]);
  if (Math.abs(pose.lElbow || 0) > 18 || reachTablet) {
    line(
      [
        [leftArm.joint[0] - rx0 * 0.12, leftArm.joint[1] - 2],
        [leftArm.joint[0] + rx0 * 0.02, leftArm.joint[1] + 3],
        [leftArm.joint[0] + rx0 * 0.16, leftArm.joint[1] - 1],
      ],
      shirtLine,
      "interior",
      42,
    );
  }
  line(
    [
      [leftArm.end[0] - rx0 * 0.12, leftArm.end[1] - 2],
      [leftArm.end[0] + rx0 * 0.12, leftArm.end[1] + 1],
    ],
    shirtLine,
    "detail",
    43,
  );
  void elbowBend;

  const cap = id === "gloam" ? skin : shirt;
  const capLine = id === "gloam" ? skinLine : shirtLine;
  add(headFront(shoulderL[0], shoulderL[1], rx0 * 0.46, rx0 * 0.34, 0), cap, capLine, "contour", { seed: 44 });
  if (showFar) add(headFront(shoulderR[0], shoulderR[1], rx0 * 0.4, rx0 * 0.3, 0), cap, capLine, "contour", { seed: 45 });
  const neckTop = skullCy + rx0 * (view === "profile" ? 0.42 : 0.58);
  const neckBot = shoulderY + rx0 * 0.18;
  add(
    [
      [hipX - rx0 * 0.42, neckTop],
      [hipX + rx0 * (view === "profile" ? 0.22 : 0.46), neckTop],
      [hipX + rx0 * 0.62, neckBot],
      [hipX - rx0 * 0.58, neckBot],
    ],
    skin,
    skinLine,
    "contour",
    { seed: 50 },
  );
  line(
    [
      [hipX - rx0 * 0.16, neckTop + 2],
      [hipX - rx0 * 0.22, neckBot],
    ],
    skinLine,
    "interior",
    51,
  );
  line(
    [
      [hipX + rx0 * 0.16, neckTop + 2],
      [hipX + rx0 * 0.24, neckBot],
    ],
    skinLine,
    "interior",
    52,
  );

  const jaw = Math.max(0, pitch) * 0.008 + (pose.viseme === "A" ? 0.04 : 0);
  const ry = rx0 * (view === "profile" ? 1.02 : 1) * (1 - Math.max(0, pitch) * 0.004);
  const hx = hipX + (pose.headTilt || 0) * 0.4;
  const hy = skullCy;
  let headPts;
  if (view === "profile") headPts = headProfile(hx, hy, rx0 * 0.92, ry, jaw);
  else if (view === "threeQuarter") headPts = headThree(hx, hy, rx0 * 0.96, ry, jaw);
  else headPts = headFront(hx, hy, rx0 * (view === "back" ? 0.98 : 1), ry * 0.98, jaw * 0.3);
  if (view !== "back") add(headPts, skin, skinLine, "contour", { seed: 60, role: "head" });

  if (id === "dot") {
    const bobBottom = hy + ry * 1.08;
    const bob = [];
    bob.push([hx - rx0 * 1.18, bobBottom]);
    bob.push([hx - rx0 * 1.18, hy + ry * 0.1]);
    for (let i = 0; i <= 12; i++) {
      const a = Math.PI + (Math.PI * i) / 12;
      bob.push([hx + Math.cos(a) * rx0 * 1.2 + lagHair, hy + Math.sin(a) * ry * 1.12]);
    }
    bob.push([hx + rx0 * 1.18 + lagHair * 0.3, bobBottom + lagHair * 0.05]);
    add(bob, hair, hairLine, "contour", { seed: 70, role: "hair" });
    if (view !== "back") add(headPts, skin, skinLine, "contour", { seed: 61, role: "head" });
    if (view !== "back") {
      const fringeY = hy - ry * 0.02;
      add(
        [
          [hx - rx0 * 1.02, fringeY],
          [hx - rx0 * 0.9, hy - ry * 0.95],
          [hx + lagHair * 0.2, hy - ry * 1.08],
          [hx + rx0 * 0.95, hy - ry * 0.9],
          [hx + rx0 * 1.05, fringeY],
        ],
        hair,
        hairLine,
        "contour",
        { seed: 71 },
      );
      line(
        [
          [hx - rx0 * 0.95, fringeY],
          [hx + rx0 * 0.98, fringeY],
        ],
        hairLine,
        "interior",
        72,
      );
    }
  } else if (id === "teo" && view !== "back") {
    add(
      [
        [hx - rx0 * 0.95, hy - ry * 0.1],
        [hx - rx0 * 0.7 + lagHair, hy - ry * 1.05],
        [hx + rx0 * 0.2 + lagHair, hy - ry * 1.12],
        [hx + rx0 * 0.85, hy - ry * 0.7],
        [hx + rx0 * 0.4, hy - ry * 0.15],
      ],
      hair,
      hairLine,
      "contour",
      { seed: 70, role: "hair" },
    );
    add(
      [
        [hx - rx0 * 0.15, hy + ry * 0.35],
        [hx + rx0 * 0.45, hy + ry * 0.4],
        [hx + rx0 * 0.2 + lagBeard, hy + ry * 1.05],
        [hx - rx0 * 0.35 + lagBeard, hy + ry * 0.95],
      ],
      hair,
      hairLine,
      "contour",
      { seed: 73 },
    );
  } else if (view === "back") {
    add(headFront(hx, hy, rx0, ry, 0).map(([x, y]) => [x + lagHair * 0.2, y]), hair, hairLine, "contour", { seed: 70, role: "hair" });
  }

  if (view !== "back") {
    line(
      view === "profile"
        ? [
            [hx - rx0 * 0.15, hy + ry * 0.15],
            [hx + rx0 * 0.05, hy + ry * 0.55],
            [hx + rx0 * 0.2, hy + ry * 0.75],
          ]
        : [
            [hx - rx0 * 0.7, hy + ry * 0.18],
            [hx - rx0 * 0.2, hy + ry * 0.62],
            [hx + rx0 * 0.15, hy + ry * 0.78],
            [hx + rx0 * 0.55, hy + ry * 0.28],
          ],
      skinLine,
      "interior",
      80,
    );
    const eyeY = hy + ry * (view === "profile" ? 0.02 : 0.08);
    const eyes = view === "profile" ? ["near"] : ["far", "near"];
    for (const which of eyes) {
      const far = which === "far";
      let ex = hx + (far ? -rx0 * 0.38 : rx0 * 0.32);
      let er = rx0 * (id === "gloam" ? 0.22 : 0.13);
      if (view === "threeQuarter" && far) {
        ex = hx - rx0 * 0.08;
        er *= 0.62;
      }
      if (view === "profile") {
        ex = hx + rx0 * 0.18;
        er *= 0.9;
      }
      const blink = pose.blink || 0;
      const ey = Math.max(1.2, er * (1 - blink * 0.9));
      add(
        [
          [ex - er, eyeY],
          [ex - er * 0.4, eyeY - ey],
          [ex + er * 0.5, eyeY - ey * 0.92],
          [ex + er, eyeY],
          [ex + er * 0.3, eyeY + ey * 0.85],
          [ex - er * 0.5, eyeY + ey * 0.8],
        ],
        "#F4F0E4",
        skinLine,
        "eye",
        { seed: far ? 81 : 82, role: "eye" },
      );
      if (blink < 0.8) {
        add(
          [
            [ex - er * 0.18, eyeY],
            [ex, eyeY - ey * 0.15],
            [ex + er * 0.22, eyeY + ey * 0.05],
            [ex, eyeY + ey * 0.28],
          ],
          "#221D26",
          "#221D26",
          "eye",
          { seed: 83, role: "pupil" },
        );
      }
    }
    const mouthX = view === "profile" ? hx + rx0 * 0.32 : hx + rx0 * (view === "threeQuarter" ? 0.12 : 0);
    const mouthY = hy + ry * 0.48;
    const mw = rx0 * (id === "gloam" ? 0.16 : 0.24);
    const vis = pose.viseme || "X";
    if (vis === "A" || vis === "B" || vis === "M" || vis === "P") {
      line(
        [
          [mouthX - mw, mouthY],
          [mouthX + mw, mouthY],
        ],
        "#3A2A2E",
        "mouth",
        84,
      );
    } else if (vis === "D" || vis === "C" || vis === "E" || vis === "H") {
      add(
        [
          [mouthX - mw * 0.7, mouthY],
          [mouthX, mouthY - mw * 0.15],
          [mouthX + mw * 0.7, mouthY],
          [mouthX, mouthY + mw * (vis === "D" ? 0.55 : 0.35)],
        ],
        "#33282E",
        "#33282E",
        "mouth",
        { seed: 84, role: "mouth" },
      );
    } else if (vis === "F") {
      add(
        [
          [mouthX - mw * 0.35, mouthY],
          [mouthX + mw * 0.35, mouthY],
          [mouthX, mouthY + mw * 0.28],
        ],
        "#33282E",
        "#33282E",
        "mouth",
        { seed: 84, role: "mouth" },
      );
    } else {
      line(
        [
          [mouthX - mw * 0.65, mouthY],
          [mouthX, mouthY + mw * 0.12],
          [mouthX + mw * 0.65, mouthY],
        ],
        "#3A2A2E",
        "mouth",
        84,
      );
    }
    if (id !== "gloam") {
      if (view === "profile") {
        line(
          [
            [hx + rx0 * 0.42, hy + ry * 0.02],
            [hx + rx0 * 0.78, hy + ry * 0.16],
            [hx + rx0 * 0.4, hy + ry * 0.28],
          ],
          skinLine,
          "interior",
          85,
        );
      } else {
        const noseX = hx + rx0 * (view === "threeQuarter" ? 0.48 : 0.08);
        line(
          [
            [noseX - rx0 * 0.08, hy + ry * 0.12],
            [noseX + rx0 * 0.16, hy + ry * 0.28],
            [noseX - rx0 * 0.02, hy + ry * 0.36],
          ],
          skinLine,
          "interior",
          85,
        );
      }
    }
  }

  const drawHand = (wrist, from, gesture, side, seed) => {
    if (view === "profile" && side < 0) return;
    const dir = [wrist[0] - from[0], wrist[1] - from[1]];
    const scale = (id === "gloam" ? rx0 * 0.36 : rx0 * 0.46) * (side < 0 && view !== "front" ? 0.78 : 1);
    const contour = handContour(wrist, dir, side, gesture, scale, id);
    add(contour, skin, skinLine, "contour", { seed, role: "hand" });
    hands += 1;
    if (id !== "gloam") {
      for (const seam of fingerSeams(wrist, dir, side, scale, gesture)) line(seam, skinLine, "detail", seed);
    }
    if (gesture === "grip") {
      line(
        [
          [wrist[0] + dir[0] * 0.15, wrist[1] + dir[1] * 0.15],
          [wrist[0] + dir[0] * 0.35 - dir[1] * 0.08, wrist[1] + dir[1] * 0.35 + dir[0] * 0.08],
        ],
        skinLine,
        "interior",
        seed + 1,
      );
    }
  };

  if (reachTablet && pose.handL === "grip") {
    const tw = rx0 * 0.95;
    const th = rx0 * 1.25;
    const tilt = 0.18;
    const c = tabletAt;
    const rect = [
      [c[0] - tw * 0.5, c[1] - th * 0.5],
      [c[0] + tw * 0.5 + th * tilt, c[1] - th * 0.42],
      [c[0] + tw * 0.42 + th * tilt, c[1] + th * 0.5],
      [c[0] - tw * 0.55, c[1] + th * 0.42],
    ];
    add(rect, model.prop || "#2C3038", "#1A1C22", "prop", { seed: 90 });
    line(
      [
        [rect[0][0] + 4, rect[0][1] + 6],
        [rect[1][0] - 4, rect[1][1] + 6],
        [rect[2][0] - 4, rect[2][1] - 6],
        [rect[3][0] + 4, rect[3][1] - 6],
      ],
      "#8A8E96",
      "detail",
      91,
    );
  }

  if (showFar) drawHand(rightArm.end, rightArm.joint, pose.handR || "relaxed", view === "front" ? 1 : -1, 96);
  drawHand(leftArm.end, leftArm.joint, pose.handL || "relaxed", 1, 97);

  const feet = [leftLeg.foot, rightLeg.foot].map((p) => commit(p[0], p[1]));
  const lowest = Math.max(...feet.map((p) => p[1]));
  const crownP = commit(hx, crown);
  const hipP = commit(hipX, hipY);
  return {
    width: W,
    height: lowest + 2,
    shapes,
    metrics: {
      heads: model.heads,
      measuredHeads: model.world / model.head,
      volume,
      handLoops: hands,
      jacketLoops: 1,
      com: hipP,
      feet,
      height: model.world,
      span: lowest - crownP[1],
      hip: hipP,
    },
  };
}
