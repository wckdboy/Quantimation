// Variable-width outlines. Open strokes taper to a point; closed silhouettes
// keep a pressure-like swell so the join does not pinch.

export function shadeHex(hex, amount) {
  const raw = String(hex || "").replace("#", "");
  const full =
    raw.length === 3
      ? raw
          .split("")
          .map((c) => c + c)
          .join("")
      : raw.slice(0, 6);
  if (!/^[0-9a-fA-F]{6}$/.test(full)) return hex;
  const target = amount < 0 ? 0 : 255;
  const u = Math.min(1, Math.abs(amount));
  const ch = (i) => {
    const c = parseInt(full.slice(i, i + 2), 16);
    return Math.max(0, Math.min(255, Math.round(c + (target - c) * u)));
  };
  const hex2 = (n) => n.toString(16).padStart(2, "0");
  return `#${hex2(ch(0))}${hex2(ch(2))}${hex2(ch(4))}`;
}

export function pressureWidth(u, base, { closed = false } = {}) {
  const t = Math.max(0, Math.min(1, u));
  if (closed) {
    const swell = 0.5 + 0.5 * Math.sin(t * Math.PI * 2 + 0.7);
    return base * (0.78 + 0.34 * swell);
  }
  const tip = Math.sin(Math.PI * t);
  return base * (0.04 + 0.96 * Math.pow(tip, 0.62));
}

function hash(n) {
  const x = Math.sin(n * 127.1 + 311.7) * 43758.5453;
  return x - Math.floor(x);
}

// Line boil holds for two film frames so the wobble reads as drawn, not noisy.
export function boilPoints(points, frame, salt = 0, amount = 0.7) {
  const held = Math.floor(frame / 2);
  return points.map((p, i) => {
    const a = hash(held * 13.1 + salt * 0.17 + i * 1.7) * Math.PI * 2;
    const m = amount * (0.55 + 0.45 * hash(i * 3.1 + salt));
    return { x: p.x + Math.cos(a) * m, y: p.y + Math.sin(a) * m };
  });
}

export function ribbonPolygon(points, widthAt, closed = false) {
  const n = points.length;
  if (n < 2) return [];
  const left = [];
  const right = [];
  for (let i = 0; i < n; i++) {
    const prev = points[closed ? (i - 1 + n) % n : Math.max(0, i - 1)];
    const next = points[closed ? (i + 1) % n : Math.min(n - 1, i + 1)];
    const ax = points[i].x - prev.x;
    const ay = points[i].y - prev.y;
    const bx = next.x - points[i].x;
    const by = next.y - points[i].y;
    const al = Math.hypot(ax, ay) || 1;
    const bl = Math.hypot(bx, by) || 1;
    let nx = -ay / al + -by / bl;
    let ny = ax / al + bx / bl;
    const nl = Math.hypot(nx, ny) || 1;
    nx /= nl;
    ny /= nl;
    const refx = -ay / al;
    const refy = ax / al;
    const dot = Math.max(0.45, Math.min(1, nx * refx + ny * refy));
    const miter = Math.min(1.8, 1 / dot);
    const u = closed ? i / n : n === 1 ? 0 : i / (n - 1);
    const w = Math.max(0, widthAt(u)) * 0.5 * miter;
    left.push({ x: points[i].x + nx * w, y: points[i].y + ny * w });
    right.push({ x: points[i].x - nx * w, y: points[i].y - ny * w });
  }
  return left.concat(right.reverse());
}

function curveSteps(length, spacing) {
  return Math.max(2, Math.ceil(length / spacing));
}

function pushCurve(points, at, steps) {
  for (let s = 1; s <= steps; s++) points.push(at(s / steps));
}

function sampleArc(x0, y0, rx, ry, phiDeg, large, sweep, x, y, spacing) {
  const phi = (phiDeg * Math.PI) / 180;
  const sinPhi = Math.sin(phi);
  const cosPhi = Math.cos(phi);
  const dx = (x0 - x) / 2;
  const dy = (y0 - y) / 2;
  const x1p = cosPhi * dx + sinPhi * dy;
  const y1p = -sinPhi * dx + cosPhi * dy;
  let arx = Math.abs(rx);
  let ary = Math.abs(ry);
  if (arx < 1e-6 || ary < 1e-6) return [{ x, y }];
  let rx2 = arx * arx;
  let ry2 = ary * ary;
  const lam = (x1p * x1p) / rx2 + (y1p * y1p) / ry2;
  if (lam > 1) {
    const scale = Math.sqrt(lam);
    arx *= scale;
    ary *= scale;
    rx2 = arx * arx;
    ry2 = ary * ary;
  }
  const sign = large === sweep ? -1 : 1;
  const num = Math.max(0, rx2 * ry2 - rx2 * y1p * y1p - ry2 * x1p * x1p);
  const den = rx2 * y1p * y1p + ry2 * x1p * x1p || 1;
  const coef = sign * Math.sqrt(num / den);
  const cxp = (coef * arx * y1p) / ary;
  const cyp = (coef * -ary * x1p) / arx;
  const centerX = cosPhi * cxp - sinPhi * cyp + (x0 + x) / 2;
  const centerY = sinPhi * cxp + cosPhi * cyp + (y0 + y) / 2;
  const angle = (ux, uy, vx, vy) => {
    const dot = ux * vx + uy * vy;
    const len = Math.hypot(ux, uy) * Math.hypot(vx, vy) || 1;
    let a = Math.acos(Math.max(-1, Math.min(1, dot / len)));
    if (ux * vy - uy * vx < 0) a = -a;
    return a;
  };
  const theta1 = angle(1, 0, (x1p - cxp) / arx, (y1p - cyp) / ary);
  let delta = angle(
    (x1p - cxp) / arx,
    (y1p - cyp) / ary,
    (-x1p - cxp) / arx,
    (-y1p - cyp) / ary,
  );
  if (!sweep && delta > 0) delta -= Math.PI * 2;
  if (sweep && delta < 0) delta += Math.PI * 2;
  const len = Math.hypot(x - x0, y - y0) + Math.abs(delta) * Math.max(arx, ary);
  const steps = curveSteps(len, spacing);
  const points = [];
  for (let i = 1; i <= steps; i++) {
    const t = theta1 + delta * (i / steps);
    const px = Math.cos(t) * arx;
    const py = Math.sin(t) * ary;
    points.push({
      x: cosPhi * px - sinPhi * py + centerX,
      y: sinPhi * px + cosPhi * py + centerY,
    });
  }
  return points;
}

export function sampleSvgPath(d, spacing = 8) {
  const tokens = String(d || "").match(
    /[MmLlHhVvCcSsQqTtAaZz]|[-+]?(?:\d*\.\d+|\d+)(?:[eE][-+]?\d+)?/g,
  );
  if (!tokens) return [];
  const subs = [];
  let i = 0;
  let cx = 0;
  let cy = 0;
  let sx = 0;
  let sy = 0;
  let lastCx = 0;
  let lastCy = 0;
  let lastQx = 0;
  let lastQy = 0;
  let prevOp = "";
  let cur = null;
  const isCmd = (v) => /^[A-Za-z]$/.test(v || "");
  const num = () => parseFloat(tokens[i++]);
  const start = (x, y) => {
    if (cur?.points.length) subs.push(cur);
    cur = { points: [{ x, y }], closed: false };
    cx = sx = x;
    cy = sy = y;
  };
  while (i < tokens.length) {
    const cmd = tokens[i++];
    if (!isCmd(cmd)) break;
    const rel = cmd === cmd.toLowerCase();
    const op = cmd.toUpperCase();
    if (op === "M") {
      let x = num() + (rel ? cx : 0);
      let y = num() + (rel ? cy : 0);
      start(x, y);
      while (i < tokens.length && !isCmd(tokens[i])) {
        x = num() + (rel ? cx : 0);
        y = num() + (rel ? cy : 0);
        cur.points.push({ x, y });
        cx = x;
        cy = y;
      }
      prevOp = "M";
    } else if (op === "L") {
      while (i < tokens.length && !isCmd(tokens[i])) {
        const x = num() + (rel ? cx : 0);
        const y = num() + (rel ? cy : 0);
        cur?.points.push({ x, y });
        cx = x;
        cy = y;
      }
      prevOp = "L";
    } else if (op === "H") {
      while (i < tokens.length && !isCmd(tokens[i])) {
        cx = num() + (rel ? cx : 0);
        cur?.points.push({ x: cx, y: cy });
      }
      prevOp = "L";
    } else if (op === "V") {
      while (i < tokens.length && !isCmd(tokens[i])) {
        cy = num() + (rel ? cy : 0);
        cur?.points.push({ x: cx, y: cy });
      }
      prevOp = "L";
    } else if (op === "Q") {
      while (i < tokens.length && !isCmd(tokens[i])) {
        const x1 = num() + (rel ? cx : 0);
        const y1 = num() + (rel ? cy : 0);
        const x = num() + (rel ? cx : 0);
        const y = num() + (rel ? cy : 0);
        const p0x = cx;
        const p0y = cy;
        const len = Math.hypot(x1 - p0x, y1 - p0y) + Math.hypot(x - x1, y - y1);
        pushCurve(
          cur.points,
          (u) => ({
            x:
              (1 - u) * (1 - u) * p0x +
              2 * (1 - u) * u * x1 +
              u * u * x,
            y:
              (1 - u) * (1 - u) * p0y +
              2 * (1 - u) * u * y1 +
              u * u * y,
          }),
          curveSteps(len, spacing),
        );
        lastQx = x1;
        lastQy = y1;
        cx = x;
        cy = y;
        prevOp = "Q";
      }
    } else if (op === "C") {
      while (i < tokens.length && !isCmd(tokens[i])) {
        const x1 = num() + (rel ? cx : 0);
        const y1 = num() + (rel ? cy : 0);
        const x2 = num() + (rel ? cx : 0);
        const y2 = num() + (rel ? cy : 0);
        const x = num() + (rel ? cx : 0);
        const y = num() + (rel ? cy : 0);
        const p0x = cx;
        const p0y = cy;
        const len =
          Math.hypot(x1 - p0x, y1 - p0y) +
          Math.hypot(x2 - x1, y2 - y1) +
          Math.hypot(x - x2, y - y2);
        pushCurve(
          cur.points,
          (u) => {
            const v = 1 - u;
            return {
              x:
                v * v * v * p0x +
                3 * v * v * u * x1 +
                3 * v * u * u * x2 +
                u * u * u * x,
              y:
                v * v * v * p0y +
                3 * v * v * u * y1 +
                3 * v * u * u * y2 +
                u * u * u * y,
            };
          },
          curveSteps(len, spacing),
        );
        lastCx = x2;
        lastCy = y2;
        cx = x;
        cy = y;
        prevOp = "C";
      }
    } else if (op === "S" || op === "T") {
      while (i < tokens.length && !isCmd(tokens[i])) {
        const smooth = op === "S" ? prevOp === "C" : prevOp === "Q";
        const rx = smooth ? (op === "S" ? 2 * cx - lastCx : 2 * cx - lastQx) : cx;
        const ry = smooth ? (op === "S" ? 2 * cy - lastCy : 2 * cy - lastQy) : cy;
        if (op === "T") {
          const x = num() + (rel ? cx : 0);
          const y = num() + (rel ? cy : 0);
          const p0x = cx;
          const p0y = cy;
          const len = Math.hypot(rx - p0x, ry - p0y) + Math.hypot(x - rx, y - ry);
          pushCurve(
            cur.points,
            (u) => ({
              x: (1 - u) * (1 - u) * p0x + 2 * (1 - u) * u * rx + u * u * x,
              y: (1 - u) * (1 - u) * p0y + 2 * (1 - u) * u * ry + u * u * y,
            }),
            curveSteps(len, spacing),
          );
          lastQx = rx;
          lastQy = ry;
          cx = x;
          cy = y;
          prevOp = "Q";
        } else {
          const x2 = num() + (rel ? cx : 0);
          const y2 = num() + (rel ? cy : 0);
          const x = num() + (rel ? cx : 0);
          const y = num() + (rel ? cy : 0);
          const p0x = cx;
          const p0y = cy;
          const len =
            Math.hypot(rx - p0x, ry - p0y) +
            Math.hypot(x2 - rx, y2 - ry) +
            Math.hypot(x - x2, y - y2);
          pushCurve(
            cur.points,
            (u) => {
              const v = 1 - u;
              return {
                x: v * v * v * p0x + 3 * v * v * u * rx + 3 * v * u * u * x2 + u * u * u * x,
                y: v * v * v * p0y + 3 * v * v * u * ry + 3 * v * u * u * y2 + u * u * u * y,
              };
            },
            curveSteps(len, spacing),
          );
          lastCx = x2;
          lastCy = y2;
          cx = x;
          cy = y;
          prevOp = "C";
        }
      }
    } else if (op === "A") {
      while (i < tokens.length && !isCmd(tokens[i])) {
        const rx = num();
        const ry = num();
        const rot = num();
        const large = num();
        const sweep = num();
        const x = num() + (rel ? cx : 0);
        const y = num() + (rel ? cy : 0);
        for (const point of sampleArc(cx, cy, rx, ry, rot, large !== 0, sweep !== 0, x, y, spacing))
          cur?.points.push(point);
        cx = x;
        cy = y;
        prevOp = "A";
      }
    } else if (op === "Z") {
      if (cur) {
        cur.closed = true;
        cx = sx;
        cy = sy;
      }
      prevOp = "Z";
    } else {
      while (i < tokens.length && !isCmd(tokens[i])) i++;
      prevOp = op;
    }
  }
  if (cur?.points.length) subs.push(cur);
  return subs.filter((s) => s.points.length >= 2 || s.closed);
}

export function boundsOf(subs) {
  let minX = Infinity;
  let minY = Infinity;
  let maxX = -Infinity;
  let maxY = -Infinity;
  for (const sub of subs)
    for (const p of sub.points) {
      minX = Math.min(minX, p.x);
      minY = Math.min(minY, p.y);
      maxX = Math.max(maxX, p.x);
      maxY = Math.max(maxY, p.y);
    }
  if (!Number.isFinite(minX)) return { x: 0, y: 0, w: 1, h: 1 };
  return { x: minX, y: minY, w: Math.max(1, maxX - minX), h: Math.max(1, maxY - minY) };
}

export function sampleShape(shape, frame = 0) {
  const boil = shape.strokeWidth === 0 ? 0 : 0.65;
  const salt = (shape.x || 0) * 4 + (shape.y || 0) + (shape.path?.length || 0);
  const finish = (subs) =>
    subs.map((sub) => ({
      closed: sub.closed,
      points: boil ? boilPoints(sub.points, frame, salt, boil) : sub.points,
    }));
  if (shape.type === "ellipse") {
    const rx = shape.rx ?? shape.radius ?? 10;
    const ry = shape.ry ?? shape.radius ?? 10;
    const x = shape.x || 0;
    const y = shape.y || 0;
    const points = [];
    const n = 40;
    for (let i = 0; i < n; i++) {
      const a = (i / n) * Math.PI * 2;
      const wobble = 1 + 0.012 * Math.sin(a * 5 + (shape.x || 0) * 0.05);
      points.push({
        x: x + Math.cos(a) * rx * wobble,
        y: y + Math.sin(a) * ry * wobble,
      });
    }
    return finish([{ points, closed: true }]);
  }
  if (shape.type === "rect") {
    const x = shape.x || 0;
    const y = shape.y || 0;
    const w = shape.width || 1;
    const h = shape.height || 1;
    const edge = (ax, ay, bx, by) => {
      const steps = Math.max(2, Math.ceil(Math.hypot(bx - ax, by - ay) / 16));
      const pts = [];
      for (let i = 0; i < steps; i++) {
        const u = i / steps;
        const k = Math.sin(u * Math.PI) * 1.15;
        const dx = bx - ax;
        const dy = by - ay;
        const len = Math.hypot(dx, dy) || 1;
        pts.push({
          x: ax + dx * u + (-dy / len) * k,
          y: ay + dy * u + (dx / len) * k,
        });
      }
      return pts;
    };
    return finish([
      {
        closed: true,
        points: [
          ...edge(x, y, x + w, y),
          ...edge(x + w, y, x + w, y + h),
          ...edge(x + w, y + h, x, y + h),
          ...edge(x, y + h, x, y),
        ],
      },
    ]);
  }
  if (shape.type === "line") {
    return finish([
      {
        closed: false,
        points: [
          { x: shape.x || 0, y: shape.y || 0 },
          { x: shape.x2 || 0, y: shape.y2 || 0 },
        ],
      },
    ]);
  }
  if (shape.type === "polygon") {
    return finish([
      {
        closed: true,
        points: (shape.points || []).map(([x, y]) => ({ x, y })),
      },
    ]);
  }
  if (shape.type === "path") return finish(sampleSvgPath(shape.path));
  return [];
}
