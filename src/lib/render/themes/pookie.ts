import { circle, linear, path, type Shape } from '../shapes';
import {
  clearPoints,
  cloud,
  heart,
  isClear,
  outline,
  perimeterPoints,
  ring,
  scatter,
  star,
  thinnestEdge,
  twinkle,
} from './kit';
import { CAPTION_FAMILIES, type FrameContext, type SubTheme, type Theme } from './types';

const even = (value: number) => ({ top: value, right: value, bottom: value, left: value });
const grotesque = CAPTION_FAMILIES.grotesque;

function softBorder(context: FrameContext, colour: string): Shape {
  const w = context.width;
  const line = Math.max(2, Math.round(w * 0.008));
  const gap = Math.round(thinnestEdge(context) * 0.22);
  return outline(
    { x: gap, y: gap, width: w - 2 * gap, height: context.height - 2 * gap },
    line,
    colour,
    w * 0.05,
  );
}

const bubblegum: SubTheme = {
  id: 'bubblegum',
  name: 'Bubblegum',
  swatch: ['#ffc2dd', '#ff4f93'],
  qr: { foreground: '#5c0b33', background: '#fff5fa', errorCorrection: 'M' },
  insets: even(0.1),
  captionBand: 0.12,
  caption: { family: grotesque, weight: 800, color: '#8a1048' },
  suggestion: 'Scan me, pookie 💕',
  decorate(context) {
    const edge = thinnestEdge(context);
    const shapes: Shape[] = [ring(context, '#ffc2dd'), softBorder(context, '#ff8fbd')];
    scatter(context, 28, edge * 0.2).forEach(([x, y], i) => {
      shapes.push(
        heart(x, y, edge * (0.22 + context.random() * 0.16), i % 3 === 0 ? '#ffffff' : '#ff4f93'),
      );
    });
    return shapes;
  },
};

const lavender: SubTheme = {
  id: 'lavender',
  name: 'Lavender cloud',
  swatch: ['#d9ccff', '#ffffff'],
  qr: { foreground: '#2e1a5c', background: '#fbf9ff', errorCorrection: 'M' },
  insets: even(0.11),
  captionBand: 0.12,
  caption: { family: grotesque, weight: 800, color: '#4b2a8a' },
  suggestion: 'Head in the clouds ☁️',
  decorate(context) {
    const edge = thinnestEdge(context);
    const shapes: Shape[] = [ring(context, linear(0, 0, 0, context.height, '#ece4ff', '#c9b6ff'))];
    const size = edge * 0.8;
    for (const [x, y] of scatter(context, 14, size * 0.55))
      shapes.push(...cloud(x, y, size, '#ffffff'));
    for (const [x, y] of scatter(context, 16, edge * 0.08))
      shapes.push(twinkle(x, y, edge * 0.08, '#8f74d9'));
    return shapes;
  },
};

function strawberry(cx: number, cy: number, size: number): Shape[] {
  const s = size / 2;
  const berry = path()
    .moveTo(cx, cy + s)
    .cubicTo(cx - s * 1.1, cy + s * 0.2, cx - s * 0.95, cy - s * 0.75, cx, cy - s * 0.55)
    .cubicTo(cx + s * 0.95, cy - s * 0.75, cx + s * 1.1, cy + s * 0.2, cx, cy + s)
    .close()
    .shape({ fill: '#e63950' });
  const leaves = path()
    .polygon([
      [cx - s * 0.6, cy - s * 0.6],
      [cx - s * 0.15, cy - s * 0.45],
      [cx, cy - s * 0.95],
      [cx + s * 0.15, cy - s * 0.45],
      [cx + s * 0.6, cy - s * 0.6],
      [cx, cy - s * 0.3],
    ])
    .shape({ fill: '#3f9b4b' });
  const seeds = [
    [-0.35, -0.1],
    [0.35, -0.1],
    [0, 0.15],
    [-0.25, 0.4],
    [0.25, 0.4],
  ].map(([dx = 0, dy = 0]) =>
    circle(cx + dx * s, cy + dy * s, Math.max(0.8, s * 0.07), { fill: '#ffe08a' }),
  );
  return [berry, leaves, ...seeds];
}

const strawberryMilk: SubTheme = {
  id: 'strawberry',
  name: 'Strawberry milk',
  swatch: ['#ffd6e0', '#e63950'],
  qr: { foreground: '#4a0d1c', background: '#fffaf3', errorCorrection: 'M' },
  insets: even(0.1),
  captionBand: 0.12,
  caption: { family: grotesque, weight: 800, color: '#9b1d3a' },
  suggestion: 'Berry sweet 🍓',
  decorate(context) {
    const edge = thinnestEdge(context);
    const shapes: Shape[] = [ring(context, '#ffd6e0')];
    // Cream polka dots, then a scattering of tiny strawberries.
    for (const [x, y] of clearPoints(context, gridPoints(context, edge * 0.45), edge * 0.07)) {
      shapes.push(circle(x, y, Math.max(1.5, edge * 0.06), { fill: '#fff6e9' }));
    }
    for (const [x, y] of scatter(context, 12, edge * 0.24))
      shapes.push(...strawberry(x, y, edge * 0.42));
    return shapes;
  },
};

function gridPoints(context: FrameContext, spacing: number): [number, number][] {
  const points: [number, number][] = [];
  for (let y = spacing / 2; y < context.height; y += spacing) {
    const shift = Math.round(y / spacing) % 2 === 0 ? 0 : spacing / 2;
    for (let x = spacing / 2 + shift; x < context.width; x += spacing) points.push([x, y]);
  }
  return points;
}

const bunny: SubTheme = {
  id: 'bunny',
  name: 'Bunny',
  swatch: ['#fff1f4', '#f48fb1'],
  qr: { foreground: '#3d1020', background: '#ffffff', errorCorrection: 'M' },
  insets: { top: 0.24, right: 0.08, bottom: 0.08, left: 0.08 },
  captionBand: 0.12,
  caption: { family: grotesque, weight: 800, color: '#ad1457' },
  suggestion: 'Some bunny loves you',
  decorate(context) {
    const w = context.width;
    const top = context.edges.top;
    const shapes: Shape[] = [ring(context, '#fde2ea'), softBorder(context, '#f48fb1')];
    // Two ears standing up from the top edge of the frame.
    const earHeight = top.height * 0.42;
    const earWidth = earHeight * 0.42;
    for (const side of [-1, 1]) {
      const cx = w / 2 + side * w * 0.16;
      const cy = top.y + top.height * 0.5;
      const tilt = side * 0.18;
      shapes.push(
        {
          kind: 'ellipse',
          cx,
          cy,
          rx: earWidth,
          ry: earHeight,
          rotation: tilt,
          fill: '#ffffff',
          stroke: '#e57399',
          lineWidth: Math.max(1.5, w * 0.005),
        },
        {
          kind: 'ellipse',
          cx,
          cy: cy + earHeight * 0.08,
          rx: earWidth * 0.5,
          ry: earHeight * 0.72,
          rotation: tilt,
          fill: '#f8bbd0',
        },
      );
    }
    // A little face peeking over the bottom edge.
    const bottom = context.edges.bottom;
    const faceY = bottom.y + bottom.height * 0.5;
    if (isClear(context, w / 2, faceY, bottom.height * 0.2)) {
      const r = Math.max(1.5, bottom.height * 0.07);
      shapes.push(
        circle(w / 2 - r * 3, faceY, r, { fill: '#3d1020' }),
        circle(w / 2 + r * 3, faceY, r, { fill: '#3d1020' }),
        circle(w / 2, faceY + r * 1.6, r * 0.9, { fill: '#f06292' }),
      );
    }
    for (const [x, y] of clearPoints(
      context,
      perimeterPoints(context, thinnestEdge(context) * 0.5, w * 0.11),
      w * 0.02,
    )) {
      shapes.push(heart(x, y, w * 0.03, '#f48fb1'));
    }
    return shapes;
  },
};

const sparkle: SubTheme = {
  id: 'sparkle',
  name: 'Sparkle',
  swatch: ['#d8f3ff', '#ffd23f'],
  qr: { foreground: '#2a1748', background: '#ffffff', errorCorrection: 'M' },
  insets: even(0.1),
  captionBand: 0.12,
  caption: { family: grotesque, weight: 800, color: '#5a2d82' },
  suggestion: 'Sparkle on ✨',
  decorate(context) {
    const edge = thinnestEdge(context);
    const colours = ['#ffd23f', '#ff9ad5', '#7fd8ff', '#b79cff'];
    const shapes: Shape[] = [
      ring(context, linear(0, 0, context.width, context.height, '#d8f3ff', '#fbe3ff', '#fff3cf')),
    ];
    scatter(context, 14, edge * 0.24).forEach(([x, y], i) =>
      shapes.push(star(x, y, edge * 0.22, 0.45, 5, colours[i % colours.length] ?? '#ffd23f')),
    );
    scatter(context, 22, edge * 0.12).forEach(([x, y], i) =>
      shapes.push(twinkle(x, y, edge * 0.12, colours[(i + 1) % colours.length] ?? '#ffffff')),
    );
    return shapes;
  },
};

export const pookie: Theme = {
  id: 'pookie',
  name: 'Pookie',
  subThemes: [bubblegum, lavender, strawberryMilk, bunny, sparkle],
  showcase: 'bunny',
};
