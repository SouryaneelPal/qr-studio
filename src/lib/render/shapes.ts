import type { Rect } from './plan';

export type GradientStop = [offset: number, color: string, opacity?: number];

export interface LinearGradient {
  kind: 'linear';
  x1: number;
  y1: number;
  x2: number;
  y2: number;
  stops: GradientStop[];
}

// Soft glows: spotlights, sun haze, screen light. Opacity per stop lets them fade to nothing.
export interface RadialGradient {
  kind: 'radial';
  cx: number;
  cy: number;
  r: number;
  stops: GradientStop[];
}

export type Paint = string | LinearGradient | RadialGradient;

interface Painted {
  fill?: Paint;
  stroke?: string;
  lineWidth?: number;
  opacity?: number;
}

// The few primitives every output (canvas, SVG, bounds checks) knows how to handle.
export type Shape =
  | (Painted & {
      kind: 'rect';
      x: number;
      y: number;
      width: number;
      height: number;
      radius?: number;
    })
  | (Painted & { kind: 'circle'; cx: number; cy: number; r: number })
  | (Painted & {
      kind: 'ellipse';
      cx: number;
      cy: number;
      rx: number;
      ry: number;
      rotation?: number;
    })
  | (Painted & { kind: 'path'; d: string; bounds: Rect; lineCap?: 'round' | 'butt' })
  // A filled shape with a hole cut out for the code. It is the only shape allowed to
  // surround the code, which is how scenes guarantee nothing is painted behind it.
  | {
      kind: 'ring';
      outer: Rect;
      outerRadius?: number;
      // An organic outline (cloud, heart, emblem) instead of a rectangle; `outer` is its bounds.
      outerPath?: string;
      hole: Rect;
      holeRadius?: number;
      fill: Paint;
      opacity?: number;
    }
  | TextShape;

export interface FontSpec {
  family: string;
  weight: number;
  size: number;
}

export interface TextShape {
  kind: 'text';
  text: string;
  // Centre of the line of text.
  x: number;
  y: number;
  font: FontSpec;
  width: number;
  fill: string;
  stroke?: string;
  strokeWidth?: number;
}

export function rect(
  x: number,
  y: number,
  width: number,
  height: number,
  paint: Painted & { radius?: number },
): Shape {
  return { kind: 'rect', x, y, width, height, ...paint };
}

export function circle(cx: number, cy: number, r: number, paint: Painted): Shape {
  return { kind: 'circle', cx, cy, r, ...paint };
}

export function linear(
  x1: number,
  y1: number,
  x2: number,
  y2: number,
  ...colors: string[]
): LinearGradient {
  const last = Math.max(1, colors.length - 1);
  return { kind: 'linear', x1, y1, x2, y2, stops: colors.map((color, i) => [i / last, color]) };
}

// A radial glow from a solid centre colour out to fully transparent.
export function glowPaint(
  cx: number,
  cy: number,
  r: number,
  color: string,
  solidUntil = 0,
): RadialGradient {
  return {
    kind: 'radial',
    cx,
    cy,
    r,
    stops: [
      [0, color, 1],
      [solidUntil, color, 1],
      [1, color, 0],
    ],
  };
}

function round(value: number): number {
  return Math.round(value * 100) / 100;
}

// Builds SVG path data (absolute commands only) and tracks a conservative bounding box,
// so tests can prove decorations stay clear of the code.
export class PathBuilder {
  private parts: string[] = [];
  private minX = Infinity;
  private minY = Infinity;
  private maxX = -Infinity;
  private maxY = -Infinity;

  private include(...points: number[]) {
    for (let i = 0; i < points.length; i += 2) {
      const x = points[i] ?? 0;
      const y = points[i + 1] ?? 0;
      this.minX = Math.min(this.minX, x);
      this.minY = Math.min(this.minY, y);
      this.maxX = Math.max(this.maxX, x);
      this.maxY = Math.max(this.maxY, y);
    }
  }

  moveTo(x: number, y: number): this {
    this.include(x, y);
    this.parts.push(`M${round(x)} ${round(y)}`);
    return this;
  }

  lineTo(x: number, y: number): this {
    this.include(x, y);
    this.parts.push(`L${round(x)} ${round(y)}`);
    return this;
  }

  quadTo(cx: number, cy: number, x: number, y: number): this {
    this.include(cx, cy, x, y);
    this.parts.push(`Q${round(cx)} ${round(cy)} ${round(x)} ${round(y)}`);
    return this;
  }

  cubicTo(c1x: number, c1y: number, c2x: number, c2y: number, x: number, y: number): this {
    this.include(c1x, c1y, c2x, c2y, x, y);
    this.parts.push(
      `C${round(c1x)} ${round(c1y)} ${round(c2x)} ${round(c2y)} ${round(x)} ${round(y)}`,
    );
    return this;
  }

  polygon(points: [number, number][]): this {
    points.forEach(([x, y], i) => (i === 0 ? this.moveTo(x, y) : this.lineTo(x, y)));
    return this.close();
  }

  close(): this {
    this.parts.push('Z');
    return this;
  }

  shape(paint: Painted & { lineCap?: 'round' | 'butt' }): Shape {
    return {
      kind: 'path',
      d: this.parts.join(''),
      bounds: {
        x: this.minX,
        y: this.minY,
        width: this.maxX - this.minX,
        height: this.maxY - this.minY,
      },
      ...paint,
    };
  }
}

export function path(): PathBuilder {
  return new PathBuilder();
}

export function shapeBounds(shape: Shape): Rect {
  const base = fillBounds(shape);
  const lineWidth = 'lineWidth' in shape && shape.stroke ? (shape.lineWidth ?? 1) : 0;
  return lineWidth
    ? {
        x: base.x - lineWidth / 2,
        y: base.y - lineWidth / 2,
        width: base.width + lineWidth,
        height: base.height + lineWidth,
      }
    : base;
}

function fillBounds(shape: Shape): Rect {
  switch (shape.kind) {
    case 'rect':
      return { x: shape.x, y: shape.y, width: shape.width, height: shape.height };
    case 'circle':
      return {
        x: shape.cx - shape.r,
        y: shape.cy - shape.r,
        width: 2 * shape.r,
        height: 2 * shape.r,
      };
    case 'ellipse': {
      const reach = Math.max(shape.rx, shape.ry);
      return { x: shape.cx - reach, y: shape.cy - reach, width: 2 * reach, height: 2 * reach };
    }
    case 'path':
      return shape.bounds;
    case 'ring':
      return shape.outer;
    case 'text':
      return {
        x: shape.x - shape.width / 2,
        y: shape.y - shape.font.size * 0.65,
        width: shape.width,
        height: shape.font.size * 1.3,
      };
  }
}

export function intersects(a: Rect, b: Rect): boolean {
  return a.x < b.x + b.width && b.x < a.x + a.width && a.y < b.y + b.height && b.y < a.y + a.height;
}

export function contains(outer: Rect, inner: Rect): boolean {
  return (
    inner.x >= outer.x &&
    inner.y >= outer.y &&
    inner.x + inner.width <= outer.x + outer.width &&
    inner.y + inner.height <= outer.y + outer.height
  );
}

// Small deterministic PRNG (mulberry32) so textures and glitches are identical on every render.
export function seededRandom(seed: number): () => number {
  let state = seed >>> 0;
  return () => {
    state = (state + 0x6d2b79f5) >>> 0;
    let t = state;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
