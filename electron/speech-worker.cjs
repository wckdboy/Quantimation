const { parentPort, workerData } = require("node:worker_threads");
try {
  const meSpeak = require("mespeak");
  meSpeak.loadConfig(require("mespeak/src/mespeak_config.json"));
  const voice = /^[a-z]{2}(?:\/[a-z]{2}(?:-[a-z]{2})?)?$/.test(workerData.voice)
    ? workerData.voice
    : "en/en-us";
  try {
    meSpeak.loadVoice(require(`mespeak/voices/${voice}.json`));
  } catch {
    meSpeak.loadVoice(require("mespeak/voices/en/en-us.json"));
  }
  const audio = meSpeak.speak(workerData.text, {
    rawdata: "buffer",
    speed: 155,
    amplitude: 100,
    pitch: workerData.pitch,
  });
  parentPort.postMessage({ audio: new Uint8Array(audio) });
} catch (error) {
  parentPort.postMessage({
    error: "Built-in speech could not render this line: " + error.message,
  });
}
