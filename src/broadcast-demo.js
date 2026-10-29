import { buildLead } from "./cast.js";
import { applyLipsync } from "./directing.js";
import { buildSet } from "./sets.js";
import { validateEpisode } from "./model.js";

export const DOT_LINE =
  "The form has a box for a talking kettle. I am leaving it blank.";
export const TEO_LINE = "It only leaks when it is embarrassed.";
export const GLOAM_LINE = "Page four. It has always been page four.";

export function kitchenEpisode({
  dotCues,
  teoCues,
  gloamCues,
  durations = {},
} = {}) {
  const dot = buildLead("dot", { id: "dot", primaryView: "threeQuarter" });
  const teo = buildLead("teo", { id: "teo" });
  const gloam = buildLead("gloam", { id: "gloam" });
  const kitchen = buildSet("suburb_kitchen", { id: "dot_kitchen" });
  const dotDur = durations.dot ?? 5.2;
  const teoDur = durations.teo ?? 4.2;
  const gloamDur = durations.gloam ?? 3.4;
  const dotAt = 0.8;
  const teoAt = dotAt + dotDur + 0.45;
  const gloamAt = teoAt + teoDur + 0.5;
  const duration = Math.min(28, Math.max(16, gloamAt + gloamDur + 2.2));
  const episode = validateEpisode({
    version: 1,
    title: "Page Four",
    logline:
      "Dot Lind will not file a claim for a talking kettle. Teo swears it only leaks when embarrassed. Gloam has already read the page.",
    genre: "Adult animated sitcom",
    style:
      "Original adult sitcom. Flat colour, one hard shadow, ink contours on characters and darkened local lines on the set. No boil.",
    assets: [kitchen, dot, teo, gloam],
    scenes: [
      {
        id: "kitchen",
        name: "Dot's kitchen",
        description: "Daytime coverage of Dot's kitchen. Cuts, no camera shear.",
        duration,
        background: "#E0D3B4",
        environment: "dot_kitchen",
        palette: "kitchen_day",
        lightAngleDeg: 135,
        contactShadow: "#898d73",
        camera: { x: 640, y: 390, zoom: 1.08, zoomEnd: 1.08 },
        shots: [
          {
            at: 0,
            label: "Wide kitchen",
            camera: { x: 600, y: 400, zoom: 1.08, zoomEnd: 1.08, panX: 70 },
          },
          {
            at: teoAt,
            label: "Teo",
            camera: { x: 620, y: 340, zoom: 1.2, zoomEnd: 1.2 },
          },
          {
            at: gloamAt,
            label: "Gloam",
            camera: { x: 860, y: 420, zoom: 1.24, zoomEnd: 1.24 },
          },
          {
            at: Math.min(duration - 1.2, gloamAt + gloamDur + 0.3),
            label: "Hold",
            camera: { x: 660, y: 380, zoom: 1.12, zoomEnd: 1.12 },
          },
        ],
        sounds: [],
        instances: [
          {
            id: "dot",
            assetId: "dot",
            x: 360,
            y: 680,
            scale: 0.74,
            motion: "still",
            view: "threeQuarter",
            tracks: [
              {
                target: "head",
                keyframes: [
                  { t: 0, rotation: 0, easing: "hold" },
                  { t: 1.5, rotation: 0, easing: "hold" },
                  { t: 1.67, rotation: 3, easing: "hold" },
                  { t: 1.92, rotation: -2, easing: "hold" },
                  { t: 2.17, rotation: 0, easing: "hold" },
                ],
              },
            ],
          },
          {
            id: "teo",
            assetId: "teo",
            x: 660,
            y: 690,
            scale: 0.7,
            motion: "still",
            view: "front",
            tracks: [
              {
                target: "right_upper_arm",
                keyframes: [
                  { t: 0, rotation: 0, easing: "hold" },
                  { t: teoAt + 0.4, rotation: 6, easing: "hold" },
                  { t: teoAt + 0.66, rotation: -28, easing: "hold" },
                  { t: teoAt + 0.84, rotation: -24, easing: "hold" },
                ],
              },
              {
                target: "right_forearm",
                keyframes: [
                  { t: 0, rotation: 0, easing: "hold" },
                  { t: teoAt + 0.5, rotation: 0, easing: "hold" },
                  { t: teoAt + 0.84, rotation: -20, easing: "hold" },
                ],
              },
              {
                target: "right_hand",
                keyframes: [
                  { t: 0, variant: "relaxed", easing: "hold" },
                  { t: teoAt + 0.84, variant: "point", easing: "hold" },
                ],
              },
            ],
          },
          {
            id: "gloam",
            assetId: "gloam",
            x: 960,
            y: 660,
            scale: 0.72,
            motion: "still",
            view: "front",
            tracks: [],
          },
        ],
        dialogue: [
          { id: "line_dot", speaker: "dot", text: DOT_LINE, at: dotAt, duration: dotDur },
          { id: "line_teo", speaker: "teo", text: TEO_LINE, at: teoAt, duration: teoDur },
          { id: "line_gloam", speaker: "gloam", text: GLOAM_LINE, at: gloamAt, duration: gloamDur },
        ],
      },
    ],
  });
  applyLipsync(episode, { sceneId: "kitchen", lineId: "line_dot", cues: dotCues });
  applyLipsync(episode, { sceneId: "kitchen", lineId: "line_teo", cues: teoCues });
  applyLipsync(episode, { sceneId: "kitchen", lineId: "line_gloam", cues: gloamCues });
  return validateEpisode(episode);
}

export function coilShedEpisode(cues) {
  return kitchenEpisode({
    dotCues: cues?.oonaCues,
    teoCues: cues?.pipCues,
    gloamCues: cues?.gloamCues,
  });
}

export function characterStill(characterId = "dot", view = "front") {
  const asset = buildLead(characterId === "pip" ? "dot" : characterId, {
    id: "still_" + characterId,
    primaryView: view,
  });
  return validateEpisode({
    version: 1,
    title: "Character still",
    logline: "Neutral pose for a line-quality comparison.",
    genre: "Study",
    style: "Flat cel cartoon",
    assets: [asset],
    scenes: [
      {
        id: "still",
        name: "Still",
        duration: 2,
        background: "#E0D3B4",
        lightAngleDeg: 135,
        contactShadow: "#898d73",
        camera: { x: 640, y: 360, zoom: 1, zoomEnd: 1 },
        instances: [
          {
            id: "actor",
            assetId: asset.id,
            x: 640,
            y: 700,
            scale: 0.92,
            motion: "still",
            view,
          },
        ],
        dialogue: [],
      },
    ],
  });
}
