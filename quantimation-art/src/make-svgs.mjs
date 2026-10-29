import fs from 'fs';
import * as LE from './line-engine.mjs';
import { HEADS, eyes, tf } from './heads.mjs';
import { VISEMES, visemeGeometry } from './visemes.mjs';
const P = JSON.parse(fs.readFileSync('../palettes.json', 'utf8'));
const OUT = '../images/';
const INK = P.line.ink, C = P.line.classes, CH = P.characters;
const BG = '#EEECE7', GUIDE = '#5B8DB8', DIM = '#C0504D', MUTED = '#6B6670';
const svg = (w, h, body) => `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}"><rect width="${w}" height="${h}" fill="${BG}"/><g font-family="DejaVu Sans, Arial, sans-serif">${body}</g></svg>`;
const T = (x, y, s, size = 18, o = {}) => `<text x="${x}" y="${y}" font-size="${size}" fill="${o.fill || '#2A2630'}" text-anchor="${o.anchor || 'start'}" font-weight="${o.weight || 400}">${s.replace(/&/g, '&amp;').replace(/</g, '&lt;')}</text>`;
const poly = (pts, fill, o = {}) => `<path d="M${pts.map((p) => p[0].toFixed(2) + ' ' + p[1].toFixed(2)).join('L')}${o.open ? '' : 'Z'}" fill="${fill}" ${o.stroke ? `stroke="${o.stroke}" stroke-width="${o.sw || 1}" stroke-dasharray="${o.dash || ''}"` : ''} ${o.extra || ''}/>`;
const line = (x1, y1, x2, y2, col = GUIDE, sw = 1.5, dash = '') => `<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" stroke="${col}" stroke-width="${sw}" stroke-dasharray="${dash}"/>`;
const ink = (pts, cls, o = {}) => `<path d="${LE.styledStroke(pts, cls, { closed: !!o.closed, seed: LE.fnv1a(o.seed || 'x'), light: o.light })}" fill="${o.col || INK}" fill-rule="evenodd"/>`;
const pathD = (pts) => 'M' + pts.map((p) => p[0].toFixed(2) + ' ' + p[1].toFixed(2)).join('L') + 'Z';
let clipN = 0;
// offset-mask shadow: shadow = part minus part translated toward the light. lightDeg: direction light comes FROM (135 = upper-left).
function shaded(pts, base, shadow, lightDeg = 135, k = 0.12, o = {}) {
  const xs = pts.map((p) => p[0]), w = Math.max(...xs) - Math.min(...xs), a = (lightDeg * Math.PI) / 180;
  const dx = Math.cos(a) * w * k, dy = -Math.sin(a) * w * k, id = 'c' + clipN++;
  const moved = pts.map(([x, y]) => [x + dx, y + dy]);
  let s = `<clipPath id="${id}"><path d="${pathD(pts)}"/></clipPath>${poly(pts, base)}<g clip-path="url(#${id})"><path d="M-5000 -5000H9000V9000H-5000Z ${pathD(moved)}" fill="${shadow}" fill-rule="evenodd"/>`;
  if (o.rim) { const ra = (o.rim.deg * Math.PI) / 180, rw = o.rim.w; const away = pts.map(([x, y]) => [x - Math.cos(ra) * rw, y + Math.sin(ra) * rw]); s += `<path d="M-5000 -5000H9000V9000H-5000Z ${pathD(away)}" fill="${o.rim.col}" fill-rule="evenodd"/>`; }
  return s + '</g>';
}
// ---------- Dot head renderer (front) used in several sheets ----------
function drawHead(id, s, ox, oy, o = {}) {
  const h = HEADS[id], pal = o.pal || Object.fromEntries(Object.entries(CH[id].parts).map(([k, v]) => [k, v]));
  const light = o.light ?? 135, rim = o.rim;
  let g = '';
  const skin = pal.skin;
  if (id === 'dot') {
    g += shaded(tf(h.neck(), s, ox, oy), skin.base, skin.shadow, light, 0.25);
    g += ink(tf(h.neck(), s, ox, oy).slice(1, 3), C.contour, { seed: 'neckR' }) + ink([tf(h.neck(), s, ox, oy)[3], tf(h.neck(), s, ox, oy)[0]], C.contour, { seed: 'neckL' });
    g += shaded(tf(h.hairBack(), s, ox, oy), pal.hair.base, pal.hair.shadow, light, 0.08) + ink(tf(h.hairBack(), s, ox, oy), C.contour, { closed: true, seed: 'hairB' });
    g += shaded(tf(h.skull(), s, ox, oy), skin.base, skin.shadow, light, 0.12, { rim }) + ink(tf(h.skull(), s, ox, oy), C.contour, { closed: true, seed: 'skull' });
  } else if (id === 'teo') {
    g += shaded(tf(h.neck(), s, ox, oy), skin.base, skin.shadow, light, 0.25);
    for (const [cx, cy, r] of h.hairBack()) { const e = LE.ellipsePts(ox + cx * s, oy + cy * s, r * s, r * s, 40); g += poly(e, pal.hair.base) + ink(e, C.contour, { closed: true, seed: 'curl' + cx }); }
    for (const sx of [-1, 1]) { const e = LE.ellipsePts(ox + sx * 0.4 * s, oy + 0.47 * s, 0.06 * s, 0.09 * s, 32); g += poly(e, skin.base) + ink(e, C.contour, { closed: true, seed: 'ear' + sx }); }
    g += shaded(tf(h.skull(), s, ox, oy), skin.base, skin.shadow, light, 0.12, { rim }) + ink(tf(h.skull(), s, ox, oy), C.contour, { closed: true, seed: 'skullT' });
    // hair cap over forehead
    const cap = [[-0.36, 0.2], ...LE.quadPts([-0.36, 0.2], [0, -0.12], [0.36, 0.2], 16).slice(1), ...LE.quadPts([0.36, 0.2], [0.2, 0.08], [0, 0.12], 8).slice(1), ...LE.quadPts([0, 0.12], [-0.2, 0.08], [-0.36, 0.2], 8).slice(1)];
    g += poly(tf(cap, s, ox, oy), pal.hair.base) + ink(tf(cap, s, ox, oy), C.interior, { closed: true, seed: 'cap' });
    g += poly(tf(h.beard(), s, ox, oy), pal.beard.base) + ink(tf(h.beard(), s, ox, oy), C.contour, { closed: true, seed: 'beard' });
    for (const [fx, fy] of [[-0.26, 0.6], [-0.22, 0.64], [-0.29, 0.65], [0.26, 0.6], [0.22, 0.64]]) g += poly(LE.ellipsePts(ox + fx * s, oy + fy * s, 0.008 * s, 0.008 * s, 10), pal.freckles.base);
  } else {
    g += shaded(tf(h.skull(), s, ox, oy), skin.base, skin.shadow, light, 0.12, { rim }) + ink(tf(h.skull(), s, ox, oy), C.contour, { closed: true, seed: 'dome' });
  }
  const lid = o.lid || 0;
  for (const [i, [ex, ey, rx, ry]] of eyes(h).entries()) {
    const e = LE.ellipsePts(ox + ex * s, oy + ey * s, rx * s, ry * s, 72);
    if (lid >= 1) { const arc = LE.quadPts([ox + (ex - rx) * s, oy + ey * s], [ox + ex * s, oy + (ey + ry * 0.55) * s], [ox + (ex + rx) * s, oy + ey * s], 20); g += ink(arc, C.interior, { seed: 'blink' + i }); continue; }
    g += poly(e, P.shared.sclera);
    const pr = rx * 2 * P.eyes.pupilDiameterOfSclera * s * (o.scared ? P.eyes.scaredPupilScale : 1) / 2;
    const look = o.look || [0, 0];
    g += poly(LE.ellipsePts(ox + (ex + look[0] * rx * 0.3) * s, oy + (ey + look[1] * ry * 0.3) * s, pr, pr, 20), INK);
    if (lid > 0) { const id2 = 'l' + clipN++, top = oy + (ey - ry) * s, cut = top + 2 * ry * s * lid, tilt = (o.tilt || 0) * (i ? -1 : 1);
      const L = [[ox + (ex - rx) * s - 4, top - 6], [ox + (ex + rx) * s + 4, top - 6], [ox + (ex + rx) * s + 4, cut + Math.tan((tilt * Math.PI) / 180) * rx * s], [ox + (ex - rx) * s - 4, cut - Math.tan((tilt * Math.PI) / 180) * rx * s]];
      g += `<clipPath id="${id2}"><path d="${pathD(e)}"/></clipPath><g clip-path="url(#${id2})">${poly(L, skin.base)}</g>` + ink([L[3], L[2]].map(([x, y], j) => [x + (j ? -4 : 4), y]), C.interior, { seed: 'lid' + i }); }
    g += ink(e, C.eye, { closed: true, seed: id + 'eye' + i });
  }
  if (h.nose) g += ink(tf(h.nose(), s, ox, oy), C.interior, { seed: 'nose' + id });
  if (!o.noMouth) g += ink(tf(h.mouth(), s, ox, oy), C.mouth, { seed: 'mouth' + id });
  if (id === 'dot') { g += shaded(tf(h.fringe(), s, ox, oy), pal.hair.base, pal.hair.shadow, light, 0.06) + ink(tf(h.fringe(), s, ox, oy), C.contour, { closed: true, seed: 'fringe' }); }
  return g;
}
const files = {};
// ================= 1. LINE RULES =================
{
  let b = T(40, 56, 'Quantimation line rules: widths are screen px at 1920x1080 (stage units = px / 1.5)', 28, { weight: 700 });
  b += T(40, 92, 'All samples below are drawn by src/line-engine.mjs at 1:1, so measure them directly.', 18, { fill: MUTED });
  const rows = [['contour', 'character outer contour'], ['eye', 'sclera outline'], ['prop', 'hand prop contour'], ['mouth', 'mouth shapes'], ['interior', 'folds, lids, nose, brows'], ['detail', 'wrinkles, freckle marks'], ['bg', 'background contour'], ['bgDetail', 'background interior'], ['bgFar', 'far parallax layer']];
  rows.forEach(([k, d], i) => {
    const y = 150 + i * 46, cls = C[k], col = k.startsWith('bg') ? '#6C5A44' : k === 'detail' ? CH.dot.parts.skin.detailLine : INK;
    const pts = LE.cubicPts([60, y + 10], [200, y - 18], [380, y + 30], [520, y], 60);
    b += ink(pts, cls, { seed: k, col });
    b += T(545, y + 8, `${k}  ${cls.px}px  ${cls.taper ? 'taper ' + cls.taper[0] * 100 + '%/' + cls.taper[1] * 100 + '%' : 'no taper'}  wobble ${cls.wobblePx}px`, 16) + T(545, y + 28, d + (k.startsWith('bg') ? ' (colour: local fill darkened, never ink)' : ''), 14, { fill: MUTED });
  });
  // taper plot
  const px = 1080, py = 140, pw = 780, ph = 240;
  b += T(px, py - 14, 'Taper profile for open strokes (width fraction along the stroke)', 18, { weight: 700 });
  b += `<rect x="${px}" y="${py}" width="${pw}" height="${ph}" fill="#fff" stroke="#ccc"/>`;
  const curvePts = Array.from({ length: 101 }, (_, i) => [px + (pw * i) / 100, py + ph - ph * LE.taperWidth(i / 100, P.line.taper)]);
  b += poly(curvePts, 'none', { open: true, stroke: DIM, sw: 3 });
  for (const [u, lab] of [[0, 'start 30%'], [0.18, 'full at 18%'], [0.78, 'ramp from 78%'], [1, 'end 45%']]) b += line(px + pw * u, py, px + pw * u, py + ph, '#bbb', 1, '4 4') + T(px + pw * u + (u >= 0.7 ? -6 : 6), py + ph + 22, lab, 14, { anchor: u >= 0.7 ? 'end' : 'start' });
  b += T(px, py + ph + 48, 'Curve: smoothstep. Closed contours do not taper. Their width varies by ±15%', 15, { fill: MUTED }) + '';
  b += T(px, py + ph + 70, 'instead, heavier on the side away from the light.', 15, { fill: MUTED }) + T(px, py + ph + 92, 'A stroke ending in a T-junction keeps 100% width.', 15, { fill: MUTED }); if(0) b += T(px, py + ph + 70, 'A stroke that ends inside a T-junction keeps 100% width so the joint does not open.', 15, { fill: MUTED });
  // wobble comparison
  const wy = 640;
  b += T(40, wy - 40, 'Wobble: fixed per drawing (seeded), measured in px along the normal, with corners kept sharp', 20, { weight: 700 });
  [[0, '0 px: dead vector (current paths)'], [0.7, '0.7 px: character spec'], [3.0, '3 px: too much (pencil filter)']].forEach(([a, lab], i) => {
    const cx = 170 + i * 320, e = LE.ellipsePts(cx, wy + 110, 110, 110, 160);
    b += ink(e, { ...C.contour, wobblePx: a }, { closed: true, seed: 'w' + i, light: [0.7071, 0.7071] }) + T(cx, wy + 260, lab, 14, { anchor: 'middle' });
  });
  const rr = LE.roundRectPts(1080, wy + 10, 260, 200, 2, 2, 2);
  b += ink(rr, { ...C.contour, wobblePx: 0.9 }, { closed: true, seed: 'rect' }) + T(1210, wy + 260, 'corners above 35° keep 0 wobble within 6 px', 14, { anchor: 'middle' });
  b += T(1400, wy + 40, 'Seed = fnv1a(assetId/shapeId/variant/view)', 16) + T(1400, wy + 66, 'The same drawing gives the same wobble on every frame.', 16) + T(1400, wy + 92, 'Noise octaves: 90 px wavelength at 0.7 weight', 16) + T(1400, wy + 118, 'plus 32 px wavelength at 0.3 weight.', 16) + T(1400, wy + 144, 'Resample the path every 3 px before displacing.', 16) + T(1400, wy + 170, 'Boil is off unless a layer opts in (see BIBLE.md).', 16);
  files['line-rules.svg'] = svg(1920, 1000, b);
}
// ================= 2. LINE ON BG vs CHARACTER (do / don't) =================
{
  let b = T(40, 50, 'Line and colour separation: character against background', 26, { weight: 700 });
  const sc = P.scenes.kitchen_day;
  const panel = (ox, good) => {
    let g = `<rect x="${ox}" y="80" width="900" height="560" fill="${sc.bg.wall}"/>`;
    const tile = [[ox, 300], [ox + 900, 300], [ox + 900, 400], [ox, 400]], cab = [[ox, 400], [ox + 900, 400], [ox + 900, 640], [ox, 640]], counter = [[ox, 380], [ox + 900, 380], [ox + 900, 410], [ox, 410]];
    const bl = (pts, fill, cls) => poly(pts, good ? fill : fill) + ink(pts, good ? C[cls] : { ...C.contour, px: 4 }, { closed: true, seed: 'bg' + pts[0][1], col: good ? sc.bgLine[Object.keys(sc.bg).find((k) => sc.bg[k] === fill)] || '#6C5A44' : INK });
    g += bl(tile, sc.bg.tile, 'bg') + bl(cab, sc.bg.cabinet, 'bg') + bl(counter, sc.bg.counter, 'bg');
    for (let i = 0; i < 4; i++) { const d = [[ox + 40 + i * 220, 440], [ox + 220 + i * 220, 440], [ox + 220 + i * 220, 620], [ox + 40 + i * 220, 620]]; g += ink(d, good ? C.bgDetail : { ...C.contour, px: 4 }, { closed: true, seed: 'door' + i, col: good ? sc.bgLine.cabinet : INK }); g += poly(LE.ellipsePts(ox + 200 + i * 220, 530, 6, 6, 12), good ? sc.bgLine.cabinet : INK); }
    for (let i = 0; i < 9; i++) g += ink([[ox + i * 100, 300], [ox + i * 100, 380]], good ? C.bgDetail : { ...C.contour, px: 4 }, { seed: 't' + i, col: good ? sc.bgLine.tile : INK });
    g += drawHead('dot', 300, ox + 450, 170);
    g += T(ox + 20, 680, good ? 'DO: BG lines 2.5/1.5 px, darkened local colour. Character 4 px ink.' : "DON'T: BG inked like a character. Equal weight, the face gets lost.", 17, { weight: 700, fill: good ? '#2E6B3A' : DIM });
    return g;
  };
  b += panel(40, true) + panel(980, false);
  files['line-bg-vs-character.svg'] = svg(1920, 720, b);
}
// ================= 3. EYE CONSTRUCTION =================
{
  let b = T(40, 50, 'Goggle eye construction (Dot shown, head width W = 0.92 HH)', 26, { weight: 700 });
  const h = HEADS.dot, s = 900, ox = 520, oy = -40;
  const E = eyes(h);
  for (const [i, [ex, ey, rx, ry]] of E.entries()) {
    const e = LE.ellipsePts(ox + ex * s, oy + ey * s, rx * s, ry * s, 120);
    b += poly(e, P.shared.sclera) + ink(e, C.eye, { closed: true, seed: 'eyeBig' + i });
    const pr = rx * 2 * 0.11 * s / 2;
    b += poly(LE.ellipsePts(ox + ex * s, oy + ey * s, pr, pr, 30), INK);
    b += poly(LE.ellipsePts(ox + ex * s, oy + ey * s, rx * 0.3 * s, rx * 0.3 * s, 60), 'none', { stroke: GUIDE, sw: 1.5, dash: '6 5' });
  }
  const [l, r] = E, yL = oy + (l[1] - l[3]) * s - 30;
  b += line(ox + (l[0] - l[2]) * s, yL, ox + (l[0] + l[2]) * s, yL, DIM, 2) + T(ox + l[0] * s, yL - 10, 'sclera Ø = 0.32 W (aspect h/w 1.00)', 18, { anchor: 'middle', fill: DIM });
  b += T(ox, oy + (l[1] + l[3]) * s + 40, 'inner edges overlap by 0-2% W, so the eyes always touch', 18, { anchor: 'middle', fill: DIM });
  b += T(ox + r[0] * s + r[2] * s + 20, oy + r[1] * s - 10, 'pupil Ø = 0.11 × sclera Ø, solid ink, no iris, no highlight', 17, { fill: DIM });
  b += T(ox + r[0] * s + r[2] * s + 20, oy + r[1] * s + 16, 'dashed ring = max pupil travel (0.30 r); both pupils move together', 17, { fill: GUIDE });
  b += T(ox + r[0] * s + r[2] * s + 20, oy + r[1] * s + 42, 'dazed or wonky: pupils may diverge by up to 4% of sclera Ø', 17, { fill: MUTED });
  b += T(ox + r[0] * s + r[2] * s + 20, oy + r[1] * s + 68, 'outline 3.5 px, wobble 0.9 px (slightly wonkier than body)', 17, { fill: MUTED });
  // lid states
  const states = [['open', 0, 0], ['deadpan 45%', 0.45, 0], ['smug 50%, 8° tilt', 0.5, 8], ['annoyed 30%, -12°', 0.3, -12], ['sad, 14° tilt', 0.18, 14], ['scared (pupil 0.6x)', 0, 0, true], ['blink 100%', 1, 0]];
  states.forEach(([lab, lid, tilt, scared], i) => {
    const cx = 140 + i * 255, cy = 610, ss = 210;
    b += `<rect x="${cx - 115}" y="${cy - 30}" width="230" height="200" rx="10" fill="#fff" stroke="#ddd"/>`;
    // eyes only from head renderer: crop to eye area via clip
    const id = 'eyeclip' + i;
    b += `<clipPath id="${id}"><rect x="${cx - 115}" y="${cy - 30}" width="230" height="160"/></clipPath><g clip-path="url(#${id})">${drawHead('dot', ss, cx, cy - 25, { lid, tilt, scared, noMouth: true })}</g>`;
    b += T(cx, cy + 158, lab, 15, { anchor: 'middle' });
  });
  b += T(40, 840, 'Lids: a skin-coloured shape clipped to the sclera, with its lower edge inked as a 2.75 px interior line. The % is how much of the sclera height is covered.', 16, { fill: MUTED });
  b += T(40, 866, 'Gloam has no brows, so his lids do all the acting. Dot and Teo have brows (2.75 px interior strokes) 0.08 HH above the sclera top, which move ±12° in rotation and up to 0.04 HH in y.', 16, { fill: MUTED });
  files['eye-construction.svg'] = svg(1920, 900, b);
}
// ================= 4. HEAD CONSTRUCTION + PROPORTIONS =================
{
  let b = T(40, 50, 'Head construction (front view). HH = skull top to chin. Guide lines are shared by every view.', 26, { weight: 700 });
  const s = 420, base = 150;
  const ids = ['dot', 'teo', 'gloam'], names = ['Dot: rounded rectangle (stable, dry)', 'Teo: tall capsule (earnest, stretched)', 'Gloam: dome into neck (soft, unflappable)'];
  ids.forEach((id, i) => {
    const ox = 330 + i * 600, h = HEADS[id];
    for (const [y, lab] of [[0, 'skull top 0'], [h.eyeY, 'eye line ' + h.eyeY], ...(h.noseY ? [[h.noseY, 'nose ' + h.noseY]] : []), [h.mouthY, 'mouth ' + h.mouthY], [1, 'chin / neck 1.0']]) b += line(ox - 270, base + y * s, ox + 250, base + y * s, GUIDE, 1.2, '6 5') + T(ox + 255, base + y * s + 5, lab, 13, { fill: GUIDE });
    b += poly(tf(h.skull(), s, ox, base), 'none', { stroke: GUIDE, sw: 2, dash: '3 4' });
    b += drawHead(id, s, ox, base);
    b += T(ox, base + s + 110, names[i], 18, { anchor: 'middle', weight: 700 });
    b += T(ox, base + s + 136, `head width ${h.W} HH · mouth width ${(h.mouthW / h.W).toFixed(2)} W · sclera ${(h.scleraD / h.W).toFixed(2)} W`, 15, { anchor: 'middle', fill: MUTED });
  });
  b += T(40, 820, 'Silhouette shapes: Dot = rectangle, Teo = inverted triangle on a tall capsule, Gloam = pear and circle. No two leads share a primary shape.', 17);
  files['head-construction.svg'] = svg(1920, 860, b);
}
{
  // proportions lineup with head-height grid
  let b = T(40, 50, 'Proportions in head heights (HH). Floor = 0. Grid lines every 0.5 HH.', 26, { weight: 700 });
  const floor = 980, HHpx = 180;
  for (let k = 0; k <= 10; k++) { const y = floor - k * 0.5 * HHpx; b += line(60, y, 1420, y, k % 2 ? '#d8d6d0' : '#bdbab3', 1) + (k % 2 ? '' : T(30, y + 5, String(k / 2), 14, { fill: MUTED })); }
  const fig = (id, ox, total, L) => {
    const pal = CH[id].parts, s = HHpx, top = floor - total * s; let g = '';
    const R = (x0, y0, x1, y1, col, sh) => { const pts = [[ox + x0 * s, top + y0 * s], [ox + x1 * s, top + y0 * s], [ox + x1 * s, top + y1 * s], [ox + x0 * s, top + y1 * s]]; return shaded(pts, col, sh, 135, 0.18) + ink(pts, C.contour, { closed: true, seed: id + x0 + y0 }); };
    const Trap = (pts, col, sh) => { const q = pts.map(([x, y]) => [ox + x * s, top + y * s]); return shaded(q, col, sh, 135, 0.14) + ink(q, C.contour, { closed: true, seed: id + pts[0] }); };
    if (id === 'dot') {
      g += R(-0.25, L.crotch - 0.02, -0.03, L.ankle, pal.trousers.base, pal.trousers.shadow) + R(0.03, L.crotch - 0.02, 0.25, L.ankle, pal.trousers.base, pal.trousers.shadow);
      g += R(-0.29, L.ankle, -0.02, L.floor, pal.shoes.base, pal.shoes.shadow) + R(0.02, L.ankle, 0.29, L.floor, pal.shoes.base, pal.shoes.shadow);
      g += Trap([[-0.42, 1.15], [0.42, 1.15], [0.40, L.waist + 0.3], [-0.40, L.waist + 0.3]], pal.blazer.base, pal.blazer.shadow);
      g += R(-0.56, 1.2, -0.42, L.hand, pal.blazer.base, pal.blazer.shadow) + R(0.42, 1.2, 0.56, L.hand, pal.blazer.base, pal.blazer.shadow);
    } else if (id === 'teo') {
      g += R(-0.24, L.crotch - 0.05, -0.03, L.ankle, pal.overalls.base, pal.overalls.shadow) + R(0.03, L.crotch - 0.05, 0.24, L.ankle, pal.overalls.base, pal.overalls.shadow);
      g += R(-0.28, L.ankle, -0.02, L.floor, pal.boots.base, pal.boots.shadow) + R(0.02, L.ankle, 0.28, L.floor, pal.boots.base, pal.boots.shadow);
      g += Trap([[-0.45, 1.15], [0.45, 1.15], [0.30, L.crotch], [-0.30, L.crotch]], pal.shirt.base, pal.shirt.shadow);
      g += Trap([[-0.26, 1.55], [0.26, 1.55], [0.30, L.crotch], [-0.30, L.crotch]], pal.overalls.base, pal.overalls.shadow);
      g += R(-0.58, 1.2, -0.45, L.hand, pal.shirt.base, pal.shirt.shadow) + R(0.45, 1.2, 0.58, L.hand, pal.shirt.base, pal.shirt.shadow);
    } else {
      const body = LE.ellipsePts(ox, top + 1.42 * s, 0.52 * s, 0.5 * s, 80);
      g += R(-0.3, 1.7, -0.08, L.floor, pal.skin.base, pal.skin.shadow) + R(0.08, 1.7, 0.3, L.floor, pal.skin.base, pal.skin.shadow);
      g += shaded(body, pal.skin.base, pal.skin.shadow, 135, 0.12) + ink(body, C.contour, { closed: true, seed: 'gbody' });
      g += Trap([[-0.42, 1.0], [0.42, 1.0], [0.5, 1.5], [-0.5, 1.5]], pal.vest.base, pal.vest.shadow);
      g += R(-0.62, 1.1, -0.5, L.hand, pal.skin.base, pal.skin.shadow) + R(0.5, 1.1, 0.62, L.hand, pal.skin.base, pal.skin.shadow);
    }
    g += drawHead(id, s, ox, top);
    return g;
  };
  const LM = { dot: { total: 4.25, waist: 2.0, crotch: 2.35, ankle: 4.1, floor: 4.25, hand: 2.6 }, teo: { total: 4.75, waist: 2.25, crotch: 2.6, ankle: 4.6, floor: 4.75, hand: 2.9 }, gloam: { total: 2.0, crotch: 1.6, floor: 2.0, hand: 1.55 } };
  b += fig('dot', 330, 4.25, LM.dot) + fig('teo', 760, 4.75, LM.teo) + fig('gloam', 1170, 2.0, LM.gloam);
  b += T(330, floor + 36, 'Dot 4.25 HH', 18, { anchor: 'middle', weight: 700 }) + T(760, floor + 36, 'Teo 4.75 HH', 18, { anchor: 'middle', weight: 700 }) + T(1170, floor + 36, 'Gloam 2.0 HH', 18, { anchor: 'middle', weight: 700 });
  b += T(1470, 140, 'Landmarks (from the skull top, in HH)', 18, { weight: 700 });
  const rowsL = ['Dot: chin 1.0, shoulder 1.2, waist 2.0,', '  crotch 2.35, fingertips 2.6, knee 3.3,', '  ankle 4.1, floor 4.25', '', 'Teo: chin 1.0, shoulder 1.2, waist 2.25,', '  crotch 2.6, fingertips 2.9, knee 3.65,', '  ankle 4.6, floor 4.75', '', 'Gloam: neck 1.0, vest hem 1.45,', '  fingertips 1.55, crotch 1.6, floor 2.0', '', 'Hands: 4 fingers (3 + thumb).', 'Hand length 0.55 HH (Dot, Teo) and', '  0.35 HH (Gloam). Fingers are 45% of', '  hand length.', '', 'These figures are block-ins for proportion.', 'The finished model is in the turnarounds.'];
  rowsL.forEach((r, i) => (b += T(1470, 172 + i * 26, r, 16, { fill: r.startsWith(' ') ? MUTED : '#2A2630' })));
  // silhouette test
  b += T(1470, 680, 'Silhouette test at 96 px tall (fill = ink)', 18, { weight: 700 });
  const sil = (id, ox, total, L) => fig(id, ox, total, L).replace(/fill="#[0-9A-Fa-f]{6}"/g, `fill="${INK}"`);
  b += `<g transform="translate(1470 ${700 - 0}) scale(0.12) translate(-200 -150)">${sil('dot', 330, 4.25, LM.dot)}${sil('teo', 760, 4.75, LM.teo)}${sil('gloam', 1170, 2.0, LM.gloam)}</g>`;
  b += T(1470, 860, 'Each lead must stay identifiable in solid black', 15, { fill: MUTED }) + T(1470, 882, 'at this size, in every key pose.', 15, { fill: MUTED });
  files['proportions.svg'] = svg(1920, 1040, b);
}
// ================= 5. VISEMES =================
const mouthJSON = {};
{
  let b = T(40, 50, 'Rhubarb mouth chart for Dot (A–H plus X). Exact geometry is in mouth-visemes.dot.json.', 26, { weight: 700 });
  b += T(40, 80, 'Mouth width unit = 100 (0.30 × head width). Corners stay within ±6 units of each other, except E and F. The jaw value is how far the chin drops, as a fraction of mouth width.', 16, { fill: MUTED });
  const keys = Object.keys(VISEMES);
  const pal = CH.dot.parts, h = HEADS.dot;
  keys.forEach((k, i) => {
    const col = i % 5, row = Math.floor(i / 5), cx = 200 + col * 370, cy = 260 + row * 400, s = 1.9;
    const v = VISEMES[k], g0 = visemeGeometry(k), HS = (100 / h.mouthW) * 1.9; // head scale so mouth width 100 units -> 190 px
    const id = 'vc' + i;
    b += `<rect x="${cx - 170}" y="${cy - 150}" width="340" height="330" rx="12" fill="#fff" stroke="#ddd"/>`;
    b += `<clipPath id="${id}"><rect x="${cx - 170}" y="${cy - 150}" width="340" height="290" rx="12"/></clipPath><g clip-path="url(#${id})">`;
    const jaw = v.jaw * 100 * s;
    b += drawHead('dot', HS, cx, cy - h.mouthY * HS, { noMouth: true }).replace(/<\/g>$/, '');
    if (jaw) { // extend chin downward: redraw lower skull offset (simple jaw drop)
      const sk = tf(HEADS.dot.skull(), HS, cx, cy - h.mouthY * HS).filter(([x, y]) => y > cy + 10).map(([x, y]) => [x, y + jaw]);
      b += poly([[sk[0][0], cy + 10], ...sk, [sk.at(-1)[0], cy + 10]], pal.skin.base) + ink(sk, C.contour, { seed: 'jaw' + k });
    }
    const M = (pts) => pts.map(([x, y]) => [cx + x * s, cy + y * s]);
    const fillCol = { cavity: pal.mouthCavity.base, teeth: pal.teeth.base, tongue: pal.tongue.base, lips: pal.skin.base };
    for (const f of g0.fills) b += poly(M(f.pts), fillCol[f.role]);
    for (const L of g0.lines) b += ink(M(L), C.mouth, { seed: 'm' + k, closed: false });
    for (const L of g0.details) b += ink(M(L), C.detail, { seed: 'md' + k, col: k === 'G' || k === 'B' ? INK : pal.skin.detailLine });
    b += '</g>';
    b += T(cx - 155, cy + 165, v.label, 16, { weight: 700 }) + T(cx + 155, cy + 165, 'jaw ' + v.jaw, 14, { anchor: 'end', fill: MUTED });
    // JSON in stage units: mouth width 100 units -> 40 stage units (Dot medium shot model size)
    const k2 = 0.4, J = (pts) => 'M' + pts.map(([x, y]) => (x * k2).toFixed(2) + ' ' + (y * k2).toFixed(2)).join(' L ');
    mouthJSON[k] = { name: k, jawDropOfMouthWidth: v.jaw, children: [
      ...g0.fills.map((f) => ({ type: 'path', path: J(f.pts) + ' Z', fill: fillCol[f.role], stroke: 'none', strokeWidth: 0, line: 'none' })),
      ...g0.lines.map((L) => ({ type: 'path', path: J(L), fill: 'transparent', stroke: INK, strokeWidth: C.mouth.stage, line: 'mouth' })),
      ...g0.details.map((L) => ({ type: 'path', path: J(L), fill: 'transparent', stroke: k === 'G' || k === 'B' ? INK : pal.skin.detailLine, strokeWidth: C.detail.stage, line: 'detail' })) ] };
  });
  b += T(1520, 600, 'Mapping from the current repo variants:', 17, { weight: 700 });
  ['closed → A    teeth → B    open → C', 'wide → D      round → E', 'New: F (pucker), G (f/v), H (tongue), X (rest).', 'smirk, snarl, frown and grin stay as', 'EMOTION mouths for holds. They are', 'not visemes and never come from Rhubarb.'].forEach((r, i) => (b += T(1520, 628 + i * 26, r, 15, { fill: MUTED })));
  files['visemes-dot.svg'] = svg(1920, 1000, b);
  fs.writeFileSync('../mouth-visemes.dot.json', JSON.stringify({ note: 'Quantimation shape-tree variants for the Dot mouth group. Units are stage units (1280x720). Origin = mouth centre on the lip line. Neutral width = 40 stage units. The "line" field is the proposed line class and is discarded by the current validator until model.js allows it.', variants: Object.values(mouthJSON) }, null, 1));
}
// ================= 6. COLOUR MODEL =================
{
  let b = T(40, 50, 'Colour model: flat base, one hard shadow, highlight only where allowed', 26, { weight: 700 });
  let y = 100;
  for (const [cid, c] of Object.entries(CH)) {
    b += T(40, y + 24, c.name, 20, { weight: 700 });
    let x = 200;
    for (const [part, v] of Object.entries(c.parts)) {
      b += `<rect x="${x}" y="${y}" width="56" height="40" fill="${v.base}"/>` + (v.shadow ? `<rect x="${x + 56}" y="${y}" width="28" height="40" fill="${v.shadow}"/>` : '') + (v.highlight ? `<rect x="${x + 84}" y="${y}" width="14" height="40" fill="${v.highlight}"/>` : '');
      b += T(x, y + 58, part, 12) + T(x, y + 74, v.base, 11, { fill: MUTED }) + (v.shadow ? T(x, y + 88, v.shadow, 11, { fill: MUTED }) : '');
      x += 120;
    }
    y += 120;
  }
  b += T(40, y + 10, 'Swatch = base | shadow | highlight (only on hair, shoes, a tablet screen or metal hardware). Sclera ' + P.shared.sclera + ', ink ' + INK + '. Eyes never get a highlight.', 15, { fill: MUTED });
  y += 50;
  const scenes = Object.entries(P.scenes);
  scenes.forEach(([sid, sc], i) => {
    const ox = 40 + i * 470, oy = y;
    b += `<rect x="${ox}" y="${oy}" width="450" height="420" fill="${sc.bg.wall || sc.bg.sky || sc.bg.houses}"/>`;
    if (sc.bg.floorA || sc.bg.concrete || sc.bg.lawn) b += `<rect x="${ox}" y="${oy + 300}" width="450" height="120" fill="${sc.bg.floorA || sc.bg.concrete || sc.bg.lawn}"/>`;
    const g = sc.gradedCharacters.dot, pal = Object.fromEntries(Object.entries(g).map(([k, v]) => [k, v]));
    const rim = sc.rim ? { col: Object.values(sc.rim).find((v) => typeof v === 'string'), w: sc.rim.widthPx * 1.0, deg: 20 } : null;
    b += drawHead('dot', 200, ox + 225, oy + 60, { pal, light: sc.lightAngleDeg, rim });
    b += T(ox + 10, oy + 445, `${sid} · light from ${sc.lightAngleDeg}° · grade ${sc.characterGrade}`, 14, { weight: 700 });
    b += T(ox + 10, oy + 465, `shadow tint ${sc.shadowTint}${sc.rim ? ' · rim ' + Object.entries(sc.rim).filter(([k]) => k !== 'widthPx').map(([k, v]) => k + ' ' + v).join(', ') + ' at ' + sc.rim.widthPx + 'px' : ' · no rim'}`, 13, { fill: MUTED });
    let sx = ox + 10;
    for (const [k, v] of Object.entries(sc.bg).slice(0, 11)) { b += `<rect x="${sx}" y="${oy + 478}" width="38" height="26" fill="${v}"/><rect x="${sx}" y="${oy + 504}" width="38" height="6" fill="${sc.bgLine[k]}"/>`; sx += 40; }
  });
  b += T(40, y + 560, 'Bottom strip: background fills with their line colour beneath (local fill darkened to 55% OKLCH lightness). Angles: 0° = light from screen right, 90° = from the top, measured counter-clockwise.', 15, { fill: MUTED });
  b += T(40, y + 584, 'Shadow = part minus a copy of the part moved toward the light by 12% of its width (head) or 18–25% (limbs and neck). Hard edge, no outline. It flips with the light automatically.', 15, { fill: MUTED });
  files['colour-model.svg'] = svg(1920, y + 610, b);
}
// ================= 7. RIG PIVOTS =================
{
  let b = T(40, 50, 'Rig node list and pivot points (Dot front view, model height 4.25 HH)', 26, { weight: 700 });
  const s = 200, ox = 520, top = 110, pal = CH.dot.parts;
  const piv = [['torso', 0, 2.25, 'pelvis'], ['head', 0, 1.02, 'head pivot = base of skull at the neck'], ['hair', 0, 0.2, 'child of head, 1-2 frame overlap on turns'], ['eye_left/right', -0.142, 0.42, 'sclera centre'], ['lid_left/right', -0.142, 0.27, 'top of sclera'], ['brow_left/right', -0.142, 0.21, 'brow centre'], ['jaw > mouth', 0, 0.78, 'mouth centre, variants A–H, X'], ['left/right_upper_arm', -0.46, 1.25, 'shoulder'], ['left/right_forearm', -0.5, 1.95, 'elbow'], ['left/right_hand', -0.5, 2.6, 'wrist, variants relaxed/point/fist/spread/hold'], ['left/right_thigh', -0.14, 2.35, 'hip'], ['left/right_shin', -0.14, 3.3, 'knee'], ['left/right_foot', -0.15, 4.1, 'ankle'], ['character_root', 0, 4.25, 'feet centre (instance x,y)']];
  piv.sort((a, b) => a[2] - b[2]);
  // block figure
  const R = (x0, y0, x1, y1, col, sh) => { const pts = [[ox + x0 * s, top + y0 * s], [ox + x1 * s, top + y0 * s], [ox + x1 * s, top + y1 * s], [ox + x0 * s, top + y1 * s]]; return shaded(pts, col, sh, 135, 0.18) + ink(pts, C.contour, { closed: true, seed: 'rig' + x0 + y0 }); };
  b += R(-0.25, 2.33, -0.03, 4.1, pal.trousers.base, pal.trousers.shadow) + R(0.03, 2.33, 0.25, 4.1, pal.trousers.base, pal.trousers.shadow) + R(-0.29, 4.1, -0.02, 4.25, pal.shoes.base, pal.shoes.shadow) + R(0.02, 4.1, 0.29, 4.25, pal.shoes.base, pal.shoes.shadow);
  b += R(-0.42, 1.15, 0.42, 2.3, pal.blazer.base, pal.blazer.shadow) + R(-0.56, 1.2, -0.42, 2.0, pal.blazer.base, pal.blazer.shadow) + R(0.42, 1.2, 0.56, 2.0, pal.blazer.base, pal.blazer.shadow) + R(-0.55, 1.9, -0.44, 2.45, pal.blazer.base, pal.blazer.shadow) + R(0.44, 1.9, 0.55, 2.45, pal.blazer.base, pal.blazer.shadow) + R(-0.56, 2.45, -0.43, 2.62, pal.skin.base, pal.skin.shadow) + R(0.43, 2.45, 0.56, 2.62, pal.skin.base, pal.skin.shadow);
  b += drawHead('dot', s, ox, top);
  piv.forEach(([n, x, y, d], i) => { const px = ox + x * s, py = top + y * s; b += `<circle cx="${px}" cy="${py}" r="7" fill="${DIM}" stroke="#fff" stroke-width="2"/>`; b += line(px, py, 900, 130 + i * 50, DIM, 1, '3 3'); b += T(910, 135 + i * 50, n, 17, { weight: 700 }) + T(1150, 135 + i * 50, d, 15, { fill: MUTED }); });
  // joint overlap demo
  const jx = 1500, jy = 860; b += T(1200, 870, 'Joint rule: child overlaps parent by ≥ 0.15 limb width, with a hidden cap', 16, { weight: 700 });
  [-60, 0, 60].forEach((ang, i) => {
    const cx = 1260 + i * 220, cy = 1000, w = 30, Lg = 110, a = (ang * Math.PI) / 180;
    const up = [[cx - w / 2, cy - 110], [cx + w / 2, cy - 110], [cx + w / 2, cy + 8], [cx - w / 2, cy + 8]];
    const rot = (p) => [cx + (p[0] - cx) * Math.cos(a) - (p[1] - cy) * Math.sin(a), cy + (p[0] - cx) * Math.sin(a) + (p[1] - cy) * Math.cos(a)];
    const fo = [[cx - w / 2 + 1, cy - 4], [cx + w / 2 - 1, cy - 4], [cx + w / 2 - 1, cy + Lg], [cx - w / 2 + 1, cy + Lg]].map(rot);
    const cap = LE.ellipsePts(cx, cy, w / 2, w / 2, 30);
    b += poly(fo, pal.blazer.base) + ink(fo, C.contour, { closed: true, seed: 'fo' + i }) + poly(cap, pal.blazer.base) + poly(up, pal.blazer.base) + ink(up.slice(1, 3), C.contour, { seed: 'u1' + i }) + ink([up[3], up[0]], C.contour, { seed: 'u2' + i }) + ink([up[0], up[1]], C.contour, { seed: 'u3' + i });
    b += `<circle cx="${cx}" cy="${cy}" r="4" fill="${DIM}"/>` + T(cx, cy + 135, ang + '°', 14, { anchor: 'middle' });
  });
  b += T(40, 1110, 'Draw order, back to front: far arm > far leg > torso > near leg > head (hair back, skull, eyes, lids, brows, nose, mouth, fringe) > near arm. Flipping mirrors the whole tree.', 15, { fill: MUTED });
  files['rig-pivots-dot.svg'] = svg(1920, 1150, b);
}
// ================= 8. TIMING CHARTS =================
{
  let b = T(40, 50, 'Timing at 24 fps. Each cell is one frame, and a filled cell is a new drawing.', 26, { weight: 700 });
  const cw = 34, x0 = 300;
  const row = (y, label, cells, sub) => {
    let g = T(40, y + 22, label, 17, { weight: 700 }) + (sub ? T(40, y + 42, sub, 13, { fill: MUTED }) : '');
    cells.forEach((c, i) => { g += `<rect x="${x0 + i * cw}" y="${y}" width="${cw - 2}" height="34" fill="${c ? c.col || '#3C6E9E' : '#fff'}" stroke="#ccc"/>`; if (c && c.t) g += T(x0 + i * cw + cw / 2 - 1, y + 22, c.t, 11, { anchor: 'middle', fill: '#fff', weight: 700 }); });
    return g;
  };
  for (let i = 0; i < 48; i++) b += T(x0 + i * cw + cw / 2, 92, String(i + 1), 10, { anchor: 'middle', fill: MUTED });
  const twos = Array.from({ length: 48 }, (_, i) => (i % 2 ? null : { t: '' }));
  b += row(100, 'Character on 2s', twos, 'pose sampled at floor(t*12)/12');
  b += row(150, 'Camera pan on 1s', Array.from({ length: 48 }, () => ({ col: '#7FA06E' })), 'camera always uses the true time t');
  const pt = []; const seq = [['K1', 8, '#555'], ['a', 2], ['a', 2], ['a', 2], ['b', 2, '#C0504D'], ['x', 2, '#C0504D'], ['o', 2, '#D58A3A'], ['o', 2, '#D58A3A'], ['s', 2], ['s', 2], ['K2', 18, '#555']];
  for (const [t, n, col] of seq) for (let i = 0; i < n; i++) pt.push(t.startsWith('K') ? (i === 0 ? { t, col } : { col: '#DAD6CE' }) : i % 2 === 0 ? { t: i === 0 ? t : '', col } : null);
  b += row(220, 'Point gesture', pt.slice(0, 48), 'grey = held drawing. K1 hold 8, anticipation 6, accent and smear 4, overshoot 4, settle 4, K2 hold 18');
  const blink = Array(48).fill(null); [[10, 'h', '#888'], [11, 'c', '#333'], [12, 'c', '#333'], [13, 'h', '#888'], [14, 'h', '#888']].forEach(([f, t, col]) => (blink[f] = { t, col }));
  b += row(290, 'Blink (5 frames, on 1s)', blink, 'half 1, closed 2, half 2 (opening is slower). Then back on 2s.');
  const turn = Array(48).fill(null); [[0, 'F'], [2, 'F'], [4, 'F'], [6, 'ib'], [8, '¾'], [10, 'ib'], [12, 'P']].forEach(([f, t]) => (turn[f] = { t, col: '#6A4E8E' })); turn[4] = { t: 'eye', col: '#C0504D' };
  b += row(360, 'Head turn front to profile', turn, 'eyes lead by 2 frames, then F, ib, ¾, ib, P on 2s; hair follows 2 frames late');
  // lip-sync quantization
  const raw = 'X X A A A B C C D D D D D C B B F F F F E E A A B G G G C C C H H C C B X X X X X X X X X X X X'.split(' ');
  const cols = { A: '#333', B: '#7A6A9E', C: '#3C6E9E', D: '#1F4C7A', E: '#4E8E8A', F: '#C0504D', G: '#D58A3A', H: '#8E6A3A', X: '#BBB' };
  const rawCells = raw.map((v) => ({ t: v, col: cols[v] }));
  b += row(450, 'Rhubarb cues (24 fps)', rawCells, 'raw output, quantized to frames');
  // apply rule: min 2 frames, keep A
  const q = [...raw]; const runs = []; let s0 = 0; for (let i = 1; i <= q.length; i++) if (i === q.length || q[i] !== q[s0]) { runs.push([q[s0], s0, i - s0]); s0 = i; }
  const out = []; runs.forEach(([v, st, n], i) => { if (n >= 2 || v === 'A') { for (let k = 0; k < Math.max(n, 2); k++) out.push(v); } else { out.push(out.at(-1) || v); } });
  b += row(510, 'After the min-2 rule', out.slice(0, 48).map((v) => ({ t: v, col: cols[v] })), 'single-frame visemes merge into the previous one. A (M/B/P) is never dropped. Shift the mouth 1 frame earlier than the audio.');
  b += T(40, 600, 'Holds: minimum 6 frames to read any pose, 12–24 frames for an acting key, 24–72 frames for a listening hold (with a blink plus 2–4 px of drift).', 16);
  b += T(40, 626, 'Anticipation 3–8 frames at 10–20% of the action in reverse. Overshoot 2–4 frames at 8–15% past, then settle over 4–6 frames. Smear or multiples: 1–2 frames, only when the move is over 120 px in 3 frames or fewer.', 16);
  b += T(40, 652, 'Stagger: no two characters start a move on the same frame (at least 4 frames apart). Within a body: head 0, torso +2, arms +4, hand settle +6.', 16);
  files['timing-charts.svg'] = svg(1960, 690, b);
}
for (const [n, s] of Object.entries(files)) fs.writeFileSync(OUT + n, s);
console.log(Object.keys(files).join('\n'));
