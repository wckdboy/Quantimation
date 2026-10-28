import { spawn } from "node:child_process";
import { mkdtemp, readFile, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { endpoint } from "./director.mjs";
import { Worker } from "node:worker_threads";
import { neuralSpeech } from "./neural-speech.mjs";

function run(file, args, input, signal) {
  return new Promise((resolve, reject) => {
    const child = spawn(file, args, {
      windowsHide: true,
      stdio: ["pipe", "pipe", "pipe"],
      signal,
    });
    let bytes = 0;
    const chunks = [];
    const errors = [];
    child.stdout.on("data", (d) => {
      bytes += d.length;
      if (bytes > 15000000) {
        child.kill();
        reject(new Error("Speech output exceeded its size limit."));
      } else chunks.push(d);
    });
    child.stderr.on("data", (d) => {
      if (errors.length < 20) errors.push(d);
    });
    child.on("error", (e) =>
      reject(
        new Error(
          e.code === "ENOENT"
            ? "No system speech engine found. On Linux, install espeak-ng or configure an HTTP speech provider."
            : e.message,
        ),
      ),
    );
    child.on("close", (code) =>
      code === 0
        ? resolve(Buffer.concat(chunks))
        : reject(
            new Error(
              "System speech failed. Check the installed system voice or choose an HTTP speech provider.",
            ),
          ),
    );
    child.stdin.on("error", () => {});
    child.stdin.end(input);
  });
}
export async function synthesize(
  text,
  settings,
  signal = new AbortController().signal,
  progress,
) {
  if (typeof text !== "string" || text.length > 1600 || !text.trim())
    throw new Error("Speech text must contain 1–1600 characters.");
  if (settings.ttsProvider === "neural")
    return neuralSpeech(
      text,
      settings,
      AbortSignal.any([signal, AbortSignal.timeout(300000)]),
      progress,
    );
  const deadline = AbortSignal.any([signal, AbortSignal.timeout(90000)]);
  if (settings.ttsProvider === "builtin")
    return new Promise((resolve, reject) => {
      const worker = new Worker(
        new URL("./speech-worker.cjs", import.meta.url),
        {
          workerData: {
            text,
            voice: settings.systemVoice || "en/en-us",
            pitch: settings.pitch || 48,
          },
        },
      );
      const abort = () => {
        worker.terminate();
        reject(new Error("Speech generation cancelled."));
      };
      deadline.addEventListener("abort", abort, { once: true });
      const cleanup = () => deadline.removeEventListener("abort", abort);
      worker.once("message", (data) => {
        cleanup();
        worker.terminate();
        data.error
          ? reject(new Error(data.error))
          : resolve(Buffer.from(data.audio));
      });
      worker.once("error", (error) => {
        cleanup();
        reject(error);
      });
    });
  if (settings.ttsProvider === "http") {
    const res = await fetch(
      endpoint({ baseUrl: settings.ttsUrl }, "/audio/speech"),
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(settings.ttsKey
            ? { Authorization: `Bearer ${settings.ttsKey}` }
            : {}),
        },
        body: JSON.stringify({
          model: settings.ttsModel,
          voice: settings.providerVoice || settings.ttsVoice || "alloy",
          input: text,
          ...(settings.voiceInstructions
            ? { instructions: settings.voiceInstructions }
            : {}),
          speed: settings.voiceSpeed || 1,
          response_format: "wav",
        }),
        signal: deadline,
        redirect: "error",
      },
    );
    if (!res.ok)
      throw new Error(
        `Speech provider returned ${res.status}. Check speech settings.`,
      );
    const data = Buffer.from(await res.arrayBuffer());
    if (data.length > 15000000) throw new Error("Speech output is too large.");
    return data;
  }
  if (process.platform === "win32") {
    const script = `$ErrorActionPreference='Stop'; Add-Type -AssemblyName System.Speech; $r=[Console]::In.ReadToEnd() | ConvertFrom-Json; $s=New-Object System.Speech.Synthesis.SpeechSynthesizer; if($r.voice){$s.SelectVoice($r.voice)}; $s.Rate=0; $m=New-Object System.IO.MemoryStream; $s.SetOutputToWaveStream($m); $s.Speak([string]$r.text); $s.Dispose(); [Console]::Out.Write([Convert]::ToBase64String($m.ToArray())); $m.Dispose();`;
    const result = await run(
      "powershell.exe",
      [
        "-NoProfile",
        "-NonInteractive",
        "-EncodedCommand",
        Buffer.from(script, "utf16le").toString("base64"),
      ],
      JSON.stringify({ text, voice: settings.systemVoice || "" }),
      deadline,
    );
    return Buffer.from(result.toString().trim(), "base64");
  }
  if (process.platform === "darwin") {
    const dir = await mkdtemp(path.join(tmpdir(), "quantimation-speech-"));
    const output = path.join(dir, "line.wav");
    try {
      await run(
        "/usr/bin/say",
        [
          "-o",
          output,
          "--file-format=WAVE",
          "--data-format=LEI16@22050",
          ...(settings.systemVoice ? ["-v", settings.systemVoice] : []),
        ],
        text,
        deadline,
      );
      return await readFile(output);
    } finally {
      await rm(dir, { recursive: true, force: true });
    }
  }
  return run(
    "espeak-ng",
    [
      "--stdout",
      "--stdin",
      "-s",
      "155",
      ...(settings.systemVoice ? ["-v", settings.systemVoice] : []),
    ],
    text,
    deadline,
  );
}
