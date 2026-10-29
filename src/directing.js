import { familyAsset } from "./family.js";
import {
  cuesToMouthTrack,
  estimateCues,
  mouthForShape,
  normalizeCues,
  shiftTrack,
} from "./lipsync.js";
import { motionReport } from "./onion.js";
import { armTracks, mergeTracks, poseTracks, solveArm } from "./rig.js";

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
  actor.tracks = mergeTracks(actor.tracks, [track]);
  return {
    engine: cues?.length ? "rhubarb" : "estimate",
    shapes: source.map((cue) => mouthForShape(cue.value, available)),
    track,
  };
}

export function reportMotion(episode, options) {
  return motionReport(episode, options);
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
    sample: familyAsset("pip").id,
  };
}
