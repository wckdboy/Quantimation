import { spawn } from "node:child_process";
import { mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";

function run(bin, args) {
  return new Promise((resolve, reject) => {
    const child = spawn(bin, args, { stdio: ["ignore", "pipe", "pipe"] });
    let stderr = "";
    child.stderr.on("data", (chunk) => {
      stderr += chunk;
    });
    child.on("error", reject);
    child.on("close", (code) => {
      if (code === 0) resolve(stderr);
      else reject(new Error(stderr.trim() || `Rhubarb exited ${code}.`));
    });
  });
}

// Shells out to the official Rhubarb binary. `res/sphinx` must sit beside it.
// Node-only: the sandboxed renderer imports lipsync.js, not this module.
export async function rhubarbCues(wavPath, { bin, dialog, extended = false } = {}) {
  const executable = bin || process.env.RHUBARB || "rhubarb";
  const dir = await mkdtemp(path.join(os.tmpdir(), "quantimation-rhubarb-"));
  const out = path.join(dir, "cues.json");
  const dialogFile = path.join(dir, "dialog.txt");
  try {
    const args = ["-r", "pocketSphinx", "-f", "json", "-q", "-o", out];
    if (dialog) {
      await writeFile(dialogFile, dialog, "utf8");
      args.push("-d", dialogFile);
    }
    if (extended) args.push("--extendedShapes", "GHX");
    args.push(wavPath);
    await run(executable, args);
    const parsed = JSON.parse(await readFile(out, "utf8"));
    if (!Array.isArray(parsed.mouthCues) || !parsed.mouthCues.length)
      throw new Error("Rhubarb returned no mouth cues.");
    return parsed.mouthCues.map((cue) => ({
      start: cue.start,
      end: cue.end,
      value: cue.value,
    }));
  } finally {
    await rm(dir, { recursive: true, force: true });
  }
}
