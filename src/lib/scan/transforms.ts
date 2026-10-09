import type { Rgb } from '../render/color';
import type { Pixels } from '../render/outputs';
import type { Rect } from '../render/plan';

// Every transform returns new pixels and leaves its input untouched, so one rendered
// image can feed all the stress conditions.

function blank(width: number, height: number): Pixels {
  return { data: new Uint8ClampedArray(width * height * 4), width, height };
}

// Copies field by field: a canvas ImageData keeps width and height as prototype getters,
// so spreading one would silently lose them.
function copyPixels(src: Pixels): Pixels {
  return { data: src.data.slice(), width: src.width, height: src.height };
}

function clampIndex(value: number, max: number): number {
  return value < 0 ? 0 : value > max ? max : value;
}

function blurPass(src: Pixels, radius: number, horizontal: boolean): Pixels {
  const { width, height, data } = src;
  const out = blank(width, height);
  const window = 2 * radius + 1;
  const lineLength = horizontal ? width : height;
  const lines = horizontal ? height : width;

  for (let line = 0; line < lines; line++) {
    const indexAt = (position: number) => {
      const p = clampIndex(position, lineLength - 1);
      return (horizontal ? line * width + p : p * width + line) * 4;
    };
    for (let channel = 0; channel < 4; channel++) {
      // Running sum: add the pixel entering the window, drop the one leaving it.
      let sum = 0;
      for (let k = -radius; k <= radius; k++) sum += data[indexAt(k) + channel] ?? 0;
      for (let position = 0; position < lineLength; position++) {
        out.data[indexAt(position) + channel] = sum / window;
        sum +=
          (data[indexAt(position + radius + 1) + channel] ?? 0) -
          (data[indexAt(position - radius) + channel] ?? 0);
      }
    }
  }
  return out;
}

export function boxBlur(src: Pixels, radius: number): Pixels {
  const r = Math.max(0, Math.round(radius));
  if (r === 0) return copyPixels(src);
  return blurPass(blurPass(src, r, true), r, false);
}

function sampleBilinear(src: Pixels, x: number, y: number, channel: number): number {
  const x0 = clampIndex(Math.floor(x), src.width - 1);
  const y0 = clampIndex(Math.floor(y), src.height - 1);
  const x1 = Math.min(x0 + 1, src.width - 1);
  const y1 = Math.min(y0 + 1, src.height - 1);
  const fx = clampIndex(x - x0, 1);
  const fy = clampIndex(y - y0, 1);
  const at = (px: number, py: number) => src.data[(py * src.width + px) * 4 + channel] ?? 0;
  const top = at(x0, y0) * (1 - fx) + at(x1, y0) * fx;
  const bottom = at(x0, y1) * (1 - fx) + at(x1, y1) * fx;
  return top * (1 - fy) + bottom * fy;
}

export function downscaleByAveraging(src: Pixels, width: number, height: number): Pixels {
  const out = blank(width, height);
  const scaleX = src.width / width;
  const scaleY = src.height / height;

  for (let y = 0; y < height; y++) {
    const yStart = Math.floor(y * scaleY);
    const yEnd = Math.max(yStart + 1, Math.floor((y + 1) * scaleY));
    for (let x = 0; x < width; x++) {
      const xStart = Math.floor(x * scaleX);
      const xEnd = Math.max(xStart + 1, Math.floor((x + 1) * scaleX));
      const count = (yEnd - yStart) * (xEnd - xStart);
      for (let channel = 0; channel < 4; channel++) {
        let sum = 0;
        for (let sy = yStart; sy < yEnd; sy++) {
          for (let sx = xStart; sx < xEnd; sx++)
            sum += src.data[(sy * src.width + sx) * 4 + channel] ?? 0;
        }
        out.data[(y * width + x) * 4 + channel] = sum / count;
      }
    }
  }
  return out;
}

export function crop(src: Pixels, x: number, y: number, width: number, height: number): Pixels {
  const out = blank(width, height);
  for (let row = 0; row < height; row++) {
    const start = ((y + row) * src.width + x) * 4;
    out.data.set(src.data.subarray(start, start + width * 4), row * width * 4);
  }
  return out;
}

// Averages each factor×factor block into one pixel; edge blocks average what they contain.
export function downscaleByFactor(src: Pixels, factor: number): Pixels {
  const k = Math.max(1, Math.floor(factor));
  if (k === 1) return copyPixels(src);
  const width = Math.ceil(src.width / k);
  const height = Math.ceil(src.height / k);
  const out = blank(width, height);

  for (let y = 0; y < height; y++) {
    const yEnd = Math.min(src.height, (y + 1) * k);
    for (let x = 0; x < width; x++) {
      const xEnd = Math.min(src.width, (x + 1) * k);
      const count = (yEnd - y * k) * (xEnd - x * k);
      for (let channel = 0; channel < 4; channel++) {
        let sum = 0;
        for (let sy = y * k; sy < yEnd; sy++) {
          for (let sx = x * k; sx < xEnd; sx++)
            sum += src.data[(sy * src.width + sx) * 4 + channel] ?? 0;
        }
        out.data[(y * width + x) * 4 + channel] = sum / count;
      }
    }
  }
  return out;
}

function upscaleBilinear(src: Pixels, width: number, height: number): Pixels {
  const out = blank(width, height);
  const scaleX = src.width / width;
  const scaleY = src.height / height;
  for (let y = 0; y < height; y++) {
    // Sample at pixel centres so the image doesn't drift by half a pixel.
    const sy = (y + 0.5) * scaleY - 0.5;
    for (let x = 0; x < width; x++) {
      const sx = (x + 0.5) * scaleX - 0.5;
      for (let channel = 0; channel < 4; channel++) {
        out.data[(y * width + x) * 4 + channel] = sampleBilinear(src, sx, sy, channel);
      }
    }
  }
  return out;
}

// Mimics a small print or a distant camera: detail finer than the reduced resolution is lost.
export function downscaleAndRestore(src: Pixels, scale: number): Pixels {
  if (scale >= 1) return copyPixels(src);
  const width = Math.max(1, Math.round(src.width * scale));
  const height = Math.max(1, Math.round(src.height * scale));
  return upscaleBilinear(downscaleByAveraging(src, width, height), src.width, src.height);
}

// Small deterministic PRNG so "random" sensor noise is identical on every run and in tests.
function seededRandom(seed: number): () => number {
  let state = seed >>> 0;
  return () => {
    state = (state + 0x6d2b79f5) >>> 0;
    let t = state;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export interface LowLightOptions {
  contrast: number;
  brightness: number;
  noise: number;
  seed?: number;
}

export function lowLight(
  src: Pixels,
  { contrast, brightness, noise, seed = 1 }: LowLightOptions,
): Pixels {
  const out = blank(src.width, src.height);
  const random = seededRandom(seed);
  for (let i = 0; i < src.data.length; i += 4) {
    const grain = (random() * 2 - 1) * noise;
    for (let channel = 0; channel < 3; channel++) {
      const value = src.data[i + channel] ?? 0;
      out.data[i + channel] = (128 + (value - 128) * contrast) * brightness + grain;
    }
    out.data[i + 3] = src.data[i + 3] ?? 255;
  }
  return out;
}

export function rotate(src: Pixels, degrees: number, fill: Rgb): Pixels {
  const out = blank(src.width, src.height);
  const radians = (degrees * Math.PI) / 180;
  const cos = Math.cos(radians);
  const sin = Math.sin(radians);
  const cx = (src.width - 1) / 2;
  const cy = (src.height - 1) / 2;
  const fillChannels = [fill.r, fill.g, fill.b, 255];

  for (let y = 0; y < src.height; y++) {
    for (let x = 0; x < src.width; x++) {
      // Inverse mapping: find where each output pixel came from in the source.
      const sx = cos * (x - cx) + sin * (y - cy) + cx;
      const sy = -sin * (x - cx) + cos * (y - cy) + cy;
      const i = (y * src.width + x) * 4;
      const inside = sx >= 0 && sy >= 0 && sx <= src.width - 1 && sy <= src.height - 1;
      for (let channel = 0; channel < 4; channel++) {
        out.data[i + channel] = inside
          ? sampleBilinear(src, sx, sy, channel)
          : (fillChannels[channel] ?? 255);
      }
    }
  }
  return out;
}

export function coverRect(src: Pixels, rect: Rect, fill: Rgb): Pixels {
  const out = copyPixels(src);
  const xEnd = Math.min(src.width, rect.x + rect.width);
  const yEnd = Math.min(src.height, rect.y + rect.height);
  for (let y = Math.max(0, rect.y); y < yEnd; y++) {
    for (let x = Math.max(0, rect.x); x < xEnd; x++) {
      const i = (y * src.width + x) * 4;
      out.data[i] = fill.r;
      out.data[i + 1] = fill.g;
      out.data[i + 2] = fill.b;
      out.data[i + 3] = 255;
    }
  }
  return out;
}
