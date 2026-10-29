import { buildLead } from "./cast.js";
import { applyLipsync } from "./directing.js";
import { inbetweenKeys } from "./drawn.js";
import { buildSet } from "./sets.js";
import { validateEpisode } from "./model.js";

export const DOT_LINE =
  "The form has a box for a talking kettle. I am leaving it blank.";
export const TEO_LINE = "It only leaks when it is embarrassed.";
export const GLOAM_LINE = "Page four. It has always been page four.";

function performance(character, keys) {
  return inbetweenKeys(keys.map((key) => ({ ...key, character })), { step: 2 / 24, arc: 10 });
}

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
        horizon: 0.72,
        floorY: 710,
        vanishX: 620,
        contactShadow: "#898d73",
        camera: { x: 640, y: 390, zoom: 1.08, zoomEnd: 1.08 },
        shots: [
          {
            at: 0,
            label: "Walk in",
            camera: { x: 640, y: 430, zoom: 1.05, zoomEnd: 1.05, panX: 40, perspective: "eye" },
          },
          {
            at: 4.2,
            label: "Low angle",
            camera: { x: 520, y: 480, zoom: 1.15, zoomEnd: 1.15, perspective: "low" },
          },
          {
            at: teoAt,
            label: "Over the shoulder",
            camera: { x: 700, y: 420, zoom: 1.2, zoomEnd: 1.2, perspective: "eye" },
          },
          {
            at: Math.min(duration - 1.4, gloamAt + 0.2),
            label: "Hold",
            camera: { x: 640, y: 430, zoom: 1.08, zoomEnd: 1.08, perspective: "eye" },
          },
        ],
        sounds: [],
        instances: [
          {
            id: "dot",
            assetId: "dot",
            x: 420,
            y: 680,
            scale: 1,
            motion: "still",
            view: "threeQuarter",
            timing: "twos",
            drawingKeys: performance("dot", [
              { t: 0, view: "threeQuarter", depth: 0.2, groundX: 160, handL: "grip", prop: "tablet", weight: -0.4, lShoulder: 18, lElbow: 24, rShoulder: -8 },
              { t: 3.2, view: "threeQuarter", depth: 0.18, groundX: 150, handL: "grip", prop: "tablet", weight: 0.35, lean: -4, lShoulder: 16, lElbow: 20, rShoulder: -6, squash: 0.97 },
              { t: duration - 0.2, view: "threeQuarter", depth: 0.18, groundX: 160, handL: "grip", prop: "tablet", weight: -0.1 },
            ]),
            tracks: [],
          },
          {
            id: "teo",
            assetId: "teo",
            x: 640,
            y: 680,
            scale: 1,
            motion: "still",
            view: "front",
            timing: "twos",
            drawingKeys: performance("teo", [
              { t: 0, view: "threeQuarter", depth: 0.78, groundX: 620, lHip: 26, rHip: -24, lKnee: 18, rKnee: 8, lShoulder: -18, rShoulder: 16, squash: 0.95, arc: 14 },
              { t: 0.6, view: "threeQuarter", depth: 0.55, groundX: 620, lHip: -10, rHip: 24, lKnee: 8, rKnee: 18, lShoulder: 16, rShoulder: -14, squash: 1.05, arc: 14 },
              { t: 1.3, view: "front", depth: 0.36, groundX: 620, lHip: 22, rHip: -18, lKnee: 14, rKnee: 6, lShoulder: -14, rShoulder: 12, squash: 0.94, arc: 10 },
              { t: 2.2, view: "front", depth: 0.24, groundX: 620, lHip: 3, rHip: -3, squash: 1, handR: "point", rShoulder: -28, rElbow: -16 },
              { t: teoAt, view: "front", depth: 0.24, groundX: 620, lHip: -64, rHip: -60, lKnee: 78, rKnee: 74, squash: 0.96, lean: 2, handR: "relaxed" },
              { t: duration - 0.2, view: "front", depth: 0.24, groundX: 620, lHip: -64, rHip: -60, lKnee: 78, rKnee: 74, squash: 0.96 },
            ]),
            tracks: [],
          },
          {
            id: "gloam",
            assetId: "gloam",
            x: 900,
            y: 680,
            scale: 1,
            motion: "still",
            view: "front",
            timing: "twos",
            drawingKeys: performance("gloam", [
              { t: 0, view: "front", depth: 0.2, groundX: 980, lean: 0 },
              { t: gloamAt, view: "front", depth: 0.18, groundX: 1000, lean: 2, headTilt: -3 },
              { t: duration - 0.2, view: "front", depth: 0.18, groundX: 990, lean: 0 },
            ]),
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
  const leadId = characterId === "pip" ? "dot" : characterId;
  const asset = buildLead(leadId, {
    id: leadId,
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
            timing: "twos",
            drawingKeys: [
              {
                t: 0,
                character: leadId,
                view,
                depth: 0.2,
                groundX: 640,
              },
            ],
          },
        ],
        dialogue: [],
      },
    ],
  });
}
