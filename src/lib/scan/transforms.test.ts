import type { Pixels } from '../render/outputs';
import {
  boxBlur,
  coverRect,
  crop,
  downscaleAndRestore,
  downscaleByFactor,
  lowLight,
  rotate,
} from './transforms';

const WHITE = { r: 255, g: 255, b: 255 };

// Builds a grey image from rows of values; RGB channels share the value, alpha is opaque.
function grey(rows: number[][]): Pixels {
  const height = rows.length;
  const width = rows[0]?.length ?? 0;
  const data = new Uint8ClampedArray(width * height * 4);
  rows.forEach((row, y) =>
    row.forEach((value, x) => {
      data.set([value, value, value, 255], (y * width + x) * 4);
    }),
  );
  return { data, width, height };
}

function values(pixels: Pixels): number[][] {
  return Array.from({ length: pixels.height }, (_, y) =>
    Array.from({ length: pixels.width }, (_, x) => pixels.data[(y * pixels.width + x) * 4] ?? -1),
  );
}

function solid(width: number, height: number, value: number): Pixels {
  return grey(Array.from({ length: height }, () => Array<number>(width).fill(value)));
}

describe('boxBlur', () => {
  it('spreads a bright pixel evenly over its 3×3 neighbourhood', () => {
    const src = solid(5, 5, 0);
    src.data.set([255, 255, 255], (2 * 5 + 2) * 4);
    const out = values(boxBlur(src, 1));
    expect(out[2]?.[2]).toBe(28); // 255 / 9, rounded by the clamped array
    expect(out[1]?.[1]).toBe(28);
    expect(out[0]?.[0]).toBe(0);
    expect(out.flat().reduce((sum, value) => sum + value, 0)).toBe(28 * 9);
  });

  it('leaves flat areas unchanged and keeps alpha opaque', () => {
    const out = boxBlur(solid(6, 4, 200), 2);
    expect(
      values(out)
        .flat()
        .every((value) => value === 200),
    ).toBe(true);
    expect(out.data[3]).toBe(255);
  });

  it('returns a copy for radius 0 and never mutates its input', () => {
    const src = grey([[0, 255, 0]]);
    const before = src.data.slice();
    const out = boxBlur(src, 0);
    expect(out.data).not.toBe(src.data);
    expect(values(out)).toEqual([[0, 255, 0]]);
    boxBlur(src, 1);
    expect(src.data).toEqual(before);
  });
});

describe('downscaleByFactor', () => {
  it('averages each block', () => {
    const src = grey([
      [0, 0, 255, 255],
      [0, 0, 255, 255],
      [100, 200, 0, 0],
      [100, 200, 0, 0],
    ]);
    expect(values(downscaleByFactor(src, 2))).toEqual([
      [0, 255],
      [150, 0],
    ]);
  });

  it('averages partial blocks at the edges', () => {
    const out = downscaleByFactor(grey([[10, 20, 90]]), 2);
    expect(out.width).toBe(2);
    expect(values(out)).toEqual([[15, 90]]);
  });
});

describe('downscaleAndRestore', () => {
  it('keeps the original dimensions', () => {
    const out = downscaleAndRestore(solid(10, 8, 50), 0.3);
    expect([out.width, out.height]).toEqual([10, 8]);
  });

  it('loses detail finer than the reduced resolution', () => {
    const checker = grey(
      Array.from({ length: 8 }, (_, y) => Array.from({ length: 8 }, (_, x) => ((x + y) % 2) * 255)),
    );
    const out = values(downscaleAndRestore(checker, 0.5)).flat();
    expect(Math.max(...out) - Math.min(...out)).toBeLessThan(2);
  });

  it('is a copy when no reduction is asked for', () => {
    expect(values(downscaleAndRestore(grey([[1, 2, 3]]), 1))).toEqual([[1, 2, 3]]);
  });
});

describe('lowLight', () => {
  it('compresses contrast around mid-grey and darkens', () => {
    const out =
      values(lowLight(grey([[0, 255]]), { contrast: 0.35, brightness: 0.6, noise: 0 }))[0] ?? [];
    expect(out[0]).toBe(50); // (128 - 128 × 0.35) × 0.6
    expect(out[1]).toBe(103); // (128 + 127 × 0.35) × 0.6
  });

  it('adds noise that is bounded and repeatable', () => {
    const options = { contrast: 1, brightness: 1, noise: 10, seed: 7 };
    const first = values(lowLight(solid(20, 20, 128), options)).flat();
    const second = values(lowLight(solid(20, 20, 128), options)).flat();
    expect(first).toEqual(second);
    expect(first.every((value) => value >= 118 && value <= 138)).toBe(true);
    expect(new Set(first).size).toBeGreaterThan(5);
  });
});

describe('rotate', () => {
  it('is an identity at 0 degrees', () => {
    const src = grey([
      [0, 50],
      [100, 150],
    ]);
    expect(values(rotate(src, 0, WHITE))).toEqual(values(src));
  });

  it('turns the image 90 degrees clockwise', () => {
    const src = grey([
      [0, 50, 0],
      [0, 0, 0],
      [0, 0, 0],
    ]);
    expect(values(rotate(src, 90, WHITE))).toEqual([
      [0, 0, 0],
      [0, 0, 50],
      [0, 0, 0],
    ]);
  });

  it('fills areas rotated in from outside the image', () => {
    const out = values(rotate(solid(10, 10, 0), 45, WHITE));
    expect(out[0]?.[0]).toBe(255);
    expect(out[5]?.[5]).toBe(0);
  });

  it('interpolates between neighbouring pixels', () => {
    const src = grey([
      [0, 0, 0, 0],
      [0, 0, 255, 255],
      [0, 0, 255, 255],
      [0, 0, 0, 0],
    ]);
    const out = values(rotate(src, 7, WHITE)).flat();
    expect(out.some((value) => value > 0 && value < 255)).toBe(true);
  });
});

describe('coverRect and crop', () => {
  it('covers only the rectangle and clips it to the image', () => {
    const out = values(coverRect(solid(4, 3, 0), { x: 2, y: 1, width: 10, height: 10 }, WHITE));
    expect(out).toEqual([
      [0, 0, 0, 0],
      [0, 0, 255, 255],
      [0, 0, 255, 255],
    ]);
  });

  it('crops a region', () => {
    const src = grey([
      [1, 2, 3],
      [4, 5, 6],
    ]);
    expect(values(crop(src, 1, 0, 2, 2))).toEqual([
      [2, 3],
      [5, 6],
    ]);
  });
});
