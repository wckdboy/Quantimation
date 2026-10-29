export const VERSION = 1;
export const KINDS = ["character", "creature", "prop", "environment", "effect"];
export const MOTIONS = [
  "idle",
  "walk",
  "bounce",
  "float",
  "spin",
  "wave",
  "still",
];
const TYPES = ["ellipse", "rect", "polygon", "path", "line", "text", "group"];
const roles = [
  "body",
  "head",
  "eye",
  "pupil",
  "mouth",
  "leftBrow",
  "rightBrow",
  "leftArm",
  "rightArm",
  "leftLeg",
  "rightLeg",
  "decoration",
  "lid",
  "jaw",
  "hair",
  "hand",
];
const LINE_CLASSES = [
  "contour",
  "eye",
  "prop",
  "mouth",
  "interior",
  "detail",
  "bg",
  "bgDetail",
  "bgFar",
  "fx",
  "none",
];
function fail(message) {
  throw new Error(message);
}
function str(v, label, max = 300, empty = false) {
  if (typeof v !== "string" || v.length > max || (!empty && !v.trim()))
    fail(`${label} must be text (up to ${max} characters).`);
  return v;
}
function num(v, label, min, max) {
  if (typeof v !== "number" || !Number.isFinite(v) || v < min || v > max)
    fail(`${label} must be between ${min} and ${max}.`);
  return v;
}
function list(v, label, max, min = 0) {
  if (!Array.isArray(v) || v.length < min || v.length > max)
    fail(`${label} must contain ${min}–${max} items.`);
  return v;
}
function color(v = "transparent") {
  if (!/^(#[0-9a-fA-F]{3,8}|transparent|none)$/.test(v))
    fail("Colors must be hex values or transparent.");
  return v;
}
function id(v) {
  str(v, "ID", 80);
  if (!/^[a-zA-Z0-9_-]+$/.test(v))
    fail("IDs may only contain letters, numbers, underscores, and hyphens.");
  return v;
}
export function validateShape(s, depth = 0, counter = { n: 0 }) {
  if (!s || typeof s !== "object" || depth > 8 || ++counter.n > 500)
    fail("Shape tree is too large or invalid.");
  if (!TYPES.includes(s.type)) fail(`Unsupported shape type: ${s.type}`);
  const o = { type: s.type };
  if (s.id !== undefined) {
    o.id = id(s.id);
    counter.ids ??= new Set();
    if (counter.ids.has(o.id)) fail(`Duplicate shape ID: ${o.id}.`);
    counter.ids.add(o.id);
  }
  for (const k of ["x", "y", "x2", "y2", "pivotX", "pivotY"])
    if (s[k] !== undefined) o[k] = num(s[k], k, -5000, 5000);
  for (const k of ["width", "height", "radius", "rx", "ry"])
    if (s[k] !== undefined) o[k] = num(s[k], k, 0, 5000);
  for (const k of ["rotation"])
    if (s[k] !== undefined) o[k] = num(s[k], k, -3600, 3600);
  if (s.opacity !== undefined) o.opacity = num(s.opacity, "opacity", 0, 1);
  for (const k of ["scaleX", "scaleY"])
    if (s[k] !== undefined) o[k] = num(s[k], k, 0.01, 10);
  if (s.strokeWidth !== undefined)
    o.strokeWidth = num(s.strokeWidth, "strokeWidth", 0, 40);
  if (s.parallax !== undefined)
    o.parallax = num(s.parallax, "parallax", 0, 1.5);
  if (s.follow !== undefined) o.follow = num(s.follow, "follow", 0, 4);
  if (s.cel === true) o.cel = true;
  if (s.cel === false) o.cel = false;
  if (s.turnaround === true) o.turnaround = true;
  if (s.live !== undefined) {
    if (!["jaw", "flicker", "drip", "sway"].includes(s.live))
      fail("Unknown live motion.");
    o.live = s.live;
  }
  if (s.line !== undefined) {
    if (!LINE_CLASSES.includes(s.line)) fail("Unknown line class.");
    o.line = s.line;
  }
  if (s.taper !== undefined)
    o.taper = list(s.taper, "taper", 2, 2).map((n) => num(n, "taper", 0, 1));
  if (s.seed !== undefined) o.seed = num(s.seed, "seed", 0, 1e9);
  if (s.shadow === true) o.shadow = true;
  if (s.shadow === false) o.shadow = false;
  if (s.shadowK !== undefined) o.shadowK = num(s.shadowK, "shadowK", 0, 0.4);
  if (s.shadowFill !== undefined) o.shadowFill = color(s.shadowFill);
  if (s.fill !== undefined) o.fill = color(s.fill);
  if (s.stroke !== undefined) o.stroke = color(s.stroke);
  if (s.role !== undefined) {
    if (!roles.includes(s.role)) fail("Unknown rig role.");
    o.role = s.role;
  }
  if (s.path !== undefined) {
    o.path = str(s.path, "SVG path", 10000);
    if (!/^[MmLlHhVvCcSsQqTtAaZz0-9eE.,+\s-]+$/.test(o.path))
      fail("Path contains unsupported characters.");
  }
  if (s.points !== undefined)
    o.points = list(s.points, "points", 500, 2).map((p) =>
      list(p, "point", 2, 2).map((n) => num(n, "coordinate", -5000, 5000)),
    );
  if (s.text !== undefined) o.text = str(s.text, "shape text", 200, true);
  if (s.fontSize !== undefined)
    o.fontSize = num(s.fontSize, "font size", 4, 200);
  if (s.children !== undefined)
    o.children = list(s.children, "children", 200).map((c) =>
      validateShape(c, depth + 1, counter),
    );
  if (s.variants !== undefined) {
    if (s.type !== "group") fail("Only groups can have shape variants.");
    o.variants = list(s.variants, "shape variants", 12, 1).map((v) => ({
      name: id(v.name),
      children: list(v.children, "variant shapes", 60, 1).map((c) =>
        validateShape(c, depth + 1, counter),
      ),
    }));
    if (new Set(o.variants.map((v) => v.name)).size !== o.variants.length)
      fail("Variant names must be unique.");
  }
  if (s.type === "path" && !o.path) fail("A path shape needs SVG path data.");
  if (s.type === "polygon" && !o.points) fail("A polygon needs points.");
  return o;
}
export function validateAsset(a) {
  if (!a || !KINDS.includes(a.kind)) fail("Asset kind is invalid.");
  const counter = { n: 0 };
  const voice = a.voice
    ? {
        id: str(a.voice.id, "voice id", 60),
        speed: num(a.voice.speed ?? 1, "voice speed", 0.6, 1.5),
        ...(a.voice.providerVoice
          ? { providerVoice: str(a.voice.providerVoice, "provider voice", 120) }
          : {}),
        ...(a.voice.instructions
          ? { instructions: str(a.voice.instructions, "voice direction", 800) }
          : {}),
      }
    : undefined;
  return {
    id: id(a.id),
    name: str(a.name, "asset name", 100),
    kind: a.kind,
    description: str(a.description || a.name, "asset description", 1200),
    width: num(a.width, "asset width", 10, 1920),
    height: num(a.height, "asset height", 10, 1080),
    ...(voice ? { voice } : {}),
    shapes: list(a.shapes, "shapes", 200, 1).map((s) =>
      validateShape(s, 0, counter),
    ),
  };
}
export function validateEpisode(e) {
  if (!e || e.version !== VERSION)
    fail("Unsupported project version. Expected Quantimation version 1.");
  const assets = list(e.assets, "assets", 80, 1).map(validateAsset);
  const assetIds = new Set(assets.map((a) => a.id));
  if (assetIds.size !== assets.length) fail("Asset IDs must be unique.");
  const scenes = list(e.scenes, "scenes", 100, 1).map((s, i) => {
    const duration = num(s.duration, "scene duration", 1, 180);
    if (
      s.environment &&
      !assets.some((a) => a.id === s.environment && a.kind === "environment")
    )
      fail(`Scene ${i + 1} references an unknown environment.`);
    const instances = list(s.instances, "instances", 60).map((p) => {
      if (!assetIds.has(p.assetId)) fail(`Unknown asset ${p.assetId}.`);
      if (!MOTIONS.includes(p.motion || "idle")) fail("Unsupported motion.");
      const o = {
        id: id(p.id),
        assetId: p.assetId,
        x: num(p.x, "x", -1920, 3840),
        y: num(p.y, "y", -1080, 2160),
        scale: num(p.scale ?? 1, "scale", 0.01, 10),
        flip: !!p.flip,
        motion: p.motion || "idle",
        rotation: num(p.rotation ?? 0, "rotation", -3600, 3600),
      };
      o.view = p.view || "front";
      if (p.onOnes === true) o.onOnes = true;
      if (p.blinkSeed !== undefined)
        o.blinkSeed = num(p.blinkSeed, "blink seed", 0, 1e9);
      if (!["front", "threeQuarter", "profile", "back"].includes(o.view))
        fail("Unsupported character view.");
      o.beats = list(p.beats || [], "acting beats", 80).map((b) => {
        if (
          ![
            "point",
            "shrug",
            "recoil",
            "laugh",
            "nod",
            "angry",
            "surprised",
            "smug",
          ].includes(b.action)
        )
          fail("Unknown acting action.");
        return {
          at: num(b.at, "beat time", 0, duration),
          duration: num(b.duration ?? 2, "beat duration", 0.1, 30),
          action: b.action,
          intensity: num(b.intensity ?? 1, "beat intensity", 0, 2),
        };
      });
      o.keyframes = list(p.keyframes || [], "keyframes", 100)
        .map((k) => {
          const n = { t: num(k.t, "keyframe time", 0, duration) };
          for (const f of ["x", "y", "rotation"])
            if (k[f] !== undefined) n[f] = num(k[f], f, -5000, 5000);
          if (k.scale !== undefined) n.scale = num(k.scale, "scale", 0.01, 10);
          if (k.opacity !== undefined)
            n.opacity = num(k.opacity, "opacity", 0, 1);
          return n;
        })
        .sort((a, b) => a.t - b.t);
      const shapeIds = new Map();
      const collect = (nodes) =>
        nodes.forEach((n) => {
          if (n.id) shapeIds.set(n.id, n);
          if (n.children) collect(n.children);
          if (n.variants) n.variants.forEach((v) => collect(v.children));
        });
      collect(assets.find((a) => a.id === p.assetId).shapes);
      o.tracks = list(p.tracks || [], "pose tracks", 80).map((track) => {
        if (!shapeIds.has(track.target))
          fail(`Unknown pose target: ${track.target}.`);
        const keyframes = list(track.keyframes, "pose keyframes", 120, 1)
          .map((k) => {
            const n = {
              t: num(k.t, "pose time", 0, duration),
              easing: k.easing || "smooth",
            };
            if (!["smooth", "linear", "hold"].includes(n.easing))
              fail("Unsupported pose easing.");
            for (const f of ["x", "y", "rotation"])
              if (k[f] !== undefined) n[f] = num(k[f], f, -5000, 5000);
            for (const f of ["scaleX", "scaleY"])
              if (k[f] !== undefined) n[f] = num(k[f], f, 0.01, 10);
            if (k.opacity !== undefined)
              n.opacity = num(k.opacity, "opacity", 0, 1);
            if (k.variant !== undefined) {
              n.variant = id(k.variant);
              const variants = shapeIds.get(track.target).variants;
              if (
                !variants ||
                (n.variant !== "auto" &&
                  !variants.some((v) => v.name === n.variant))
              )
                fail(
                  `Unknown variant ${n.variant} on pose target ${track.target}.`,
                );
            }
            return n;
          })
          .sort((a, b) => a.t - b.t);
        if (new Set(keyframes.map((k) => k.t)).size !== keyframes.length)
          fail("Pose keyframe times must be unique.");
        return { target: track.target, keyframes };
      });
      if (new Set(o.tracks.map((k) => k.target)).size !== o.tracks.length)
        fail("Pose tracks must have unique targets.");
      if (p.timing === "ones" || p.timing === "twos") o.timing = p.timing;
      if (p.drawingKeys?.length) {
        const hands = ["relaxed", "grip", "point", "open"];
        const visemes = ["A", "B", "C", "D", "E", "F", "G", "H", "X"];
        o.drawingKeys = list(p.drawingKeys, "drawing keys", 400, 1).map((key) => {
          const drawing = { t: num(key.t ?? 0, "drawing time", 0, duration) };
          for (const field of [
            "lean", "weight", "squash", "headTilt", "lShoulder", "lElbow", "rShoulder", "rElbow",
            "lHip", "lKnee", "rHip", "rKnee", "depth", "groundX", "arc", "pitch", "blink", "plantL", "plantR",
          ]) {
            if (key[field] !== undefined) drawing[field] = num(key[field], field, -400, 4000);
          }
          if (key.view) {
            if (!["front", "threeQuarter", "profile", "back"].includes(key.view))
              fail("Unsupported drawing view.");
            drawing.view = key.view;
          }
          if (key.handL) {
            if (!hands.includes(key.handL)) fail("Unsupported hand drawing.");
            drawing.handL = key.handL;
          }
          if (key.handR) {
            if (!hands.includes(key.handR)) fail("Unsupported hand drawing.");
            drawing.handR = key.handR;
          }
          if (key.viseme) {
            if (!visemes.includes(key.viseme)) fail("Unsupported viseme.");
            drawing.viseme = key.viseme;
          }
          if (key.prop) drawing.prop = str(key.prop, "prop", 40);
          if (key.character) drawing.character = id(key.character);
          return drawing;
        });
      }
      return o;
    });
    if (new Set(instances.map((p) => p.id)).size !== instances.length)
      fail("Instance IDs must be unique per scene.");
    const dialogue = list(s.dialogue || [], "dialogue", 100).map((d) => {
      if (d.speaker !== "narrator" && !assetIds.has(d.speaker))
        fail("Dialogue references an unknown speaker.");
      return {
        id: id(d.id),
        speaker: d.speaker,
        text: str(d.text, "dialogue", 1600),
        at: num(d.at, "dialogue time", 0, duration),
        duration: num(
          d.duration ?? Math.max(2, d.text.length / 13),
          "dialogue duration",
          0.1,
          150,
        ),
      };
    });
    const shots = list(s.shots || [], "camera shots", 60)
      .map((shot) => ({
        at: num(shot.at, "shot time", 0, duration),
        label: str(shot.label || "Shot", "shot label", 100),
        camera: validateCamera(shot.camera),
      }))
      .sort((a, b) => a.at - b.at);
    const grade = s.grade
      ? {
          shadow: color(s.grade.shadow || "#241811"),
          highlight: color(s.grade.highlight || "#f2d7a2"),
          strength: num(s.grade.strength ?? 0.22, "grade strength", 0, 1),
        }
      : null;
    return {
      id: id(s.id),
      name: str(s.name, "scene name", 120),
      description: str(s.description || s.name, "scene description", 2000),
      duration,
      environment: s.environment || null,
      background: color(s.background || "#18222e"),
      ...(grade ? { grade } : {}),
      ...(s.palette ? { palette: str(s.palette, "palette", 40) } : {}),
      ...(s.lightAngleDeg !== undefined
        ? { lightAngleDeg: num(s.lightAngleDeg, "light angle", -360, 360) }
        : {}),
      ...(s.horizon !== undefined
        ? { horizon: num(s.horizon, "horizon", 0.05, 0.9) }
        : {}),
      ...(s.floorY !== undefined ? { floorY: num(s.floorY, "floor", 200, 900) } : {}),
      ...(s.vanishX !== undefined ? { vanishX: num(s.vanishX, "vanishing point", -500, 2000) } : {}),
      ...(s.contactShadow
        ? { contactShadow: color(s.contactShadow) }
        : {}),
      ...(s.rim
        ? {
            rim: {
              color: color(s.rim.color || "#FFC46B"),
              width: num(s.rim.width ?? 2.5, "rim width", 0, 8),
            },
          }
        : {}),
      camera: validateCamera(s.camera),
      shots,
      sounds: list(s.sounds || [], "sound cues", 100).map((cue) => {
        if (
          !["fire", "impact", "whoosh", "rumble", "crackle"].includes(cue.type)
        )
          fail("Unknown sound cue.");
        const at = num(cue.at, "sound time", 0, duration),
          length = num(cue.duration, "sound duration", 0.05, 180);
        if (at + length > duration + 0.001)
          fail("Sound cue exceeds scene duration.");
        return {
          id: id(cue.id),
          type: cue.type,
          at,
          duration: length,
          gain: num(cue.gain ?? 0.3, "sound gain", 0, 1),
        };
      }),
      instances,
      dialogue,
    };
  });
  if (new Set(scenes.map((s) => s.id)).size !== scenes.length)
    fail("Scene IDs must be unique.");
  const dialogueIds = scenes.flatMap((s) => s.dialogue.map((d) => d.id));
  if (new Set(dialogueIds).size !== dialogueIds.length)
    fail("Dialogue IDs must be unique throughout the episode.");
  if (scenes.reduce((a, s) => a + s.duration, 0) > 7200)
    fail("Episodes are limited to two hours per project.");
  return {
    version: VERSION,
    title: str(e.title, "episode title", 160),
    logline: str(e.logline || e.title, "logline", 1600),
    style: str(e.style || "Flat 2D cartoon", "style", 2000),
    genre: str(e.genre || "Original", "genre", 100),
    assets,
    scenes,
  };
}
export function validateCamera(c = {}) {
  const perspective = c.perspective || "eye";
  if (!["eye", "low", "high"].includes(perspective))
    fail("Unsupported camera perspective.");
  return {
    zoom: num(c.zoom ?? 1, "zoom", 0.5, 3),
    zoomEnd: num(c.zoomEnd ?? c.zoom ?? 1, "end zoom", 0.5, 3),
    x: num(c.x ?? 640, "camera x", 0, 1280),
    y: num(c.y ?? 360, "camera y", 0, 720),
    panX: num(c.panX ?? 0, "pan x", -1280, 1280),
    panY: num(c.panY ?? 0, "pan y", -720, 720),
    rotation: num(c.rotation ?? 0, "camera tilt", -30, 30),
    perspective,
    ...(c.shake ? { shake: num(c.shake, "shake", 0, 80) } : {}),
    ...(c.motivated === true ? { motivated: true } : {}),
  };
}
export function activeShot(scene, time) {
  let camera = scene.camera,
    start = 0,
    end = scene.duration,
    label = "Scene camera";
  for (const shot of scene.shots || []) {
    if (shot.at <= time) {
      camera = shot.camera;
      start = shot.at;
      label = shot.label;
    } else {
      end = shot.at;
      break;
    }
  }
  return {
    camera,
    start,
    end,
    label,
    progress: Math.max(
      0,
      Math.min(1, (time - start) / Math.max(0.01, end - start)),
    ),
  };
}
export function duration(e) {
  return e.scenes.reduce((n, s) => n + s.duration, 0);
}
export function locate(e, time) {
  let start = 0;
  for (let i = 0; i < e.scenes.length; i++) {
    const s = e.scenes[i];
    if (time < start + s.duration || i === e.scenes.length - 1)
      return {
        scene: s,
        index: i,
        start,
        time: Math.max(0, Math.min(s.duration, time - start)),
      };
    start += s.duration;
  }
}
export function parseJSON(text) {
  const cleaned = text
    .trim()
    .replace(/^```(?:json)?\s*/, "")
    .replace(/\s*```$/, "");
  return JSON.parse(cleaned);
}
export function interpolate(p, t) {
  const result = {
    x: p.x,
    y: p.y,
    scale: p.scale,
    rotation: p.rotation || 0,
    opacity: 1,
  };
  for (const field of Object.keys(result)) {
    const keys = [
      { t: 0, [field]: result[field] },
      ...(p.keyframes || []).filter((k) => k[field] !== undefined),
    ];
    let a = keys[0],
      b = null;
    for (const k of keys) {
      if (k.t <= t) a = k;
      else {
        b = k;
        break;
      }
    }
    const u = b ? Math.max(0, Math.min(1, (t - a.t) / (b.t - a.t))) : 0;
    const eased = u * u * (3 - 2 * u);
    result[field] = b ? a[field] + (b[field] - a[field]) * eased : a[field];
  }
  return result;
}
