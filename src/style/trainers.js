// Pluggable LoRA training. The base weights stay a separate download.
// FLUX.1-schnell is Apache-2.0, which a GPL-3 tool can call without shipping
// the weights. SDXL stays optional because its OpenRAIL license is not GPL.

export const BASE_MODEL = "black-forest-labs/FLUX.1-schnell";

export const PROVIDERS = {
  huggingface: {
    env: "HF_TOKEN",
    note: "Hugging Face Jobs. The script submits only when you pass --submit.",
  },
  replicate: {
    env: "REPLICATE_API_TOKEN",
    note: "Replicate training run. Submits only with --submit.",
  },
  fal: {
    env: "FAL_KEY",
    note: "fal training job. Submits only with --submit.",
  },
  runpod: {
    env: "RUNPOD_API_KEY",
    note: "RunPod pod or serverless job. Submits only with --submit.",
  },
};

export function trainingPlan(env = process.env) {
  const provider = env.QUANTIMATION_TRAIN_PROVIDER || "huggingface";
  const spec = PROVIDERS[provider];
  if (!spec) {
    return {
      ok: false,
      blocked: `Unknown trainer "${provider}". Use huggingface, replicate, fal, or runpod.`,
    };
  }
  const token = env[spec.env];
  const base = env.QUANTIMATION_BASE_MODEL || BASE_MODEL;
  const dataset = env.QUANTIMATION_STYLE_DATASET || "training/style";
  if (!token) {
    return {
      ok: false,
      provider,
      env: spec.env,
      base,
      dataset,
      blocked: `Training needs ${spec.env} for the ${provider} provider. Base model ${base} is downloaded by that provider, not shipped in this repo. No job was submitted.`,
    };
  }
  return {
    ok: true,
    provider,
    env: spec.env,
    base,
    dataset,
    note: spec.note,
  };
}
