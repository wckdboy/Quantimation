// Rhubarb Lip Sync mouth set A-H + X, in mouth-local units: neutral mouth width = 100, origin = mouth centre on the lip line, y down.
// Cavity = region between upper lip curve U(x) and lower lip curve L(x) over x in [-w/2, w/2].
const N = 24;
const curve = (w, c, y0, exp = 1) => (x) => c + (y0 - c) * Math.pow(Math.max(0, 1 - (2 * x / w) ** 2), exp);
function sample(w, f) { return Array.from({ length: N + 1 }, (_, i) => { const x = -w / 2 + (w * i) / N; return [x, f(x)]; }); }
function region(w, top, bot) { const a = sample(w, top), b = sample(w, bot).reverse(); return [...a, ...b.slice(1, -1)]; }
export const VISEMES = {
  A: { label: 'A  M B P (closed, pressed)', w: 100, jaw: 0.0, open: null, line: { w: 100, c: 0, y: 3 }, ticks: true, lowerLip: 13 },
  B: { label: 'B  K S T EE (clenched teeth)', w: 100, jaw: 0.0, open: { u: -7, l: 11, exp: 0.9 }, teethAll: true },
  C: { label: 'C  EH AE (open)', w: 96, jaw: 0.06, open: { u: -10, l: 30, exp: 0.8 }, teeth: 9, tongue: 9 },
  D: { label: 'D  AA (wide open)', w: 104, jaw: 0.14, open: { u: -12, l: 50, exp: 0.75 }, teeth: 10, tongue: 13 },
  E: { label: 'E  AO ER (slightly rounded)', w: 64, jaw: 0.08, open: { u: -11, l: 26, exp: 0.6 }, teeth: 6, tongue: 7 },
  F: { label: 'F  UW OW W (pucker)', w: 34, jaw: 0.04, pucker: true },
  G: { label: 'G  F V (teeth on lower lip)', w: 92, jaw: 0.0, open: { u: -9, l: 5, exp: 0.9 }, teethAll: true, lipOver: true },
  H: { label: 'H  L (tongue up)', w: 94, jaw: 0.07, open: { u: -10, l: 32, exp: 0.8 }, teeth: 8, tongueUp: true },
  X: { label: 'X  idle / rest', w: 88, jaw: 0.0, open: null, line: { w: 88, c: 0, y: 2 }, lowerLip: 11 },
};
// returns { cavity, teeth, tongue, lines[], lineOpen[] } polygons/polylines in mouth units
export function visemeGeometry(k) {
  const v = VISEMES[k], g = { fills: [], lines: [], details: [] };
  if (v.line) {
    g.lines.push(sample(v.line.w, curve(v.line.w, v.line.c, v.line.y)));
    if (v.ticks) { g.details.push([[-50, 0], [-54, -4]], [[50, 0], [54, -4]]); }
    if (v.lowerLip) g.details.push(sample(36, curve(36, v.lowerLip - 2, v.lowerLip + 2)).map(([x, y]) => [x, y]));
    return g;
  }
  if (v.pucker) {
    const ring = Array.from({ length: 40 }, (_, i) => { const a = (i / 40) * Math.PI * 2; return [Math.cos(a) * 17, 6 + Math.sin(a) * 18]; });
    const hole = Array.from({ length: 32 }, (_, i) => { const a = (i / 32) * Math.PI * 2; return [Math.cos(a) * 9, 7 + Math.sin(a) * 10]; });
    g.fills.push({ role: 'lips', pts: ring }, { role: 'cavity', pts: hole });
    g.lines.push([...ring, ring[0]]);
    g.details.push([[-22, -6], [-26, -2]], [[22, -6], [26, -2]], [[-6, 27], [6, 27]]);
    return g;
  }
  const { u, l, exp } = v.open, w = v.w;
  const U = curve(w, 0, u, 1), L = curve(w, 0, l, exp);
  g.fills.push({ role: 'cavity', pts: region(w, U, L) });
  if (v.teethAll) g.fills.push({ role: 'teeth', pts: region(w * 0.94, (x) => U(x) + 0.5, (x) => L(x) - 0.5) });
  if (v.teeth) { const T = (x) => Math.min(U(x) + v.teeth, L(x)); g.fills.push({ role: 'teeth', pts: region(w * 0.9, (x) => U(x) + 0.3, T) }); }
  if (v.tongue) { const tw = w * 0.62, Tt = curve(tw, 0, -v.tongue, 1); g.fills.push({ role: 'tongue', pts: region(tw, (x) => Math.max(L(x) + Tt(x), U(x) + (v.teeth || 0) + 2), (x) => L(x) - 0.5) }); }
  if (v.tongueUp) { const pts = [[-24, L(-24) - 1], [-14, 10], [-6, (v.teeth || 8) - 9], [6, (v.teeth || 8) - 9], [14, 10], [24, L(24) - 1], [0, L(0) - 1]]; g.fills.push({ role: 'tongue', pts }); }
  g.lines.push([...region(w, U, L), sample(w, U)[0]]);
  if (v.teethAll) g.details.push(sample(w * 0.8, (x) => (U(x) + L(x)) / 2 + 0.5));
  if (v.lipOver) g.lines.push(sample(w * 0.74, curve(w * 0.74, l + 1, l + 10)));
  return g;
}
