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
  const kitchenLow = buildSet("suburb_kitchen_low", { id: "dot_kitchen_low" });
  const dotDur = durations.dot ?? 5.2;
  const teoDur = durations.teo ?? 4.2;
  const gloamDur = durations.gloam ?? 3.4;
  const dotAt = 0.8;
  const teoAt = dotAt + dotDur + 0.45;
  const gloamAt = teoAt + teoDur + 1.85;
  const duration = Math.min(32, Math.max(18, gloamAt + gloamDur + 1.8));
  const episode = validateEpisode({
    version: 1,
    title: "Page Four",
    logline:
      "Dot Lind will not file a claim for a talking kettle. Teo swears it only leaks when embarrassed. Gloam has already read the page.",
    genre: "Adult animated sitcom",
    style:
      "Original adult sitcom. Flat colour, one hard shadow, ink contours on characters and darkened local lines on the set. No boil.",
    assets: [kitchen, kitchenLow, dot, teo, gloam],
    scenes: [
      {
        id: "kitchen",
        name: "Dot's kitchen",
        description: "Daytime coverage of Dot's kitchen. One lens for the room and the cast.",
        duration,
        background: "#E0D3B4",
        environment: "dot_kitchen",
        palette: "kitchen_day",
        lightAngleDeg: 135,
        horizon: 248 / 720,
        floorY: 706,
        vanishX: 640,
        layout: "kitchen",
        contactShadow: "#898d73",
        camera: { x: 640, y: 360, zoom: 1, zoomEnd: 1 },
        shots: [
          {
            at: 0,
            label: "Walk in",
            camera: { x: 640, y: 360, zoom: 1, zoomEnd: 1, perspective: "eye" },
          },
          {
            at: 3.35,
            label: "Low angle",
            camera: { x: 640, y: 360, zoom: 1, zoomEnd: 1, perspective: "low" },
          },
          {
            at: teoAt,
            label: "Over the shoulder",
            camera: { x: 640, y: 360, zoom: 1, zoomEnd: 1, perspective: "eye" },
          },
          {
            at: Math.min(duration - 1.2, teoAt + teoDur + 0.08),
            label: "Hold",
            camera: { x: 640, y: 360, zoom: 1, zoomEnd: 1, perspective: "eye" },
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
              { t: 0, view: "threeQuarter", facing: 1, depth: 0.16, groundX: 220, handL: "grip", prop: "tablet", plantL: 1, plantR: 1 },
              { t: 3.1, view: "threeQuarter", facing: 1, depth: 0.16, groundX: 220, handL: "grip", prop: "tablet", weight: 0.2, plantL: 1, plantR: 1 },
              { t: teoAt, view: "back", facing: 1, depth: 0.15, groundX: 240, handL: "grip", prop: "tablet", plantL: 1, plantR: 1 },
              { t: teoAt + teoDur, view: "back", facing: 1, depth: 0.15, groundX: 240, handL: "grip", prop: "tablet", plantL: 1, plantR: 1 },
              { t: teoAt + teoDur + 0.2, view: "threeQuarter", facing: 1, depth: 0.16, groundX: 230, handL: "grip", prop: "tablet", plantL: 1, plantR: 1 },
              { t: duration - 0.2, view: "threeQuarter", facing: 1, depth: 0.16, groundX: 230, handL: "grip", prop: "tablet", plantL: 1, plantR: 1 },
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
              { t: 0, view: "profile", drawing: "contact", depth: 0.66, groundX: 980, lHip: 26, plantL: 0, plantR: 0 },
              { t: 0.5, view: "profile", drawing: "down", depth: 0.52, groundX: 880, lHip: 8, plantL: 0, plantR: 0 },
              { t: 1, view: "profile", drawing: "pass", depth: 0.4, groundX: 780, lHip: -6, plantL: 0, plantR: 0 },
              { t: 1.5, view: "profile", drawing: "up", depth: 0.3, groundX: 700, lHip: 4, plantL: 0, plantR: 0 },
              { t: 2.1, view: "profile", drawing: "contactR", depth: 0.24, groundX: 640, lHip: 22, plantL: 0, plantR: 0 },
              { t: 2.7, view: "threeQuarter", drawing: "stand", depth: 0.22, groundX: 640, lHip: 2, plantL: 1, plantR: 1 },
              { t: 4.2, view: "threeQuarter", drawing: "sit", depth: 0.22, groundX: 640, lHip: -74, plantL: 1, plantR: 1 },
              { t: teoAt + teoDur * 0.5, view: "threeQuarter", drawing: "sit", depth: 0.22, groundX: 640, lHip: -70, plantL: 1, plantR: 1 },
              { t: teoAt + teoDur + 0.8, view: "threeQuarter", drawing: "stand", depth: 0.22, groundX: 660, lHip: 3, plantL: 1, plantR: 1 },
              { t: duration - 0.2, view: "threeQuarter", drawing: "stand", depth: 0.22, groundX: 660, lHip: 2, plantL: 1, plantR: 1 },
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
              { t: 0, view: "front", facing: 1, depth: 0.15, groundX: 1060, plantL: 1, plantR: 1 },
              { t: gloamAt - 0.3, view: "front", facing: -1, depth: 0.15, groundX: 1060, lean: -2, plantL: 1, plantR: 1 },
              { t: gloamAt + 0.4, view: "front", facing: -1, depth: 0.15, groundX: 1060, lean: 2, plantL: 1, plantR: 1 },
              { t: duration - 0.2, view: "front", facing: -1, depth: 0.15, groundX: 1060, plantL: 1, plantR: 1 },
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
