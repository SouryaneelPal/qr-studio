import { circle, linear, path, rect, type Shape } from '../shapes';
import {
  clearPoints,
  flower,
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
const filmy = CAPTION_FAMILIES.filmy;

const marquee: SubTheme = {
  id: 'marquee',
  name: 'Filmy marquee',
  swatch: ['#7a0019', '#ffe066'],
  qr: { foreground: '#3a000c', background: '#fffaf0', errorCorrection: 'M' },
  insets: even(0.11),
  captionBand: 0.12,
  caption: { family: filmy, weight: 400, color: '#ffd54a' },
  suggestion: 'Lights, camera, scan!',
  decorate(context) {
    const w = context.width;
    const edge = thinnestEdge(context);
    const shapes: Shape[] = [ring(context, linear(0, 0, 0, context.height, '#8f0020', '#5c0013'))];
    const goldLine = Math.max(2, Math.round(w * 0.006));
    const at = Math.round(edge * 0.12);
    shapes.push(
      outline(
        { x: at, y: at, width: w - 2 * at, height: context.height - 2 * at },
        goldLine,
        '#d4a017',
      ),
    );
    // Bulbs round the frame, each with a soft glow.
    const bulb = edge * 0.13;
    for (const [x, y] of clearPoints(
      context,
      perimeterPoints(context, edge * 0.5, edge * 0.62),
      bulb * 1.8,
    )) {
      shapes.push(
        circle(x, y, bulb * 1.8, { fill: '#fff3b0', opacity: 0.25 }),
        circle(x, y, bulb, {
          fill: '#ffe066',
          stroke: '#c99700',
          lineWidth: Math.max(1, bulb * 0.2),
        }),
      );
    }
    return shapes;
  },
};

function paisley(cx: number, cy: number, size: number, colour: string, flip: boolean): Shape[] {
  const s = size / 2;
  const d = flip ? -1 : 1;
  return [
    path()
      .moveTo(cx, cy + s)
      .cubicTo(cx - d * s * 1.1, cy + s * 0.6, cx - d * s * 0.9, cy - s * 0.6, cx, cy - s * 0.55)
      .cubicTo(cx + d * s * 0.5, cy - s * 0.5, cx + d * s * 0.7, cy - s, cx + d * s * 0.3, cy - s)
      .cubicTo(cx + d * s * 0.9, cy - s * 0.4, cx + d * s * 0.8, cy + s * 0.6, cx, cy + s)
      .close()
      .shape({ fill: '#fde3b0', stroke: colour, lineWidth: Math.max(1, s * 0.12) }),
    circle(cx, cy + s * 0.15, s * 0.22, { fill: colour }),
  ];
}

const marigold: SubTheme = {
  id: 'marigold',
  name: 'Marigold mehendi',
  swatch: ['#fff1d6', '#ff9f1c'],
  qr: { foreground: '#4a2200', background: '#fffdf6', errorCorrection: 'M' },
  insets: even(0.11),
  captionBand: 0.12,
  caption: { family: filmy, weight: 400, color: '#7b3f00' },
  suggestion: 'Shubh aarambh',
  decorate(context) {
    const edge = thinnestEdge(context);
    const shapes: Shape[] = [ring(context, '#fff1d6')];
    // A string of marigolds round the edge, paisleys tucked between them.
    const size = edge * 0.4;
    clearPoints(context, perimeterPoints(context, edge * 0.3, edge * 0.55), size * 0.55).forEach(
      ([x, y], i) => {
        shapes.push(...flower(x, y, size, 10, i % 2 === 0 ? '#ff9f1c' : '#ffc93c', '#e65100'));
      },
    );
    clearPoints(context, perimeterPoints(context, edge * 0.74, edge * 1.3), edge * 0.18).forEach(
      ([x, y], i) => {
        shapes.push(...paisley(x, y, edge * 0.3, '#7b3f00', i % 2 === 1));
      },
    );
    for (const [x, y] of scatter(context, 30, edge * 0.04))
      shapes.push(circle(x, y, Math.max(1, edge * 0.025), { fill: '#7b3f00', opacity: 0.6 }));
    return shapes;
  },
};

const poster: SubTheme = {
  id: 'poster',
  name: 'Hand-painted poster',
  swatch: ['#ffd400', '#e63946'],
  qr: { foreground: '#1b1b1b', background: '#ffffff', errorCorrection: 'M' },
  insets: even(0.11),
  captionBand: 0.12,
  caption: { family: filmy, weight: 400, color: '#b00020', stroke: '#1b1b1b' },
  suggestion: 'Full filmy vibes',
  decorate(context) {
    const w = context.width;
    const edge = thinnestEdge(context);
    const shapes: Shape[] = [ring(context, '#ffd400')];
    // Bunting flags along the top, a ribbon of stars along the bottom.
    const top = context.edges.top;
    const flag = top.height * 0.55;
    for (let x = 0, i = 0; x < w; x += flag * 0.9, i++) {
      shapes.push(
        path()
          .polygon([
            [x, top.y + top.height * 0.12],
            [x + flag * 0.8, top.y + top.height * 0.12],
            [x + flag * 0.4, top.y + top.height * 0.12 + flag],
          ])
          .shape({
            fill: i % 2 === 0 ? '#e63946' : '#1d8a8a',
            stroke: '#1b1b1b',
            lineWidth: Math.max(1, w * 0.003),
          }),
      );
    }
    const bottom = context.edges.bottom;
    shapes.push(
      rect(0, bottom.y + bottom.height * 0.3, w, bottom.height * 0.4, {
        fill: '#1d8a8a',
        stroke: '#1b1b1b',
        lineWidth: Math.max(1.5, w * 0.004),
      }),
    );
    for (let x = edge * 0.4; x < w; x += edge * 0.8)
      shapes.push(
        star(x, bottom.y + bottom.height * 0.5, bottom.height * 0.13, 0.45, 5, '#ffd400'),
      );
    // Halftone dots down the sides.
    for (const band of [context.edges.left, context.edges.right]) {
      for (let y = band.y + edge * 0.2; y < band.y + band.height; y += edge * 0.22) {
        for (let k = 0; k < 3; k++) {
          const x = band.x + band.width * (0.25 + k * 0.25);
          const r = edge * 0.035 * (1 + Math.sin(y / (edge * 0.6) + k));
          if (r > 0.5 && isClear(context, x, y, r))
            shapes.push(circle(x, y, r, { fill: '#e63946' }));
        }
      }
    }
    shapes.push(
      outline(
        { x: 0, y: 0, width: w, height: context.height },
        Math.max(3, Math.round(w * 0.012)),
        '#1b1b1b',
      ),
    );
    return shapes;
  },
};

function diamond(cx: number, cy: number, size: number, fill: string): Shape {
  const s = size / 2;
  return path()
    .polygon([
      [cx, cy - s],
      [cx + s, cy],
      [cx, cy + s],
      [cx - s, cy],
    ])
    .shape({ fill });
}

function mandala(context: FrameContext, cx: number, cy: number, size: number): Shape[] {
  if (!isClear(context, cx, cy, size / 2)) return [];
  return [
    ...flower(cx, cy, size, 12, '#e91e63', '#ff9800'),
    ...flower(cx, cy, size * 0.6, 8, '#009688', '#ffeb3b'),
    circle(cx, cy, size * 0.08, { fill: '#7b1fa2' }),
  ];
}

const rangoli: SubTheme = {
  id: 'rangoli',
  name: 'Rangoli',
  swatch: ['#fdf0e0', '#e91e63'],
  qr: { foreground: '#2b0a3d', background: '#ffffff', errorCorrection: 'M' },
  insets: even(0.12),
  captionBand: 0.13,
  caption: { family: filmy, weight: 400, color: '#7b1fa2' },
  suggestion: 'शुभ आरंभ',
  decorate(context) {
    const w = context.width;
    const h = context.height;
    const edge = thinnestEdge(context);
    const shapes: Shape[] = [ring(context, '#fdf0e0')];
    const colours = ['#e91e63', '#ff9800', '#009688', '#7b1fa2'];
    clearPoints(context, perimeterPoints(context, edge * 0.5, edge * 0.42), edge * 0.16).forEach(
      ([x, y], i) => {
        shapes.push(diamond(x, y, edge * 0.3, colours[i % colours.length] ?? '#e91e63'));
      },
    );
    for (const [x, y] of clearPoints(
      context,
      perimeterPoints(context, edge * 0.15, edge * 0.42),
      edge * 0.06,
    )) {
      shapes.push(circle(x, y, edge * 0.05, { fill: '#ffc107' }));
    }
    const size = edge * 0.8;
    for (const [x, y] of [
      [edge * 0.5, edge * 0.5],
      [w - edge * 0.5, edge * 0.5],
      [edge * 0.5, h - edge * 0.5],
      [w - edge * 0.5, h - edge * 0.5],
    ] as [number, number][]) {
      shapes.push(...mandala(context, x, y, size));
    }
    return shapes;
  },
};

function diya(cx: number, cy: number, size: number): Shape[] {
  const s = size / 2;
  return [
    circle(cx, cy - s * 0.55, s * 0.55, { fill: '#ffd54f', opacity: 0.25 }),
    path()
      .moveTo(cx - s, cy)
      .lineTo(cx + s, cy)
      .quadTo(cx + s * 0.6, cy + s * 0.75, cx, cy + s * 0.75)
      .quadTo(cx - s * 0.6, cy + s * 0.75, cx - s, cy)
      .close()
      .shape({ fill: '#e8710a', stroke: '#8a3b00', lineWidth: Math.max(1, s * 0.08) }),
    path()
      .moveTo(cx, cy - s * 0.95)
      .quadTo(cx + s * 0.32, cy - s * 0.35, cx, cy - s * 0.08)
      .quadTo(cx - s * 0.32, cy - s * 0.35, cx, cy - s * 0.95)
      .close()
      .shape({ fill: '#ffd54f' }),
  ];
}

const discoDiwali: SubTheme = {
  id: 'disco-diwali',
  name: 'Disco Diwali',
  swatch: ['#3b1170', '#ffd700'],
  qr: { foreground: '#2a0845', background: '#fffaf2', errorCorrection: 'M' },
  insets: { top: 0.1, right: 0.09, bottom: 0.16, left: 0.09 },
  captionBand: 0.12,
  caption: { family: filmy, weight: 400, color: '#ffd700' },
  suggestion: 'Happy Diwali ✨',
  decorate(context) {
    const w = context.width;
    const edge = thinnestEdge(context);
    const shapes: Shape[] = [
      ring(context, linear(0, 0, w, context.height, '#2a0845', '#5b2a9a', '#2a0845')),
    ];
    const colours = ['#ffd700', '#ff7ac8', '#7ae7ff'];
    scatter(context, 30, edge * 0.12).forEach(([x, y], i) =>
      shapes.push(
        twinkle(
          x,
          y,
          edge * (0.06 + context.random() * 0.06),
          colours[i % colours.length] ?? '#ffd700',
        ),
      ),
    );
    // A row of lamps in the bottom band.
    const bottom = context.edges.bottom;
    const size = Math.min(bottom.height * 0.5, w * 0.08);
    for (let x = size; x < w - size / 2; x += size * 1.6) {
      const y = bottom.y + bottom.height * 0.55;
      if (isClear(context, x, y, size * 0.6)) shapes.push(...diya(x, y, size));
    }
    return shapes;
  },
};

export const bollywood: Theme = {
  id: 'bollywood',
  name: 'Bollywood',
  subThemes: [marquee, marigold, poster, rangoli, discoDiwali],
  showcase: 'marquee',
};
