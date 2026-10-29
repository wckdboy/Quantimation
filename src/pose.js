// Sparse, independently keyed local transforms. Holds preserve deliberate poses.
export function poseAt(track, time) {
  const state = { x: 0, y: 0, rotation: 0, scaleX: 1, scaleY: 1, opacity: 1 };
  if (!track) return state;
  for (const key of Object.keys(state)) {
    const frames = track.keyframes.filter((f) => f[key] !== undefined);
    if (!frames.length) continue;
    if (time <= frames[0].t) {
      state[key] = frames[0][key];
      continue;
    }
    let previous = frames[0];
    for (const next of frames.slice(1)) {
      if (time < next.t) {
        let u = (time - previous.t) / (next.t - previous.t);
        if (previous.easing === "hold") u = 0;
        else if (previous.easing !== "linear") u = u * u * (3 - 2 * u);
        state[key] = previous[key] + (next[key] - previous[key]) * u;
        break;
      }
      previous = next;
    }
    if (time >= frames.at(-1).t) state[key] = frames.at(-1)[key];
  }
  const variants = track.keyframes.filter(
    (f) => f.variant !== undefined && f.t <= time,
  );
  if (variants.length) state.variant = variants.at(-1).variant;
  return state;
}

// Approximate speech shapes from text timing. This is not phoneme alignment.
export function speechMouth(text = "", progress = 0, amplitude = 0) {
  if (amplitude < 0.045 || !text) return "closed";
  const i = Math.min(
    text.length - 1,
    Math.floor(Math.max(0, Math.min(1, progress)) * text.length),
  );
  const letter = text[i].toLowerCase();
  if (/[mbp]/.test(letter)) return "closed";
  if (/[ouw]/.test(letter)) return "round";
  if (/[fvstz]/.test(letter)) return "teeth";
  if (/[ae]/.test(letter) && amplitude > 0.16) return "wide";
  return "open";
}

export function motionOffset(motion, time) {
  if (motion === "still") return 0;
  if (motion === "bounce") return -Math.abs(Math.sin(time * 3)) * 18;
  if (motion === "float") return Math.sin(time * 2) * 12;
  if (motion === "walk") return -Math.abs(Math.sin(time * 7)) * 9;
  return 0;
}
