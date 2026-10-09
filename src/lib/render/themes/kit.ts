import type { Rect } from '../plan';
import { circle, intersects, path, type Paint, type Shape } from '../shapes';
import type { FrameContext } from './types';

// Reusable building blocks for frames. Everything here stays inside the frame bands.

export function ring(
  context: FrameContext,
  fill: Paint,
  outer?: Rect,
  outerRadius?: number,
): Shape {
  return {
    kind: 'ring',
    outer: outer ?? { x: 0, y: 0, width: context.width, height: context.height },
    outerRadius,
    hole: context.tile,
    fill,
  };
}

// A border drawn as a band, so its bounds never claim the area it surrounds.
export function outline(box: Rect, lineWidth: number, fill: Paint, radius = 0): Shape {
  return {
    kind: 'ring',
    outer: box,
    outerRadius: radius,
    hole: inset(box, lineWidth),
    holeRadius: Math.max(0, radius - lineWidth),
    fill,
  };
}

export function inset(box: Rect, by: number): Rect {
  return { x: box.x + by, y: box.y + by, width: box.width - 2 * by, height: box.height - 2 * by };
}

export function grow(box: Rect, by: number): Rect {
  return inset(box, -by);
}

// Thinnest frame side, ignoring the caption strip; sizes of perimeter decorations derive from it.
export function thinnestEdge(context: FrameContext): number {
  const { edges } = context;
  return Math.min(edges.top.height, edges.bottom.height, edges.left.width, edges.right.width);
}

// Evenly spaced points on a rectangle running `distance` px in from the image edge.
export function perimeterPoints(
  context: FrameContext,
  distance: number,
  spacing: number,
): [number, number][] {
  const x0 = distance;
  const y0 = distance;
  const x1 = context.width - distance;
  const y1 = context.height - distance;
  const sides: [number, number, number, number][] = [
    [x0, y0, x1, y0],
    [x1, y0, x1, y1],
    [x1, y1, x0, y1],
    [x0, y1, x0, y0],
  ];
  const points: [number, number][] = [];
  for (const [ax, ay, bx, by] of sides) {
    const length = Math.hypot(bx - ax, by - ay);
    const count = Math.max(1, Math.round(length / spacing));
    for (let i = 0; i < count; i++) {
      points.push([ax + ((bx - ax) * i) / count, ay + ((by - ay) * i) / count]);
    }
  }
  return points;
}

// Keeps a decoration of the given half-size clear of the code, its quiet zone and the caption.
export function isClear(
  context: FrameContext,
  x: number,
  y: number,
  halfSize: number,
  gap = 2,
): boolean {
  const box = {
    x: x - halfSize - gap,
    y: y - halfSize - gap,
    width: 2 * (halfSize + gap),
    height: 2 * (halfSize + gap),
  };
  if (intersects(box, context.tile)) return false;
  if (context.caption && intersects(box, context.caption)) return false;
  return (
    box.x >= 0 &&
    box.y >= 0 &&
    box.x + box.width <= context.width &&
    box.y + box.height <= context.height
  );
}

export function clearPoints(
  context: FrameContext,
  points: [number, number][],
  halfSize: number,
): [number, number][] {
  return points.filter(([x, y]) => isClear(context, x, y, halfSize));
}

// Random positions in the free frame area, for confetti-like patterns.
export function scatter(
  context: FrameContext,
  count: number,
  halfSize: number,
  attempts = count * 20,
): [number, number][] {
  const points: [number, number][] = [];
  for (let i = 0; i < attempts && points.length < count; i++) {
    const x = context.random() * context.width;
    const y = context.random() * context.height;
    if (isClear(context, x, y, halfSize)) points.push([x, y]);
  }
  return points;
}

export function heart(cx: number, cy: number, size: number, fill: string): Shape {
  const s = size / 2;
  return path()
    .moveTo(cx, cy + s)
    .cubicTo(cx - s * 1.6, cy - s * 0.2, cx - s * 0.7, cy - s * 1.3, cx, cy - s * 0.45)
    .cubicTo(cx + s * 0.7, cy - s * 1.3, cx + s * 1.6, cy - s * 0.2, cx, cy + s)
    .close()
    .shape({ fill });
}

export function star(
  cx: number,
  cy: number,
  outer: number,
  innerRatio: number,
  points: number,
  fill: string,
  rotation = -Math.PI / 2,
): Shape {
  const corners: [number, number][] = [];
  for (let i = 0; i < points * 2; i++) {
    const radius = i % 2 === 0 ? outer : outer * innerRatio;
    const angle = rotation + (i * Math.PI) / points;
    corners.push([cx + Math.cos(angle) * radius, cy + Math.sin(angle) * radius]);
  }
  return path().polygon(corners).shape({ fill });
}

// A four-pointed twinkle, the shape of a glint of light.
export function twinkle(cx: number, cy: number, size: number, fill: string): Shape {
  return star(cx, cy, size, 0.28, 4, fill);
}

export function bolt(cx: number, cy: number, size: number, fill: string, stroke?: string): Shape {
  const s = size / 2;
  return path()
    .polygon([
      [cx + s * 0.15, cy - s],
      [cx - s * 0.55, cy + s * 0.1],
      [cx - s * 0.05, cy + s * 0.1],
      [cx - s * 0.2, cy + s],
      [cx + s * 0.55, cy - s * 0.15],
      [cx + s * 0.05, cy - s * 0.15],
    ])
    .shape({ fill, stroke, lineWidth: stroke ? Math.max(1, size * 0.05) : undefined });
}

export function cloud(cx: number, cy: number, size: number, fill: string): Shape[] {
  const r = size / 4;
  return [
    circle(cx - r * 1.3, cy + r * 0.3, r * 0.9, { fill }),
    circle(cx, cy - r * 0.2, r * 1.25, { fill }),
    circle(cx + r * 1.3, cy + r * 0.3, r * 0.9, { fill }),
    {
      kind: 'rect',
      x: cx - r * 1.3,
      y: cy + r * 0.2,
      width: r * 2.6,
      height: r,
      radius: r * 0.5,
      fill,
    },
  ];
}

export function flower(
  cx: number,
  cy: number,
  size: number,
  petals: number,
  petalFill: string,
  centreFill: string,
): Shape[] {
  const shapes: Shape[] = [];
  const r = size / 2;
  for (let i = 0; i < petals; i++) {
    const angle = (i * 2 * Math.PI) / petals;
    shapes.push({
      kind: 'ellipse',
      cx: cx + Math.cos(angle) * r * 0.55,
      cy: cy + Math.sin(angle) * r * 0.55,
      rx: r * 0.45,
      ry: r * 0.26,
      rotation: angle,
      fill: petalFill,
    });
  }
  shapes.push(circle(cx, cy, r * 0.3, { fill: centreFill }));
  return shapes;
}

export function polyline(
  points: [number, number][],
  stroke: string,
  lineWidth: number,
  opacity?: number,
): Shape {
  const builder = path();
  points.forEach(([x, y], i) => (i === 0 ? builder.moveTo(x, y) : builder.lineTo(x, y)));
  return builder.shape({ stroke, lineWidth, opacity, lineCap: 'round' });
}

function boundsOf(points: [number, number][], pad: number): Rect {
  const xs = points.map(([x]) => x);
  const ys = points.map(([, y]) => y);
  const x = Math.min(...xs) - pad;
  const y = Math.min(...ys) - pad;
  return { x, y, width: Math.max(...xs) + pad - x, height: Math.max(...ys) + pad - y };
}

// A jagged crack that wanders from a start point. It stops before its bounding box would
// reach the code or the caption, which also stops it bending round a corner of the code.
export function crack(
  context: FrameContext,
  x: number,
  y: number,
  angle: number,
  length: number,
  stroke: string,
  lineWidth: number,
): Shape | null {
  const points: [number, number][] = [[x, y]];
  const steps = 6;
  for (let i = 1; i <= steps; i++) {
    const jitter = (context.random() - 0.5) * 0.9;
    const [px, py] = points[points.length - 1] ?? [x, y];
    const next: [number, number] = [
      px + Math.cos(angle + jitter) * (length / steps),
      py + Math.sin(angle + jitter) * (length / steps),
    ];
    const box = boundsOf([...points, next], lineWidth + 2);
    if (intersects(box, context.tile) || (context.caption && intersects(box, context.caption)))
      break;
    points.push(next);
  }
  return points.length > 1 ? polyline(points, stroke, lineWidth) : null;
}

export function compact<T>(items: (T | null | undefined | false)[]): T[] {
  return items.filter((item): item is T => Boolean(item));
}
