// Small deterministic sound cues, authored on the same clock as picture and speech.
export function soundBuffer(context, cue) {
  const rate = context.sampleRate,
    buffer = context.createBuffer(1, Math.ceil(rate * cue.duration), rate);
  const data = buffer.getChannelData(0);
  let seed = 2166136261,
    low = 0,
    phase = 0;
  for (const c of cue.id) seed = Math.imul(seed ^ c.charCodeAt(0), 16777619);
  const random = () => {
    seed ^= seed << 13;
    seed ^= seed >>> 17;
    seed ^= seed << 5;
    return (seed >>> 0) / 4294967296;
  };
  for (let i = 0; i < data.length; i++) {
    const t = i / rate,
      u = t / cue.duration,
      n = random() * 2 - 1;
    low = low * 0.94 + n * 0.06;
    const edge = Math.min(1, t / 0.04, (cue.duration - t) / 0.16);
    let value = 0;
    if (cue.type === "whoosh")
      value = (low * 2 + n * 0.1) * Math.sin(Math.PI * u) ** 1.5;
    else if (cue.type === "impact") {
      phase += (2 * Math.PI * (42 + 100 * Math.exp(-t * 18))) / rate;
      value =
        (Math.sin(phase) * 0.65 + low * 0.8 + n * 0.15) * Math.exp(-t * 7);
    } else if (cue.type === "fire")
      value =
        (low * 2.4 + n * 0.16) *
        (0.65 + 0.3 * Math.sin(t * 24)) *
        Math.min(1, t / 0.12);
    else if (cue.type === "crackle")
      value = low * 0.4 + (random() > 0.998 ? n * 0.8 : 0);
    else value = low * 2.8 * (0.7 + 0.3 * Math.sin(t * 9));
    data[i] = Math.max(-0.95, Math.min(0.95, value * edge * cue.gain));
  }
  return buffer;
}
