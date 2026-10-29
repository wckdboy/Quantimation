function srgbToLinear(c) {
  const u = c / 255;
  return u <= 0.04045 ? u / 12.92 : ((u + 0.055) / 1.055) ** 2.4;
}

export function labL(r, g, b) {
  const R = srgbToLinear(r);
  const G = srgbToLinear(g);
  const B = srgbToLinear(b);
  const y = 0.2126 * R + 0.7152 * G + 0.0722 * B;
  const f = (t) => (t > 0.008856 ? Math.cbrt(t) : 7.787 * t + 16 / 116);
  return 116 * f(y) - 16;
}

export function separation(image, width, height, character) {
  let charN = 0;
  let charL = 0;
  let minX = width;
  let minY = height;
  let maxX = 0;
  let maxY = 0;
  const data = image.data;
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const i = (y * width + x) * 4;
      if (!character(data[i], data[i + 1], data[i + 2], x, y)) continue;
      charN++;
      charL += labL(data[i], data[i + 1], data[i + 2]);
      minX = Math.min(minX, x);
      minY = Math.min(minY, y);
      maxX = Math.max(maxX, x);
      maxY = Math.max(maxY, y);
    }
  }
  if (!charN) return { charN: 0, delta: 0 };
  const growX = (maxX - minX) * 0.5;
  const growY = (maxY - minY) * 0.5;
  const x0 = Math.max(0, Math.floor(minX - growX));
  const y0 = Math.max(0, Math.floor(minY - growY));
  const x1 = Math.min(width - 1, Math.ceil(maxX + growX));
  const y1 = Math.min(height - 1, Math.ceil(maxY + growY));
  let bgN = 0;
  let bgL = 0;
  for (let y = y0; y <= y1; y++) {
    for (let x = x0; x <= x1; x++) {
      const i = (y * width + x) * 4;
      if (character(data[i], data[i + 1], data[i + 2], x, y)) continue;
      bgN++;
      bgL += labL(data[i], data[i + 1], data[i + 2]);
    }
  }
  return {
    charN,
    bgN,
    charL: charL / charN,
    bgL: bgN ? bgL / bgN : 0,
    delta: bgN ? Math.abs(bgL / bgN - charL / charN) : 0,
  };
}

export function horizontalRun(image, width, height, x, y, match) {
  const data = image.data;
  let left = x;
  let right = x;
  while (left > 0 && match(data[(y * width + left - 1) * 4], data[(y * width + left - 1) * 4 + 1], data[(y * width + left - 1) * 4 + 2]))
    left--;
  while (right < width - 1 && match(data[(y * width + right + 1) * 4], data[(y * width + right + 1) * 4 + 1], data[(y * width + right + 1) * 4 + 2]))
    right++;
  return right - left + 1;
}

export function lineRunHistogram(image, width, height, match, axis = "horizontal") {
  const counts = new Map();
  const data = image.data;
  const seen = new Uint8Array(width * height);
  for (let y = 0; y < height; y += 2) {
    for (let x = 0; x < width; x += 2) {
      const index = y * width + x;
      if (seen[index]) continue;
      const i = index * 4;
      if (!match(data[i], data[i + 1], data[i + 2], x, y)) continue;
      let length = 0;
      if (axis === "horizontal") {
        let left = x;
        let right = x;
        while (left > 0 && match(data[(y * width + left - 1) * 4], data[(y * width + left - 1) * 4 + 1], data[(y * width + left - 1) * 4 + 2])) {
          left--;
          seen[y * width + left] = 1;
        }
        while (right < width - 1 && match(data[(y * width + right + 1) * 4], data[(y * width + right + 1) * 4 + 1], data[(y * width + right + 1) * 4 + 2])) {
          right++;
          seen[y * width + right] = 1;
        }
        length = right - left + 1;
      } else {
        let top = y;
        let bot = y;
        while (top > 0 && match(data[((top - 1) * width + x) * 4], data[((top - 1) * width + x) * 4 + 1], data[((top - 1) * width + x) * 4 + 2])) {
          top--;
          seen[top * width + x] = 1;
        }
        while (bot < height - 1 && match(data[((bot + 1) * width + x) * 4], data[((bot + 1) * width + x) * 4 + 1], data[((bot + 1) * width + x) * 4 + 2])) {
          bot++;
          seen[bot * width + x] = 1;
        }
        length = bot - top + 1;
      }
      if (length >= 2 && length <= 8) counts.set(length, (counts.get(length) || 0) + 1);
    }
  }
  const rows = [...counts.entries()].sort((a, b) => a[0] - b[0]);
  const total = rows.reduce((sum, [, n]) => sum + n, 0);
  let acc = 0;
  let median = 0;
  for (const [widthPx, n] of rows) {
    acc += n;
    if (acc >= total / 2) {
      median = widthPx;
      break;
    }
  }
  return { rows, total, median };
}

export function verticalInk(image, width, height, x, y, match) {
  const data = image.data;
  let top = y;
  let bot = y;
  while (top > 0 && match(data[((top - 1) * width + x) * 4], data[((top - 1) * width + x) * 4 + 1], data[((top - 1) * width + x) * 4 + 2]))
    top--;
  while (bot < height - 1 && match(data[((bot + 1) * width + x) * 4], data[((bot + 1) * width + x) * 4 + 1], data[((bot + 1) * width + x) * 4 + 2]))
    bot++;
  return bot - top + 1;
}
