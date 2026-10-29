import { buildLead } from "./cast.js";
import { applyLipsync } from "./directing.js";
import { inbetweenKeys } from "./drawn.js";
import { CHAIR } from "./layout.js";
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
    assets: [kitchen, dot, teo, gloam],
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
        horizon: 0.72,
        floorY: 710,
        vanishX: 620,
        lens: true,
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
              { t: 0, view: "threeQuarter", facing: 1, depth: 0.2, groundX: 160, wx: 118, wz: 168, handL: "grip", prop: "tablet", weight: -0.25, lShoulder: -18, lElbow: -36, rShoulder: 8, plantL: 1, plantR: 1 },
              { t: 3.1, view: "threeQuarter", facing: 1, depth: 0.18, groundX: 150, wx: 122, wz: 166, handL: "grip", prop: "tablet", weight: 0.3, lean: -3, squash: 0.98, plantL: 1, plantR: 1 },
              { t: teoAt - 0.06, view: "threeQuarter", facing: 1, depth: 0.18, wx: 120, wz: 168, handL: "grip", prop: "tablet", weight: 0.05, plantL: 1, plantR: 1 },
              { t: teoAt, view: "back", facing: 1, depth: 0.08, wx: 168, wz: 108, handL: "grip", prop: "tablet", weight: 0, plantL: 1, plantR: 1 },
              { t: teoAt + teoDur, view: "back", facing: 1, depth: 0.08, wx: 168, wz: 108, handL: "grip", prop: "tablet", lean: 2, plantL: 1, plantR: 1 },
              { t: teoAt + teoDur + 0.08, view: "threeQuarter", facing: 1, depth: 0.18, wx: 124, wz: 170, handL: "grip", prop: "tablet", plantL: 1, plantR: 1 },
              { t: duration - 0.2, view: "threeQuarter", facing: 1, depth: 0.18, wx: 126, wz: 168, handL: "grip", prop: "tablet", weight: -0.1, plantL: 1, plantR: 1 },
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
              { t: 0, view: "threeQuarter", facing: 1, depth: 0.82, groundX: 640, wx: CHAIR.x + 8, wz: 320, lHip: 32, rHip: -26, lKnee: 16, rKnee: 22, lShoulder: -22, rShoulder: 18, squash: 0.95, arc: 10, plantL: 0, plantR: 0 },
              { t: 0.55, view: "threeQuarter", facing: 1, depth: 0.7, wx: CHAIR.x + 6, wz: 286, lHip: -24, rHip: 30, lKnee: 20, rKnee: 14, lShoulder: 16, rShoulder: -18, squash: 1.05, arc: 10, plantL: 0, plantR: 0 },
              { t: 1.15, view: "threeQuarter", facing: 1, depth: 0.55, wx: CHAIR.x + 4, wz: 250, lHip: 28, rHip: -20, lKnee: 12, rKnee: 18, lShoulder: -16, rShoulder: 14, squash: 0.96, plantL: 0, plantR: 0 },
              { t: 1.8, view: "threeQuarter", facing: 1, depth: 0.4, wx: CHAIR.x, wz: 220, lHip: -8, rHip: 18, lKnee: 10, rKnee: 8, squash: 1.02, plantL: 0, plantR: 0 },
              { t: 2.45, view: "threeQuarter", facing: 1, depth: 0.32, wx: CHAIR.x - 4, wz: 196, lHip: 2, rHip: -2, squash: 1, plantL: 1, plantR: 1, lean: 0, weight: 0.1 },
              { t: 3.05, view: "threeQuarter", facing: -1, depth: 0.3, wx: CHAIR.x + 6, wz: 192, lHip: 4, rHip: -2, lean: 5, weight: 0.15, plantL: 1, plantR: 1 },
              { t: 3.45, view: "threeQuarter", facing: -1, depth: 0.3, wx: CHAIR.x + 4, wz: 194, lHip: -6, rHip: -4, lean: -7, weight: -0.45, squash: 1.06, lShoulder: -28, rShoulder: 22, plantL: 1, plantR: 1 },
              { t: 4.15, view: "threeQuarter", facing: -1, depth: 0.28, wx: CHAIR.x, wz: CHAIR.z - 4, lHip: -46, rHip: -42, lKnee: 36, rKnee: 32, lean: 8, weight: -0.35, squash: 0.9, plantL: 1, plantR: 1 },
              { t: 4.7, view: "threeQuarter", facing: -1, depth: 0.26, wx: CHAIR.x, wz: CHAIR.z - 8, lHip: -74, rHip: -70, lKnee: 70, rKnee: 66, lean: 3, weight: -0.1, squash: 0.86, plantL: 1, plantR: 1 },
              { t: 5.2, view: "threeQuarter", facing: -1, depth: 0.26, wx: CHAIR.x, wz: CHAIR.z - 10, lHip: -64, rHip: -60, lean: -2, squash: 1.02, plantL: 1, plantR: 1 },
              { t: 5.7, view: "threeQuarter", facing: -1, depth: 0.26, wx: CHAIR.x, wz: CHAIR.z - 10, lHip: -70, rHip: -66, lean: 0, weight: 0, squash: 0.97, plantL: 1, plantR: 1 },
              { t: teoAt, view: "threeQuarter", facing: -1, depth: 0.26, wx: CHAIR.x, wz: CHAIR.z - 10, lHip: -70, rHip: -66, squash: 0.97, handR: "point", rShoulder: -36, rElbow: -24, plantL: 1, plantR: 1 },
              { t: teoAt + teoDur - 0.4, view: "threeQuarter", facing: -1, depth: 0.26, wx: CHAIR.x, wz: CHAIR.z - 10, lHip: -70, rHip: -66, squash: 0.98, handR: "relaxed", lean: 2, plantL: 1, plantR: 1 },
              { t: teoAt + teoDur + 0.05, view: "threeQuarter", facing: -1, depth: 0.26, wx: CHAIR.x, wz: CHAIR.z - 12, lHip: -62, rHip: -58, lean: -8, weight: 0.7, squash: 1.06, lShoulder: 20, rShoulder: -16, plantL: 1, plantR: 1 },
              { t: teoAt + teoDur + 0.55, view: "threeQuarter", facing: -1, depth: 0.3, wx: CHAIR.x - 2, wz: CHAIR.z - 16, lHip: -16, rHip: -12, lean: -4, weight: 0.35, squash: 1.08, plantL: 1, plantR: 1 },
              { t: teoAt + teoDur + 0.95, view: "threeQuarter", facing: -1, depth: 0.32, wx: CHAIR.x - 6, wz: CHAIR.z - 28, lHip: 6, rHip: -4, lean: 3, weight: 0.1, squash: 0.93, plantL: 1, plantR: 1 },
              { t: teoAt + teoDur + 1.35, view: "threeQuarter", facing: -1, depth: 0.32, wx: CHAIR.x - 8, wz: CHAIR.z - 30, lHip: 2, rHip: -2, lean: 0, weight: 0.05, squash: 1, plantL: 1, plantR: 1 },
              { t: duration - 0.2, view: "threeQuarter", facing: -1, depth: 0.32, wx: CHAIR.x - 8, wz: CHAIR.z - 30, lHip: 2, rHip: -2, squash: 1, plantL: 1, plantR: 1 },
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
              { t: 0, view: "front", facing: 1, depth: 0.24, groundX: 980, wx: 410, wz: 210, lean: 0, plantL: 1, plantR: 1 },
              { t: gloamAt - 0.3, view: "front", facing: -1, depth: 0.22, wx: 404, wz: 198, lean: -2, headTilt: 2, plantL: 1, plantR: 1 },
              { t: gloamAt + 0.4, view: "front", facing: -1, depth: 0.2, wx: 400, wz: 190, lean: 3, headTilt: -4, squash: 0.97, plantL: 1, plantR: 1 },
              { t: duration - 0.2, view: "front", facing: -1, depth: 0.2, wx: 402, wz: 194, lean: 0, plantL: 1, plantR: 1 },
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
