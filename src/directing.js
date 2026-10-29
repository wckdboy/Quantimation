import {
  cuesToMouthTrack,
  estimateCues,
  mouthForShape,
  normalizeCues,
  shiftTrack,
} from "./lipsync.js";
import { motionReport } from "./onion.js";
import { armTracks, mergeTracks, poseTracks, solveArm } from "./rig.js";
import { inbetweenKeys, modelCheck, normalizePose, physicalityReport, scaleCheck } from "./drawn.js";

function sceneOf(episode, sceneId) {
  const scene = episode.scenes.find((item) => item.id === sceneId);
  if (!scene) throw new Error("Scene not found.");
  return scene;
}

function actorOf(scene, instanceId) {
  const actor = scene.instances.find((item) => item.id === instanceId);
  if (!actor) throw new Error("Actor instance not found.");
  return actor;
}

function clampKeys(tracks, duration) {
  return tracks.map((track) => ({
    ...track,
    keyframes: track.keyframes
      .map((frame) => ({
        ...frame,
        t: Math.max(0, Math.min(duration, frame.t)),
      }))
      .filter((frame, index, list) => list.findIndex((item) => item.t === frame.t) === index),
  }));
}

export function applyPose(episode, { sceneId, instanceId, pose, at = 0 }) {
  const scene = sceneOf(episode, sceneId);
  const actor = actorOf(scene, instanceId);
  const tracks = clampKeys(poseTracks(pose, at), scene.duration);
  actor.tracks = mergeTracks(actor.tracks, tracks);
  return { pose, tracks: actor.tracks };
}

export function applyIk(episode, { sceneId, instanceId, arm = "right", x, y, at = 0, hand = "point" }) {
  const scene = sceneOf(episode, sceneId);
  const actor = actorOf(scene, instanceId);
  const angles = solveArm(arm, { x, y });
  const tracks = clampKeys(
    armTracks(arm, angles, { at, hand }),
    scene.duration,
  );
  actor.tracks = mergeTracks(actor.tracks, tracks);
  return { angles, tracks: actor.tracks };
}

function mouthVariants(asset) {
  const found = [];
  const walk = (nodes) => {
    for (const node of nodes || []) {
      if (node.role === "mouth" && node.variants) found.push(node);
      if (node.children) walk(node.children);
      if (node.variants) for (const variant of node.variants) walk(variant.children);
    }
  };
  walk(asset?.shapes);
  return found[0];
}

export function applyLipsync(episode, { sceneId, lineId, cues }) {
  const scene = sceneOf(episode, sceneId);
  const line = scene.dialogue.find((item) => item.id === lineId);
  if (!line) throw new Error("Dialogue line not found.");
  if (line.speaker === "narrator") throw new Error("Narration has no mouth.");
  const actor = scene.instances.find((item) => item.assetId === line.speaker);
  if (!actor) throw new Error("Speaking actor is not in the scene.");
  const asset = episode.assets.find((item) => item.id === line.speaker);
  const mouth = mouthVariants(asset);
  const available = mouth ? new Set(mouth.variants.map((item) => item.name)) : null;
  const source = normalizeCues(
    cues?.length ? cues : estimateCues(line.text, line.duration),
    { text: line.text },
  );
  const track = shiftTrack(
    cuesToMouthTrack(source, { available, target: mouth?.id || "mouth" }),
    line.at,
    scene.duration,
  );
  const start = line.at;
  const end = line.at + line.duration;
  const previous = (actor.tracks || []).find((item) => item.target === track.target);
  const kept = (previous?.keyframes || []).filter(
    (frame) => frame.t < start - 0.001 || frame.t > end + 0.001,
  );
  const incoming = track.keyframes.filter(
    (frame) => frame.t >= start - 0.001 && frame.t <= end + 0.001,
  );
  const keyframes = [];
  for (const frame of [...kept, ...incoming].sort((a, b) => a.t - b.t)) {
    const last = keyframes.at(-1);
    if (last && Math.abs(last.t - frame.t) < 0.0005) last.variant = frame.variant;
    else keyframes.push(frame);
  }
  actor.tracks = mergeTracks(actor.tracks, [{ ...track, keyframes }]);
  return {
    engine: cues?.length ? "rhubarb" : "estimate",
    shapes: source.map((cue) => mouthForShape(cue.value, available)),
    track,
  };
}

export function reportMotion(episode, options) {
  const report = motionReport(episode, options);
  const scene = options?.sceneId
    ? episode.scenes.find((item) => item.id === options.sceneId) || episode.scenes[0]
    : episode.scenes[0];
  const drawn = (scene?.instances || []).filter((actor) => actor.drawingKeys?.length);
  report.physicality = drawn.map((actor) => ({
    instanceId: actor.id,
    ...physicalityReport(actor, { twos: actor.timing !== "ones" }),
  }));
  report.scale = scaleCheck(scene);
  report.model = drawn.map((actor) => modelCheck(actor.assetId, actor.drawingKeys[0]));
  return report;
}

export function setGesture(episode, { sceneId, instanceId, at = 0, pose = {} }) {
  const scene = sceneOf(episode, sceneId);
  const actor = actorOf(scene, instanceId);
  const key = {
    ...normalizePose(actor.assetId, pose),
    t: Math.max(0, Math.min(scene.duration, at)),
    character: actor.assetId,
  };
  const keys = [...(actor.drawingKeys || []).filter((item) => Math.abs(item.t - key.t) > 0.02), key];
  keys.sort((a, b) => a.t - b.t);
  actor.drawingKeys = keys;
  actor.timing = actor.timing || "twos";
  return { keys: actor.drawingKeys.length, t: key.t };
}

export function inbetweenDrawings(episode, { sceneId, instanceId, step = 2 / 24, arc = 8 }) {
  const scene = sceneOf(episode, sceneId);
  const actor = actorOf(scene, instanceId);
  if (!actor.drawingKeys?.length) throw new Error("Set gesture keys before inbetweening.");
  actor.drawingKeys = inbetweenKeys(
    actor.drawingKeys.map((key) => ({ ...key, character: actor.assetId })),
    { step, arc },
  );
  return { keys: actor.drawingKeys.length, timing: actor.timing || "twos" };
}

export function rigCatalog() {
  return {
    poses: [
      "neutral",
      "smug",
      "shocked",
      "angry",
      "talking",
      "anticipate",
      "squash",
      "stretch",
      "blink",
    ],
    arms: Object.keys({ left: 1, right: 1 }),
    sample: "dot",
  };
}
