import type { Rect } from '../plan';
import { circle, intersects, path, rect, shapeBounds, type Paint, type Shape } from '../shapes';
import type { SceneContext } from './types';

// Building blocks for scenes. The rule they all follow: only a `ring` (a shape with a hole
// cut for the code) may surround the code; everything else stays clear of it.

export interface Sides {
  top: number;
  right: number;
  bottom: number;
  left: number;
}

function sides(value: number | Partial<Sides>): Sides {
  if (typeof value === 'number') return { top: value, right: value, bottom: value, left: value };
  return {
    top: value.top ?? 0,
    right: value.right ?? 0,
    bottom: value.bottom ?? 0,
    left: value.left ?? 0,
  };
}

export function grow(box: Rect, by: number | Partial<Sides>): Rect {
  const s = sides(by);
  return {
    x: box.x - s.left,
    y: box.y - s.top,
    width: box.width + s.left + s.right,
    height: box.height + s.top + s.bottom,
  };
}

export function centre(box: Rect): [number, number] {
  return [box.x + box.width / 2, box.y + box.height / 2];
}

// The scene's background, edge to edge, with the code's tile cut out.
export function backdrop(scene: SceneContext, fill: Paint): Shape {
  return {
    kind: 'ring',
    outer: { x: 0, y: 0, width: scene.size, height: scene.size },
    hole: scene.tile,
    fill,
  };
}

// An object the code sits on (a card, a screen, a label): it surrounds the tile.
export function around(
  scene: SceneContext,
  by: number | Partial<Sides>,
  fill: Paint,
  radius = 0,
  opacity?: number,
): Shape {
  return {
    kind: 'ring',
    outer: grow(scene.tile, by),
    outerRadius: radius,
    hole: scene.tile,
    fill,
    opacity,
  };
}

// An organic surface (cloud, heart, emblem) drawn as a path that encloses the tile.
export function organic(scene: SceneContext, outline: Shape, fill: Paint, opacity?: number): Shape {
  if (outline.kind !== 'path') throw new Error('organic() needs a path outline');
  return {
    kind: 'ring',
    outer: outline.bounds,
    outerPath: outline.d,
    hole: scene.tile,
    fill,
    opacity,
  };
}

// A soft-edged light surface: solid out to `pad` beyond the tile, then fading over `spread`.
// The fade starts outside the quiet zone, because the tile itself is never painted.
export function feather(
  scene: SceneContext,
  options: { pad: number; spread: number; radius?: number; colour?: string; steps?: number },
): Shape[] {
  const { pad, spread, radius = pad, colour = scene.surface, steps = 8 } = options;
  const shapes: Shape[] = [];
  for (let i = steps; i >= 1; i--) {
    const reach = pad + (spread * i) / steps;
    shapes.push(around(scene, reach, colour, radius + (spread * i) / steps, 0.26));
  }
  shapes.push(around(scene, pad, colour, radius));
  return shapes;
}

// Light rays fanning out from the code's centre, starting `inner` px out so they never reach it.
export function rays(
  scene: SceneContext,
  count: number,
  inner: number,
  colours: string[],
  spread = 0.45,
  opacity?: number,
): Shape[] {
  const [cx, cy] = centre(scene.tile);
  const outer = scene.size * 1.5;
  const shapes: Shape[] = [];
  for (let i = 0; i < count; i++) {
    const angle = (i / count) * Math.PI * 2;
    const half = (Math.PI / count) * spread;
    shapes.push(
      path()
        .polygon([
          [cx + Math.cos(angle - half) * inner, cy + Math.sin(angle - half) * inner],
          [cx + Math.cos(angle - half) * outer, cy + Math.sin(angle - half) * outer],
          [cx + Math.cos(angle + half) * outer, cy + Math.sin(angle + half) * outer],
          [cx + Math.cos(angle + half) * inner, cy + Math.sin(angle + half) * inner],
        ])
        .shape({ fill: colours[i % colours.length] ?? '#ffffff', opacity }),
    );
  }
  return shapes;
}

// Keeps a decoration clear of the code (plus a margin for its soft surface) and the caption.
export function isClear(
  scene: SceneContext,
  x: number,
  y: number,
  halfSize: number,
  keepOut = scene.size * 0.03,
): boolean {
  const box = { x: x - halfSize, y: y - halfSize, width: 2 * halfSize, height: 2 * halfSize };
  if (intersects(box, grow(scene.tile, keepOut))) return false;
  return !(scene.caption && intersects(box, grow(scene.caption, scene.size * 0.03)));
}

export function scatter(
  scene: SceneContext,
  count: number,
  halfSize: number,
  keepOut?: number,
): [number, number][] {
  const points: [number, number][] = [];
  for (let i = 0; i < count * 25 && points.length < count; i++) {
    const x = scene.random() * scene.size;
    const y = scene.random() * scene.size;
    if (isClear(scene, x, y, halfSize, keepOut)) points.push([x, y]);
  }
  return points;
}

// Drops any piece that would touch the code. Scenes avoid it by design; this makes it certain.
export function keepClear(tile: Rect, shapes: Shape[]): Shape[] {
  return shapes.filter((shape) => shape.kind === 'ring' || !intersects(shapeBounds(shape), tile));
}

// Evenly spaced points round a rectangle's outline, for bulbs, rivets and borders.
export function pointsAround(box: Rect, spacing: number): [number, number][] {
  const corners: [number, number][] = [
    [box.x, box.y],
    [box.x + box.width, box.y],
    [box.x + box.width, box.y + box.height],
    [box.x, box.y + box.height],
  ];
  const points: [number, number][] = [];
  corners.forEach(([ax, ay], i) => {
    const [bx, by] = corners[(i + 1) % 4] ?? [ax, ay];
    const count = Math.max(1, Math.round(Math.hypot(bx - ax, by - ay) / spacing));
    for (let k = 0; k < count; k++)
      points.push([ax + ((bx - ax) * k) / count, ay + ((by - ay) * k) / count]);
  });
  return points;
}

// ---- Caption holders: each is drawn only when the caption is on. ----

function captionBox(scene: SceneContext, pad: number): Rect | null {
  return scene.caption
    ? grow(scene.caption, { left: pad * 2, right: pad * 2, top: pad, bottom: pad })
    : null;
}

export function ribbon(scene: SceneContext, fill: string, shade: string, edge?: string): Shape[] {
  const box = captionBox(scene, scene.size * 0.012);
  if (!box) return [];
  const tail = box.height * 0.9;
  const drop = box.height * 0.28;
  const lineWidth = edge ? Math.max(1.5, scene.size * 0.004) : undefined;
  const end = (x: number, dir: number) =>
    path()
      .polygon([
        [x - dir * tail * 0.3, box.y + drop],
        [x + dir * tail * 0.7, box.y + drop],
        [x + dir * tail * 0.35, box.y + drop + box.height / 2],
        [x + dir * tail * 0.7, box.y + drop + box.height],
        [x - dir * tail * 0.3, box.y + drop + box.height],
      ])
      .shape({ fill: shade, stroke: edge, lineWidth });
  return [
    end(box.x, -1),
    end(box.x + box.width, 1),
    rect(box.x, box.y, box.width, box.height, { fill, stroke: edge, lineWidth }),
  ];
}

export function sign(
  scene: SceneContext,
  fill: Paint,
  edge: string,
  options: { hangers?: boolean; radius?: number } = {},
): Shape[] {
  const box = captionBox(scene, scene.size * 0.014);
  if (!box) return [];
  const line = Math.max(1.5, scene.size * 0.005);
  const shapes: Shape[] = [];
  if (options.hangers && scene.captionPosition === 'top') {
    for (const x of [box.x + box.width * 0.15, box.x + box.width * 0.85]) {
      shapes.push(rect(x - line / 2, 0, line, box.y, { fill: edge }));
    }
  }
  shapes.push(
    rect(box.x, box.y, box.width, box.height, {
      fill,
      stroke: edge,
      lineWidth: line,
      radius: options.radius ?? box.height * 0.2,
    }),
  );
  return shapes;
}

export function ticker(scene: SceneContext, fill: Paint, accent: string): Shape[] {
  const box = captionBox(scene, scene.size * 0.012);
  if (!box) return [];
  const dot = Math.max(1.5, box.height * 0.06);
  const shapes: Shape[] = [rect(0, box.y, scene.size, box.height, { fill })];
  for (let x = dot * 3; x < scene.size; x += dot * 6) {
    shapes.push(
      circle(x, box.y + dot * 2, dot, { fill: accent }),
      circle(x, box.y + box.height - dot * 2, dot, { fill: accent }),
    );
  }
  return shapes;
}

// ---- Small motifs ----

export function heart(cx: number, cy: number, size: number, fill: string, opacity?: number): Shape {
  const s = size / 2;
  return path()
    .moveTo(cx, cy + s)
    .cubicTo(cx - s * 1.6, cy - s * 0.2, cx - s * 0.7, cy - s * 1.3, cx, cy - s * 0.45)
    .cubicTo(cx + s * 0.7, cy - s * 1.3, cx + s * 1.6, cy - s * 0.2, cx, cy + s)
    .close()
    .shape({ fill, opacity });
}

export function star(
  cx: number,
  cy: number,
  outer: number,
  innerRatio: number,
  points: number,
  fill: string,
  opacity?: number,
): Shape {
  const corners: [number, number][] = [];
  for (let i = 0; i < points * 2; i++) {
    const radius = i % 2 === 0 ? outer : outer * innerRatio;
    const angle = -Math.PI / 2 + (i * Math.PI) / points;
    corners.push([cx + Math.cos(angle) * radius, cy + Math.sin(angle) * radius]);
  }
  return path().polygon(corners).shape({ fill, opacity });
}

export function twinkle(
  cx: number,
  cy: number,
  size: number,
  fill: string,
  opacity?: number,
): Shape {
  return star(cx, cy, size, 0.28, 4, fill, opacity);
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

export function cloud(
  cx: number,
  cy: number,
  size: number,
  fill: string,
  opacity?: number,
): Shape[] {
  const r = size / 4;
  return [
    circle(cx - r * 1.3, cy + r * 0.3, r * 0.9, { fill, opacity }),
    circle(cx, cy - r * 0.2, r * 1.25, { fill, opacity }),
    circle(cx + r * 1.3, cy + r * 0.3, r * 0.9, { fill, opacity }),
    {
      kind: 'rect',
      x: cx - r * 1.3,
      y: cy + r * 0.2,
      width: r * 2.6,
      height: r,
      radius: r * 0.5,
      fill,
      opacity,
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

// A jagged crack wandering from a point; it stops before reaching the code or the caption.
export function crack(
  scene: SceneContext,
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
    const jitter = (scene.random() - 0.5) * 0.9;
    const [px, py] = points[points.length - 1] ?? [x, y];
    const next: [number, number] = [
      px + Math.cos(angle + jitter) * (length / steps),
      py + Math.sin(angle + jitter) * (length / steps),
    ];
    if (!isClear(scene, next[0], next[1], lineWidth + 2, scene.size * 0.02)) break;
    points.push(next);
  }
  return points.length > 1 ? polyline(points, stroke, lineWidth) : null;
}

export function compact<T>(items: (T | null | undefined | false)[]): T[] {
  return items.filter((item): item is T => Boolean(item));
}

// ---- Outlines for organic surfaces ----

// Distance from the tile's centre to its edge at `angle`, i.e. the square's polar outline.
export function squareReach(halfSize: number, angle: number): number {
  return halfSize / Math.max(Math.abs(Math.cos(angle)), Math.abs(Math.sin(angle)));
}

// A closed outline around the code from a polar radius function. Callers make sure the
// radius always clears the tile's corners, so the code's tile stays inside the hole.
export function blobPath(
  scene: SceneContext,
  radiusAt: (angle: number) => number,
  samples = 144,
): Shape {
  const [cx, cy] = centre(scene.tile);
  const points: [number, number][] = [];
  for (let i = 0; i < samples; i++) {
    const angle = (i / samples) * Math.PI * 2;
    const r = radiusAt(angle);
    points.push([cx + Math.cos(angle) * r, cy + Math.sin(angle) * r]);
  }
  return path().polygon(points).shape({});
}

export function circlePath(scene: SceneContext, radius: number): Shape {
  return blobPath(scene, () => radius, 96);
}

// How far an object must reach past the tile on each side to also hold the caption.
export function holdingCaption(scene: SceneContext, pad: number): Sides {
  const result = { top: pad, right: pad, bottom: pad, left: pad };
  const box = scene.caption;
  if (!box) return result;
  const extra = pad * 0.7;
  if (scene.captionPosition === 'top') result.top = Math.max(pad, scene.tile.y - box.y + extra);
  else
    result.bottom = Math.max(pad, box.y + box.height - (scene.tile.y + scene.tile.height) + extra);
  result.left = Math.max(pad, scene.tile.x - box.x + extra);
  result.right = Math.max(pad, box.x + box.width - (scene.tile.x + scene.tile.width) + extra);
  return result;
}

// A straight line broken into short pieces, so the pieces crossing the code can be dropped
// without losing the rest of the line.
export function brokenLine(
  x1: number,
  y1: number,
  x2: number,
  y2: number,
  pieces: number,
  stroke: string,
  lineWidth: number,
  opacity?: number,
): Shape[] {
  const shapes: Shape[] = [];
  for (let i = 0; i < pieces; i++) {
    const a = i / pieces;
    const b = (i + 1) / pieces;
    shapes.push(
      polyline(
        [
          [x1 + (x2 - x1) * a, y1 + (y2 - y1) * a],
          [x1 + (x2 - x1) * b, y1 + (y2 - y1) * b],
        ],
        stroke,
        lineWidth,
        opacity,
      ),
    );
  }
  return shapes;
}

export function inside(box: Rect, x: number, y: number): boolean {
  return x >= box.x && x <= box.x + box.width && y >= box.y && y <= box.y + box.height;
}
