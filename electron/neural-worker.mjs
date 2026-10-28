import { parentPort, workerData } from "node:worker_threads";
import { env } from "@huggingface/transformers";
import { KokoroTTS } from "kokoro-js";
env.cacheDir = workerData.cache;
env.allowLocalModels = false;
let model;
let queue = Promise.resolve();
parentPort.on("message", (request) => {
  queue = queue.then(async () => {
    const { id, text, voice, speed } = request;
    try {
      if (!model)
        model = await KokoroTTS.from_pretrained(
          "onnx-community/Kokoro-82M-v1.0-ONNX",
          {
            dtype: "q8",
            device: "cpu",
            progress_callback: (p) => {
              if (p.status === "progress")
                parentPort.postMessage({
                  id,
                  progress: { file: p.file, percent: Math.round(p.progress) },
                });
            },
          },
        );
      // Kokoro has a finite token window. Split long dialogue so it is never silently truncated.
      const phrases = text.match(/[^.!?]+[.!?]+|[^.!?]+$/g) || [text];
      const chunks = [];
      let buffer = "";
      for (const phrase of phrases) {
        if ((buffer + phrase).length > 320 && buffer) {
          chunks.push(buffer.trim());
          buffer = "";
        }
        if (phrase.length > 320) {
          for (const word of phrase.split(/\s+/)) {
            if ((buffer + " " + word).length > 320) {
              chunks.push(buffer.trim());
              buffer = "";
            }
            buffer += " " + word;
          }
        } else buffer += phrase;
      }
      if (buffer.trim()) chunks.push(buffer.trim());
      const segments = [];
      for (const chunk of chunks) {
        const audio = await model.generate(chunk, { voice, speed });
        segments.push(audio.audio);
      }
      const silence = segments.length > 1 ? 2400 : 0;
      const samples = new Float32Array(
        segments.reduce((n, s) => n + s.length, 0) +
          silence * Math.max(0, segments.length - 1),
      );
      let offset = 0;
      for (const segment of segments) {
        samples.set(segment, offset);
        offset += segment.length + silence;
      }
      const wav = new Uint8Array(44 + samples.length * 2);
      const view = new DataView(wav.buffer);
      const ascii = (at, s) => {
        for (let i = 0; i < s.length; i++) wav[at + i] = s.charCodeAt(i);
      };
      ascii(0, "RIFF");
      view.setUint32(4, wav.length - 8, true);
      ascii(8, "WAVEfmt ");
      view.setUint32(16, 16, true);
      view.setUint16(20, 1, true);
      view.setUint16(22, 1, true);
      view.setUint32(24, 24000, true);
      view.setUint32(28, 48000, true);
      view.setUint16(32, 2, true);
      view.setUint16(34, 16, true);
      ascii(36, "data");
      view.setUint32(40, samples.length * 2, true);
      for (let i = 0; i < samples.length; i++)
        view.setInt16(
          44 + i * 2,
          Math.max(-1, Math.min(1, samples[i])) * 32767,
          true,
        );
      parentPort.postMessage({ id, audio: wav }, [wav.buffer]);
    } catch (error) {
      model = null;
      parentPort.postMessage({
        id,
        error: "Neural speech failed: " + error.message,
      });
    }
  });
});
