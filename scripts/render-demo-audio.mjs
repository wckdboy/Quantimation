import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { dragonEpisode as demoEpisode } from "../src/dragon.js";
import { familyShowcase } from "../src/family.js";
import { neuralSpeech, stopNeuralSpeech } from "../electron/neural-speech.mjs";
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const cache =
  process.env.QUANTIMATION_MODEL_CACHE || path.join(root, ".cache", "models");
const destination = path.join(root, "resources", "demo-audio");
await mkdir(destination, { recursive: true });
const index = [];
try {
  for (const project of [demoEpisode(), familyShowcase()]) {
    for (const scene of project.scenes) {
      for (const line of scene.dialogue) {
        const asset = project.assets.find((a) => a.id === line.speaker);
        const voiceId = asset?.voice?.id || "af_bella",
          voiceSpeed = asset?.voice?.speed || 1;
        console.log(`Rendering ${line.id}: ${voiceId}`);
        const progress = new Set();
        const audio = await neuralSpeech(
          line.text,
          { neuralCache: cache, voiceId, voiceSpeed },
          new AbortController().signal,
          (p) => {
            const bucket = Math.floor(p.percent / 20) * 20,
              key = p.file + bucket;
            if (!progress.has(key)) {
              progress.add(key);
              console.log(`Model ${p.file}: ${bucket}%`);
            }
          },
        );
        await writeFile(path.join(destination, line.id + ".wav"), audio);
        index.push({
          text: line.text,
          voiceId,
          voiceSpeed,
          file: line.id + ".wav",
        });
      }
    }
  }
  await writeFile(
    path.join(destination, "index.json"),
    JSON.stringify(index, null, 2),
  );
  console.log(`Saved ${index.length} neural dialogue clips.`);
} finally {
  await stopNeuralSpeech();
}
