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
        horizon: 390 / 720,
        floorY: 706,
        vanishX: 640,
        layout: "kitchen",
        contactShadow: "#898d73",
        camera: { x: 640, y: 360, zoom: 1, zoomEnd: 1 },
        shots: [
          {
            at: 0,
            label: "Wide",
            camera: { x: 640, y: 470, zoom: 1.04, zoomEnd: 1.04, perspective: "eye", motivated: true },
          },
          {
            at: 0.85,
            label: "Medium Dot",
            camera: { x: 520, y: 410, zoom: 1.26, zoomEnd: 1.26, perspective: "eye", motivated: true },
          },
          {
            at: 3.35,
            label: "Low angle",
            camera: { x: 640, y: 490, zoom: 1.05, zoomEnd: 1.05, perspective: "low", motivated: true },
          },
          {
            at: teoAt,
            label: "Close Teo",
            camera: { x: 640, y: 390, zoom: 1.62, zoomEnd: 1.62, perspective: "eye", motivated: true },
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
            drawingKeys: performance("dot", Array.from({ length: Math.ceil(duration / 1.6) + 1 }, (_, i) => {
              const t = Math.min(duration - 0.05, i * 1.6);
              const mode = ["stand", "look", "gesture", "look"][i % 4];
              const back = t >= teoAt && t < teoAt + 1.5;
              return {
                t,
                view: back ? "back" : "threeQuarter",
                drawing: back ? "stand" : mode,
                facing: 1,
                depth: 0.08,
                groundX: 110 + (i % 2) * 28,
                handL: "grip",
                prop: "tablet",
                lean: i % 2 ? 6 : -6,
                weight: i % 2 ? 0.4 : -0.35,
                headTilt: mode === "look" ? 8 : mode === "gesture" ? -6 : 1,
                plantL: 1,
                plantR: 1,
              };
            })),
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
              { t: 0, view: "profile", drawing: "contact", depth: 0.66, groundX: 980, lHip: 26, lean: 4, plantL: 0, plantR: 0 },
              { t: 0.5, view: "profile", drawing: "down", depth: 0.32, groundX: 820, lHip: 8, lean: -3, plantL: 0, plantR: 0 },
              { t: 1, view: "profile", drawing: "pass", depth: 0.22, groundX: 740, lHip: -6, headTilt: 3, plantL: 0, plantR: 0 },
              { t: 1.6, view: "profile", drawing: "up", depth: 0.14, groundX: 680, lHip: 4, lean: 2, plantL: 0, plantR: 0 },
              { t: 2.2, view: "threeQuarter", drawing: "stand", depth: 0.08, groundX: 700, lHip: 2, lean: -5, weight: -0.25, headTilt: 5, plantL: 1, plantR: 1 },
              { t: 3.6, view: "threeQuarter", drawing: "stand", depth: 0.08, groundX: 680, lHip: 2, lean: 6, weight: 0.4, headTilt: -6, plantL: 1, plantR: 1 },
              ...Array.from({ length: Math.ceil((duration - 4.4) / 1.5) }, (_, i) => ({
                t: 4.4 + i * 1.5,
                view: "threeQuarter",
                drawing: i % 2 ? "sitTalk" : "sit",
                depth: 0.08,
                groundX: 690,
                lHip: -70,
                lean: i % 2 ? 6 : -4,
                weight: i % 2 ? 0.3 : -0.25,
                headTilt: i % 2 ? -5 : 4,
                plantL: 1,
                plantR: 1,
              })),
              { t: duration - 0.2, view: "threeQuarter", drawing: "stand", depth: 0.08, groundX: 700, lHip: 2, lean: 2, headTilt: -2, plantL: 1, plantR: 1 },
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
            drawingKeys: performance("gloam", Array.from({ length: Math.ceil(duration / 1.6) + 1 }, (_, i) => ({
              t: Math.min(duration - 0.05, i * 1.6),
              view: "front",
              drawing: i % 2 ? "listen" : "stand",
              facing: -1,
              depth: 0.1,
              groundX: 1205,
              lean: i % 2 ? 6 : -4,
              weight: i % 2 ? -0.3 : 0.25,
              headTilt: i % 2 ? -7 : 5,
              blink: i % 4 === 3 ? 1 : 0,
              plantL: 1,
              plantR: 1,
            }))),
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
    dotCues: cues?.dotCues,
    teoCues: cues?.teoCues,
    gloamCues: cues?.gloamCues,
  });
}

export function characterStill(characterId = "dot", view = "front") {
  if (["pip", "oona", "quark"].includes(String(characterId || "").toLowerCase())) {
    throw new Error("Retired Quark-style cast cannot be rendered.");
  }
  const leadId = characterId;
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
