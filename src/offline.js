import { readFile, writeFile } from "node:fs/promises";
import { frameTimes } from "./timing.js";

export { frameTimes };

export function ffmpegMasterArgs({ frames, audio, output, fps = 24 }) {
  return [
    "-y",
    "-framerate",
    String(fps),
    "-start_number",
    "1",
    "-i",
    frames,
    "-i",
    audio,
    "-c:v",
    "libx264",
    "-pix_fmt",
    "yuv420p",
    "-crf",
    "17",
    "-preset",
    "medium",
    "-c:a",
    "aac",
    "-b:a",
    "192k",
    "-shortest",
    "-movflags",
    "+faststart",
    output,
  ];
}

export function readWav(buffer) {
  const view = new DataView(buffer.buffer, buffer.byteOffset, buffer.byteLength);
  if (buffer.toString("ascii", 0, 4) !== "RIFF") throw new Error("Not a WAV file.");
  const channels = view.getUint16(22, true);
  const rate = view.getUint32(24, true);
  const bits = view.getUint16(34, true);
  let offset = 12;
  while (offset < buffer.length - 8) {
    const id = buffer.toString("ascii", offset, offset + 4);
    const size = view.getUint32(offset + 4, true);
    if (id === "data") {
      const data = buffer.subarray(offset + 8, offset + 8 + size);
      const samples = bits === 16 ? data.length / 2 / channels : data.length / channels;
      const pcm = new Float32Array(samples);
      for (let i = 0; i < samples; i++) {
        let mixed = 0;
        for (let c = 0; c < channels; c++) {
          const index = (i * channels + c) * (bits / 8);
          mixed +=
            bits === 16
              ? data.readInt16LE(index) / 32768
              : (data[index] - 128) / 128;
        }
        pcm[i] = mixed / channels;
      }
      return { rate, pcm };
    }
    offset += 8 + size + (size % 2);
  }
  throw new Error("WAV data chunk missing.");
}

export function mixWavTimeline(clips, duration, rate = 24000) {
  const length = Math.ceil(duration * rate);
  const mix = new Float32Array(length);
  for (const clip of clips) {
    const sourceRate = clip.rate || rate;
    const start = Math.floor(clip.at * rate);
    const ratio = sourceRate / rate;
    const samples = Math.floor(clip.pcm.length / ratio);
    for (let i = 0; i < samples && start + i < length; i++) {
      const index = Math.min(clip.pcm.length - 1, Math.floor(i * ratio));
      mix[start + i] = Math.max(
        -1,
        Math.min(1, mix[start + i] + clip.pcm[index] * (clip.gain ?? 1)),
      );
    }
  }
  return mix;
}

export function encodeWav(pcm, rate = 24000) {
  const bytes = Buffer.alloc(44 + pcm.length * 2);
  bytes.write("RIFF", 0);
  bytes.writeUInt32LE(36 + pcm.length * 2, 4);
  bytes.write("WAVE", 8);
  bytes.write("fmt ", 12);
  bytes.writeUInt32LE(16, 16);
  bytes.writeUInt16LE(1, 20);
  bytes.writeUInt16LE(1, 22);
  bytes.writeUInt32LE(rate, 24);
  bytes.writeUInt32LE(rate * 2, 28);
  bytes.writeUInt16LE(2, 32);
  bytes.writeUInt16LE(16, 34);
  bytes.write("data", 36);
  bytes.writeUInt32LE(pcm.length * 2, 40);
  for (let i = 0; i < pcm.length; i++) {
    const sample = Math.max(-1, Math.min(1, pcm[i]));
    bytes.writeInt16LE(Math.round(sample * 32767), 44 + i * 2);
  }
  return bytes;
}

export async function loadWav(file) {
  return readWav(await readFile(file));
}

export async function writeWav(file, pcm, rate = 24000) {
  await writeFile(file, encodeWav(pcm, rate));
}
