// Broadcast timing. Characters step on twos (12 drawings per second of a
// 24 fps master). Camera moves stay continuous unless a shot asks otherwise.

export function onTwos(time, fps = 24) {
  if (!Number.isFinite(time) || time <= 0) return 0;
  return Math.floor(time * (fps / 2)) / (fps / 2);
}

export function smoothstep(u) {
  const t = Math.max(0, Math.min(1, u));
  return t * t * (3 - 2 * t);
}

export function shakeOffset(time, amount = 0, seed = 0) {
  if (!amount) return { x: 0, y: 0 };
  const held = onTwos(time);
  return {
    x:
      Math.sin(held * 54 + seed) * amount +
      Math.sin(held * 27.5 + 1.3) * amount * 0.35,
    y: Math.cos(held * 47 + seed * 0.5) * amount * 0.7,
  };
}

export function smearVector(previous, next, threshold = 28) {
  const dx = next.x - previous.x;
  const dy = next.y - previous.y;
  const distance = Math.hypot(dx, dy);
  if (distance < threshold) return null;
  return {
    dx,
    dy,
    distance,
    scaleX: 1 + Math.min(0.55, distance / 160),
  };
}

export function frameTimes(duration, fps = 24) {
  const count = Math.max(1, Math.round(duration * fps));
  return Array.from({ length: count }, (_, index) => ({
    index,
    time: Math.min(Math.max(0, duration - 1e-4), index / fps),
  }));
}

export const FRAME_SIZES = {
  720: { width: 1280, height: 720 },
  1080: { width: 1920, height: 1080 },
  2160: { width: 3840, height: 2160 },
};

export function frameSize(height = 1080) {
  return FRAME_SIZES[height] || FRAME_SIZES[1080];
}
