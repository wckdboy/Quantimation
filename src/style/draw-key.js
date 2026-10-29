// draw_key asks a configured backend for one raster key, then traces it.
// Without a backend this throws. It does not invent pixels.

import { createCanvas, loadImage } from "@napi-rs/canvas";
import { authorDrawing } from "../drawings.js";
import { assertIpSafe } from "./ip.js";
import { poseSkeleton } from "./skeleton.js";
import { auditTracedKey, sheetPalette, traceImageData } from "./trace.js";

const CHARACTERS = new Set(["dot", "teo", "gloam"]);

export function drawKeyBlock() {
  return [
    "No key was generated.",
    "Set QUANTIMATION_DRAW_URL to a local ComfyUI or diffusers endpoint that accepts POST /draw and returns image/png,",
    "or set QUANTIMATION_DRAW_BACKEND to fal (FAL_KEY), replicate (REPLICATE_API_TOKEN), or huggingface (HF_TOKEN).",
    "The base model is black-forest-labs/FLUX.1-schnell (Apache-2.0). Weights are downloaded by that provider.",
  ].join(" ");
}

function endpoint(env) {
  const backend = env.QUANTIMATION_DRAW_BACKEND || "";
  const url = env.QUANTIMATION_DRAW_URL || "";
  if (url) return { kind: "http", url };
  if (backend === "fal" && env.FAL_KEY) return { kind: "fal" };
  if (backend === "replicate" && env.REPLICATE_API_TOKEN) return { kind: "replicate" };
  if (backend === "huggingface" && env.HF_TOKEN) return { kind: "huggingface" };
  return null;
}

export function keyPrompt({ character, view, pose, set }) {
  const text = [
    `${character} Lind original character`,
    `${view} view`,
    `${pose} pose`,
    set ? `${set} set, matching the scene camera` : "plain paper background",
    "flat cel colour, ink contour, one drawing",
  ].join(", ");
  assertIpSafe(text, "Prompt");
  const negative = "photoreal, 3d render, text, watermark, extra limbs, blurry";
  assertIpSafe(negative, "Negative");
  return { text, negative };
}

async function requestImage(target, body) {
  if (target.kind !== "http") {
    throw new Error(drawKeyBlock());
  }
  const response = await fetch(target.url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  if (!response.ok) throw new Error(`Draw backend returned ${response.status}.`);
  return Buffer.from(await response.arrayBuffer());
}

export async function drawKey(spec, env = process.env) {
  const character = String(spec.character || "").toLowerCase();
  if (!CHARACTERS.has(character)) throw new Error(`draw_key knows dot, teo and gloam, not ${spec.character}.`);
  assertIpSafe(`${spec.pose || ""} ${spec.prompt || ""} ${spec.set || ""}`, "draw_key");
  const view = spec.view || "front";
  const pose = spec.pose || "stand";
  const prompt = keyPrompt({ character, view, pose, set: spec.set });
  const skeleton = spec.skeleton || poseSkeleton({
    character,
    view,
    depth: spec.depth ?? 0.2,
    groundX: spec.groundX ?? 640,
  });
  const target = endpoint(env);
  if (!target) throw new Error(drawKeyBlock());
  let last = null;
  for (let attempt = 1; attempt <= 3; attempt += 1) {
    const png = await requestImage(target, {
      prompt: prompt.text,
      negative: prompt.negative,
      skeleton,
      control: "openpose",
      attempt,
      model: env.QUANTIMATION_BASE_MODEL || "black-forest-labs/FLUX.1-schnell",
      lora: env.QUANTIMATION_LORA_URL || "",
    });
    const image = await loadImage(png);
    const canvas = createCanvas(image.width, image.height);
    const ctx = canvas.getContext("2d");
    ctx.drawImage(image, 0, 0);
    const pixels = ctx.getImageData(0, 0, image.width, image.height);
    const shapes = traceImageData(pixels.data, image.width, image.height, { palette: sheetPalette(character) });
    const drawing = {
      character,
      view,
      pose,
      width: image.width,
      height: image.height,
      crown: 8,
      chin: Math.round(image.height / (character === "gloam" ? 2.2 : 4.5)),
      feet: [[image.width * 0.4, image.height - 4], [image.width * 0.6, image.height - 4]],
      shapes,
    };
    const audit = auditTracedKey(character, drawing);
    if (audit.ok && shapes.length) {
      authorDrawing(drawing);
      return { ...drawing, attempts: attempt, stored: true };
    }
    last = audit.flags;
  }
  throw new Error(`Off-model key rejected: ${(last || ["empty"]).join(", ")}`);
}
