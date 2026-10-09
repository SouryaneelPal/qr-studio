import type { Rect } from '../plan';
import { circle, linear, path, rect, type Shape } from '../shapes';
import {
  bolt,
  clearPoints,
  compact,
  crack,
  isClear,
  outline,
  perimeterPoints,
  ring,
  scatter,
  star,
  thinnestEdge,
} from './kit';
import { CAPTION_FAMILIES, type FrameContext, type SubTheme, type Theme } from './types';

const even = (value: number) => ({ top: value, right: value, bottom: value, left: value });
const arcade = CAPTION_FAMILIES.arcade;

// A plain heraldic kite shield with a chevron: a generic emblem, not any character's.
function badge(
  cx: number,
  cy: number,
  size: number,
  field: string,
  chevron: string,
  edge: string,
): Shape[] {
  const s = size / 2;
  const outlinePath = path()
    .moveTo(cx - s, cy - s)
    .lineTo(cx + s, cy - s)
    .lineTo(cx + s, cy)
    .quadTo(cx + s, cy + s * 0.8, cx, cy + s * 1.2)
    .quadTo(cx - s, cy + s * 0.8, cx - s, cy)
    .close();
  return [
    outlinePath.shape({ fill: field, stroke: edge, lineWidth: Math.max(1.5, size * 0.07) }),
    path()
      .polygon([
        [cx - s * 0.7, cy + s * 0.15],
        [cx, cy - s * 0.45],
        [cx + s * 0.7, cy + s * 0.15],
        [cx + s * 0.7, cy + s * 0.5],
        [cx, cy - s * 0.1],
        [cx - s * 0.7, cy + s * 0.5],
      ])
      .shape({ fill: chevron }),
  ];
}

function edgeStripes(context: FrameContext, colours: [string, string], thickness: number): Shape[] {
  const shapes: Shape[] = [];
  const points = perimeterPoints(context, thickness / 2, thickness * 1.2);
  points.forEach(([x, y], i) => {
    if (isClear(context, x, y, thickness / 2, 0)) {
      shapes.push(
        rect(x - thickness / 2, y - thickness / 2, thickness, thickness, { fill: colours[i % 2] }),
      );
    }
  });
  return shapes;
}

const shield: SubTheme = {
  id: 'shield',
  name: 'Shield',
  swatch: ['#1d3a8a', '#d62828'],
  qr: { foreground: '#0b1f4d', background: '#ffffff', errorCorrection: 'M' },
  insets: even(0.1),
  captionBand: 0.12,
  caption: { family: arcade, weight: 400, color: '#ffffff' },
  suggestion: 'Ready for duty',
  decorate(context) {
    const w = context.width;
    const edge = thinnestEdge(context);
    const stripe = Math.max(4, Math.round(edge * 0.32));
    const shapes: Shape[] = [
      ring(context, linear(0, 0, 0, context.height, '#24459e', '#16306f')),
      ...edgeStripes(context, ['#d62828', '#ffffff'], stripe),
    ];
    for (const [x, y] of clearPoints(
      context,
      perimeterPoints(context, stripe + edge * 0.3, edge * 0.9),
      edge * 0.18,
    )) {
      shapes.push(star(x, y, edge * 0.16, 0.42, 5, '#ffffff'));
    }
    const top = context.edges.top;
    if (top.height >= edge) {
      shapes.push(
        ...badge(
          w / 2,
          top.y + top.height / 2 - edge * 0.05,
          Math.min(top.height * 0.55, w * 0.08),
          '#d62828',
          '#ffffff',
          '#ffffff',
        ),
      );
    }
    return shapes;
  },
};

const iron: SubTheme = {
  id: 'iron',
  name: 'Iron',
  swatch: ['#9b1c1c', '#d4a017'],
  qr: { foreground: '#3b0a0a', background: '#fff8e7', errorCorrection: 'M' },
  insets: even(0.1),
  captionBand: 0.12,
  caption: { family: arcade, weight: 400, color: '#ffd166' },
  suggestion: 'Suit up & scan',
  decorate(context) {
    const w = context.width;
    const h = context.height;
    const edge = thinnestEdge(context);
    const shapes: Shape[] = [ring(context, linear(0, 0, w, h, '#a3201f', '#6e1313'))];
    // Angular gold plates in each corner square, like overlapping armour.
    const plate = edge * 0.95;
    const corners: [number, number, number, number][] = [
      [0, 0, 1, 1],
      [w, 0, -1, 1],
      [0, h, 1, -1],
      [w, h, -1, -1],
    ];
    for (const [cx, cy, dx, dy] of corners) {
      shapes.push(
        path()
          .polygon([
            [cx, cy],
            [cx + dx * plate, cy],
            [cx + dx * plate, cy + dy * plate * 0.45],
            [cx + dx * plate * 0.45, cy + dy * plate],
            [cx, cy + dy * plate],
          ])
          .shape({ fill: '#d4a017', stroke: '#7a5200', lineWidth: Math.max(1, w * 0.004) }),
      );
    }
    // Panel seams with rivets.
    const seam = edge * 0.45;
    shapes.push(
      outline(
        { x: seam, y: seam, width: w - 2 * seam, height: h - 2 * seam },
        Math.max(2, Math.round(w * 0.006)),
        '#4d0c0c',
      ),
    );
    for (const [x, y] of clearPoints(
      context,
      perimeterPoints(context, seam, edge * 0.8),
      edge * 0.1,
    )) {
      shapes.push(
        circle(x, y, Math.max(2, edge * 0.07), {
          fill: '#f0c75e',
          stroke: '#7a5200',
          lineWidth: 1,
        }),
      );
    }
    return shapes;
  },
};

const thunder: SubTheme = {
  id: 'thunder',
  name: 'Thunder',
  swatch: ['#0f1c3f', '#cfd8e3'],
  qr: { foreground: '#0f1c3f', background: '#f4f7fb', errorCorrection: 'M' },
  insets: even(0.1),
  captionBand: 0.12,
  caption: { family: arcade, weight: 400, color: '#e3e9f2' },
  suggestion: 'Bring the storm',
  decorate(context) {
    const edge = thinnestEdge(context);
    const shapes: Shape[] = [ring(context, linear(0, 0, 0, context.height, '#1c2f66', '#0b1530'))];
    for (const [x, y] of scatter(context, 26, edge * 0.06)) {
      shapes.push(circle(x, y, Math.max(1, edge * 0.05), { fill: '#7f93b8', opacity: 0.7 }));
    }
    for (const [x, y] of scatter(context, 12, edge * 0.36)) {
      shapes.push(bolt(x, y, edge * 0.7, '#dfe6ef', '#8fa0bb'));
    }
    return shapes;
  },
};

const gamma: SubTheme = {
  id: 'gamma',
  name: 'Gamma',
  swatch: ['#2f7d32', '#0e3b12'],
  qr: { foreground: '#10350f', background: '#f3fff0', errorCorrection: 'M' },
  insets: even(0.1),
  captionBand: 0.12,
  caption: { family: arcade, weight: 400, color: '#ecffe0', stroke: '#0e3b12' },
  suggestion: 'Smash that scan',
  decorate(context) {
    const w = context.width;
    const h = context.height;
    const edge = thinnestEdge(context);
    const shapes: Shape[] = [ring(context, linear(0, 0, w, h, '#3c9a40', '#1b5e20'))];
    // Cracked ground spreading in from the edges.
    const starts = perimeterPoints(context, 1, edge * 1.4);
    for (const [x, y] of starts) {
      const angle = Math.atan2(h / 2 - y, w / 2 - x) + (context.random() - 0.5);
      const line = crack(context, x, y, angle, edge * 1.1, '#0e3b12', Math.max(1.5, w * 0.005));
      if (line) shapes.push(line);
    }
    for (const [x, y] of scatter(context, 30, edge * 0.06)) {
      shapes.push(
        circle(x, y, Math.max(1.5, edge * 0.05 + context.random() * edge * 0.04), {
          fill: '#a5d6a7',
          opacity: 0.8,
        }),
      );
    }
    return shapes;
  },
};

const SEGMENTS: Record<string, string> = {
  '0': 'abcdef',
  '1': 'bc',
  '2': 'abged',
  '3': 'abgcd',
  '4': 'fgbc',
  '5': 'afgcd',
  '6': 'afgedc',
  '7': 'abc',
  '8': 'abcdefg',
  '9': 'abcdfg',
};

// Seven-segment digits drawn as bars, so the "countdown" needs no font.
function digit(value: string, x: number, y: number, height: number, colour: string): Shape[] {
  const width = height * 0.55;
  const t = Math.max(1.5, height * 0.13);
  const half = height / 2;
  const bars: Record<string, Rect> = {
    a: { x: x + t, y, width: width - 2 * t, height: t },
    b: { x: x + width - t, y: y + t, width: t, height: half - 1.5 * t },
    c: { x: x + width - t, y: y + half + 0.5 * t, width: t, height: half - 1.5 * t },
    d: { x: x + t, y: y + height - t, width: width - 2 * t, height: t },
    e: { x, y: y + half + 0.5 * t, width: t, height: half - 1.5 * t },
    f: { x, y: y + t, width: t, height: half - 1.5 * t },
    g: { x: x + t, y: y + half - t / 2, width: width - 2 * t, height: t },
  };
  return Array.from(SEGMENTS[value] ?? '', (key) => {
    const bar = bars[key];
    return bar ? rect(bar.x, bar.y, bar.width, bar.height, { fill: colour, radius: t / 3 }) : null;
  }).filter((shape): shape is Shape => shape !== null);
}

function countdown(context: FrameContext, text: string, band: Rect): Shape[] {
  const height = band.height * 0.5;
  const charWidth = height * 0.75;
  const totalWidth = Array.from(text).reduce(
    (sum, char) => sum + (char === ':' ? charWidth * 0.45 : charWidth),
    0,
  );
  let x = context.width / 2 - totalWidth / 2;
  const y = band.y + (band.height - height) / 2;
  const glow: Shape = {
    kind: 'rect',
    x: x - height * 0.2,
    y: y - height * 0.15,
    width: totalWidth + height * 0.4,
    height: height * 1.3,
    radius: height * 0.2,
    fill: '#1a0000',
    opacity: 0.55,
  };
  const shapes: Shape[] = [glow];
  for (const char of text) {
    if (char === ':') {
      shapes.push(
        circle(x + charWidth * 0.18, y + height * 0.3, height * 0.07, { fill: '#ff4d2e' }),
        circle(x + charWidth * 0.18, y + height * 0.7, height * 0.07, { fill: '#ff4d2e' }),
      );
      x += charWidth * 0.45;
    } else {
      shapes.push(...digit(char, x, y, height, '#ff4d2e'));
      x += charWidth;
    }
  }
  return shapes;
}

const doomsday: SubTheme = {
  id: 'doomsday',
  name: 'Doomsday',
  swatch: ['#5c0b0b', '#ff7b2e'],
  qr: { foreground: '#2b0505', background: '#fff4ec', errorCorrection: 'M' },
  insets: { top: 0.14, right: 0.08, bottom: 0.12, left: 0.08 },
  captionBand: 0.12,
  caption: { family: arcade, weight: 400, color: '#ffb347', stroke: '#2b0505' },
  suggestion: 'The clock is ticking',
  decorate(context) {
    const w = context.width;
    const h = context.height;
    const edge = thinnestEdge(context);
    const shapes: Shape[] = [
      ring(context, linear(0, 0, 0, h, '#1f0303', '#6b1010', '#b8361a', '#ff7b2e')),
    ];
    // Embers drifting through the sky.
    for (const [x, y] of scatter(context, 22, edge * 0.05)) {
      shapes.push(circle(x, y, Math.max(1, edge * 0.04), { fill: '#ffcf7a', opacity: 0.75 }));
    }
    // Cracked earth along the bottom, with glowing fissures.
    const ground = context.edges.bottom;
    const groundTop = ground.y + ground.height * 0.45;
    const rim = path().moveTo(0, h);
    const steps = 10;
    for (let i = 0; i <= steps; i++)
      rim.lineTo((w * i) / steps, groundTop + (context.random() - 0.5) * ground.height * 0.15);
    rim.lineTo(w, h).close();
    shapes.push(rim.shape({ fill: '#1a0d08' }));
    for (let i = 0; i < 7; i++) {
      const x = (w * (i + 0.5)) / 7;
      const fissure = compact([
        crack(
          context,
          x,
          h - 1,
          -Math.PI / 2 + (context.random() - 0.5) * 0.8,
          ground.height * 0.45,
          '#ff6a00',
          Math.max(1.5, w * 0.004),
        ),
      ]);
      shapes.push(...fissure);
    }
    const top = context.edges.top;
    if (top.height > edge * 0.8) shapes.push(...countdown(context, '00:00:07', top));
    return shapes;
  },
};

export const superhero: Theme = {
  id: 'superhero',
  name: 'Superhero',
  subThemes: [shield, iron, thunder, gamma, doomsday],
  showcase: 'doomsday',
};
