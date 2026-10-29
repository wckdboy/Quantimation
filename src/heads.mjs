// Canonical front-view head constructions in head-height units (HH = skull top to chin = 1).
// Origin: skull top centre. y grows downward.
import { roundRectPts, ellipsePts, quadPts } from './line-engine.mjs';
export const HEADS = {
  dot: {
    W: 0.92, eyeY: 0.42, scleraD: 0.32 * 0.92, aspect: 1.0, overlap: 0.01 * 0.92, noseY: 0.58, mouthY: 0.78, mouthW: 0.30 * 0.92,
    skull: () => roundRectPts(-0.46, 0, 0.92, 1.0, 0.2, 0.3),
    hairBack: () => roundRectPts(-0.56, -0.1, 1.12, 0.76, 0.34, 0.03),
    fringe: () => [[-0.5, 0.06], ...quadPts([-0.5, 0.06], [0, -0.16], [0.5, 0.06], 20).slice(1), [0.5, 0.06], [0.48, 0.3], [-0.48, 0.3]],
    nose: () => quadPts([0.02, 0.55], [0.08, 0.62], [-0.005, 0.645], 12),
    mouth: () => quadPts([-0.138, 0.78], [0, 0.795], [0.138, 0.775], 16),
    neck: () => [[-0.13, 0.9], [0.13, 0.9], [0.14, 1.2], [-0.14, 1.2]],
  },
  teo: {
    W: 0.78, eyeY: 0.40, scleraD: 0.36 * 0.78, aspect: 1.06, overlap: 0.01 * 0.78, noseY: 0.56, mouthY: 0.80, mouthW: 0.30 * 0.78,
    skull: () => roundRectPts(-0.39, 0, 0.78, 1.0, 0.36, 0.22),
    hairBack: () => {
      const pts = [];
      const curls = [[-0.42, 0.26, 0.09], [-0.42, 0.12, 0.1], [-0.36, -0.02, 0.11], [-0.22, -0.11, 0.12], [-0.06, -0.15, 0.12], [0.1, -0.15, 0.12], [0.25, -0.1, 0.12], [0.37, 0.0, 0.11], [0.42, 0.13, 0.1], [0.42, 0.27, 0.09]];
      return curls;
    },
    beard: () => [[-0.39, 0.56], ...quadPts([-0.39, 0.56], [-0.34, 1.12], [0, 1.08], 14).slice(1), ...quadPts([0, 1.08], [0.34, 1.12], [0.39, 0.56], 14).slice(1), [0.36, 0.6], ...quadPts([0.34, 0.66], [0.2, 0.7], [0.0, 0.7], 8), ...quadPts([0.0, 0.7], [-0.2, 0.7], [-0.34, 0.66], 8), [-0.36, 0.6]],
    nose: () => quadPts([0.02, 0.53], [0.08, 0.6], [-0.005, 0.625], 12),
    mouth: () => quadPts([-0.117, 0.8], [0, 0.815], [0.117, 0.795], 16),
    neck: () => [[-0.11, 0.9], [0.11, 0.9], [0.12, 1.2], [-0.12, 1.2]],
  },
  gloam: {
    W: 1.0, eyeY: 0.45, scleraD: 0.30, aspect: 1.0, overlap: 0.01, noseY: null, mouthY: 0.70, mouthW: 0.18,
    skull: () => { // dome merging into a narrower neck, widening again into the body below y=1
      const top = Array.from({ length: 41 }, (_, i) => { const a = Math.PI + (i / 40) * Math.PI; return [Math.cos(a) * 0.5, 0.55 + Math.sin(a) * 0.55]; });
      return [...top, ...quadPts([0.5, 0.55], [0.48, 0.85], [0.36, 1.0], 12).slice(1), [-0.36, 1.0], ...quadPts([-0.36, 1.0], [-0.48, 0.85], [-0.5, 0.55], 12).slice(1, -1)];
    },
    mouth: () => quadPts([-0.09, 0.70], [0, 0.725], [0.09, 0.70], 12),
  },
};
export function eyes(h) {
  const r = h.scleraD / 2, cx = r - h.overlap / 2;
  return [[-cx, h.eyeY, r, r * h.aspect], [cx, h.eyeY, r, r * h.aspect]];
}
export const tf = (pts, s, ox, oy) => pts.map(([x, y]) => [ox + x * s, oy + y * s]);
