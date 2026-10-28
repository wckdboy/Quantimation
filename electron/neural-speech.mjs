import { Worker } from "node:worker_threads";
let worker,
  sequence = 0;
const pending = new Map();
function getWorker(cache) {
  if (worker) return worker;
  worker = new Worker(new URL("./neural-worker.mjs", import.meta.url), {
    workerData: { cache },
  });
  worker.unref();
  worker.on("message", (message) => {
    const task = pending.get(message.id);
    if (!task) return;
    if (message.progress) {
      task.progress?.(message.progress);
      return;
    }
    pending.delete(message.id);
    message.error
      ? task.reject(new Error(message.error))
      : task.resolve(Buffer.from(message.audio));
  });
  worker.on("error", (error) => {
    for (const task of pending.values()) task.reject(error);
    pending.clear();
    worker = null;
  });
  worker.on("exit", (code) => {
    if (code !== 0) {
      for (const task of pending.values())
        task.reject(new Error("Neural speech worker stopped."));
      pending.clear();
    }
    worker = null;
  });
  return worker;
}
export function neuralSpeech(text, settings, signal, progress) {
  return new Promise((resolve, reject) => {
    const id = ++sequence;
    const abort = () => {
      const entry = pending.get(id);
      if (entry) {
        pending.delete(id);
        reject(new Error("Neural speech cancelled."));
      }
    };
    if (signal?.aborted) {
      reject(new Error("Neural speech cancelled."));
      return;
    }
    signal?.addEventListener("abort", abort, { once: true });
    const finish = (fn) => (value) => {
      signal?.removeEventListener("abort", abort);
      fn(value);
    };
    pending.set(id, {
      resolve: finish(resolve),
      reject: finish(reject),
      progress,
    });
    getWorker(settings.neuralCache).postMessage({
      id,
      text,
      voice: settings.voiceId || "af_bella",
      speed: settings.voiceSpeed || 1,
    });
  });
}
export async function stopNeuralSpeech() {
  if (worker) await worker.terminate();
}
