import type { Rect } from '../plan';
import { circle, linear, path, rect, type Shape } from '../shapes';
import { clearPoints, isClear, outline, perimeterPoints, ring, scatter, thinnestEdge } from './kit';
import { CAPTION_FAMILIES, type FrameContext, type SubTheme, type Theme } from './types';

const even = (value: number) => ({ top: value, right: value, bottom: value, left: value });
const arcade = CAPTION_FAMILIES.arcade;

// The four frame bands as rectangles that never touch the code or the caption strip.
function frameBands(context: FrameContext): Rect[] {
  return [context.edges.top, context.edges.bottom, context.edges.left, context.edges.right].filter(
    (band) => band.width > 0 && band.height > 0,
  );
}

function rivet(x: number, y: number, r: number): Shape[] {
  return [
    circle(x, y, r, { fill: '#5a3a2a', stroke: '#2d1a10', lineWidth: Math.max(1, r * 0.25) }),
    circle(x - r * 0.3, y - r * 0.3, r * 0.35, { fill: '#c9a48a', opacity: 0.8 }),
  ];
}

const rust: SubTheme = {
  id: 'rust',
  name: 'Rusted metal',
  swatch: ['#8a3b12', '#c9a48a'],
  qr: { foreground: '#2a1205', background: '#fff3e6', errorCorrection: 'M' },
  insets: even(0.1),
  captionBand: 0.12,
  caption: { family: arcade, weight: 400, color: '#ffe0c2', stroke: '#2a1205' },
  suggestion: 'Built to last',
  decorate(context) {
    const edge = thinnestEdge(context);
    const shapes: Shape[] = [
      ring(context, linear(0, 0, context.width, context.height, '#9a4a1c', '#6b2f12', '#8a3b12')),
    ];
    // Procedural rust: seeded specks of oxide, pitting and bare metal.
    const palette = ['#c0622b', '#4a1e0a', '#d98b4a', '#3a2418', '#7d8a8f'];
    const speck = 1 + edge * 0.06;
    for (const [x, y] of scatter(context, 700, speck * 1.5, 4000)) {
      const size = 1 + context.random() * (speck - 1);
      shapes.push(
        rect(x, y, size, size * (0.5 + context.random()), {
          fill: palette[Math.floor(context.random() * palette.length)] ?? '#c0622b',
          opacity: 0.25 + context.random() * 0.5,
        }),
      );
    }
    for (const [x, y] of clearPoints(
      context,
      perimeterPoints(context, edge * 0.5, edge * 1.6),
      edge * 0.14,
    )) {
      shapes.push(...rivet(x, y, edge * 0.11));
    }
    return shapes;
  },
};

const neon: SubTheme = {
  id: 'neon',
  name: 'Neon arcade',
  swatch: ['#14002b', '#ff2fd6'],
  qr: { foreground: '#14002b', background: '#fdf7ff', errorCorrection: 'M' },
  insets: { top: 0.09, right: 0.09, bottom: 0.2, left: 0.09 },
  captionBand: 0.12,
  caption: { family: arcade, weight: 400, color: '#3df5ff' },
  suggestion: 'Insert coin',
  decorate(context) {
    const w = context.width;
    const edge = thinnestEdge(context);
    const shapes: Shape[] = [ring(context, '#14002b')];
    for (const [x, y] of scatter(context, 30, 2))
      shapes.push(circle(x, y, Math.max(1, edge * 0.03), { fill: '#ffffff', opacity: 0.6 }));
    // A striped sunset over a perspective grid, in the bottom band.
    const ground = context.edges.bottom;
    const horizon = ground.y + ground.height * 0.55;
    const sunR = ground.height * 0.38;
    shapes.push(
      circle(w / 2, horizon, sunR, {
        fill: linear(0, horizon - sunR, 0, horizon, '#ffd23f', '#ff2fd6'),
      }),
    );
    for (let i = 1; i <= 3; i++)
      shapes.push(
        rect(w / 2 - sunR, horizon - sunR * (i * 0.22), 2 * sunR, Math.max(1, sunR * 0.06 * i), {
          fill: '#14002b',
        }),
      );
    shapes.push(rect(0, horizon, w, ground.y + ground.height - horizon, { fill: '#25004d' }));
    const line = Math.max(1, w * 0.003);
    for (let i = -8; i <= 8; i++) {
      shapes.push(
        path()
          .moveTo(w / 2 + i * w * 0.02, horizon)
          .lineTo(w / 2 + i * w * 0.12, ground.y + ground.height)
          .shape({ stroke: '#ff2fd6', lineWidth: line, opacity: 0.85 }),
      );
    }
    for (let k = 1; k <= 4; k++) {
      const y = horizon + (ground.y + ground.height - horizon) * (k / 4) ** 1.6;
      shapes.push(rect(0, y, w, line, { fill: '#ff2fd6', opacity: 0.85 }));
    }
    // Neon tubes up the sides.
    for (const band of [context.edges.left, context.edges.right]) {
      const x = band.x + band.width / 2;
      shapes.push(
        rect(x - line * 1.5, band.y + band.height * 0.1, line * 3, band.height * 0.8, {
          fill: '#3df5ff',
          radius: line,
        }),
      );
    }
    return shapes;
  },
};

function reel(cx: number, cy: number, r: number): Shape[] {
  const shapes: Shape[] = [
    circle(cx, cy, r, { fill: '#f4e9d0' }),
    circle(cx, cy, r * 0.42, { fill: '#2b2b2b' }),
  ];
  for (let i = 0; i < 6; i++) {
    const angle = (i * Math.PI) / 3;
    shapes.push(
      rect(
        cx + Math.cos(angle) * r * 0.28 - r * 0.05,
        cy + Math.sin(angle) * r * 0.28 - r * 0.05,
        r * 0.1,
        r * 0.1,
        { fill: '#f4e9d0' },
      ),
    );
  }
  return shapes;
}

const cassette: SubTheme = {
  id: 'cassette',
  name: 'Cassette label',
  swatch: ['#2b2b2b', '#ff8a3d'],
  qr: { foreground: '#1e1e1e', background: '#fffaf0', errorCorrection: 'M' },
  insets: { top: 0.12, right: 0.08, bottom: 0.2, left: 0.08 },
  captionBand: 0.12,
  caption: { family: arcade, weight: 400, color: '#2b2b2b', band: '#f4e9d0' },
  suggestion: 'Side A',
  decorate(context) {
    const w = context.width;
    const h = context.height;
    const edge = thinnestEdge(context);
    const shapes: Shape[] = [
      ring(context, '#d9d2c3'),
      ring(context, '#2b2b2b', { x: 0, y: 0, width: w, height: h }, w * 0.05),
    ];
    // Label stripes across the top band.
    const top = context.edges.top;
    const stripe = top.height * 0.18;
    shapes.push(
      rect(edge * 0.4, top.y + top.height * 0.25, w - edge * 0.8, stripe, { fill: '#ff8a3d' }),
    );
    shapes.push(
      rect(edge * 0.4, top.y + top.height * 0.25 + stripe, w - edge * 0.8, stripe, {
        fill: '#1fa39a',
      }),
    );
    // Tape window with two reels in the bottom band.
    const bottom = context.edges.bottom;
    const windowBox = {
      x: w * 0.22,
      y: bottom.y + bottom.height * 0.18,
      width: w * 0.56,
      height: bottom.height * 0.62,
    };
    shapes.push(
      rect(windowBox.x, windowBox.y, windowBox.width, windowBox.height, {
        fill: '#4a4a4a',
        radius: windowBox.height * 0.5,
      }),
    );
    const r = windowBox.height * 0.4;
    for (const cx of [
      windowBox.x + windowBox.height * 0.5,
      windowBox.x + windowBox.width - windowBox.height * 0.5,
    ])
      shapes.push(...reel(cx, windowBox.y + windowBox.height / 2, r));
    shapes.push(
      rect(
        windowBox.x + windowBox.height,
        windowBox.y + windowBox.height * 0.4,
        windowBox.width - 2 * windowBox.height,
        windowBox.height * 0.2,
        { fill: '#5c3b1e' },
      ),
    );
    // Corner screws.
    const screw = Math.max(2, edge * 0.1);
    for (const [x, y] of [
      [edge * 0.35, edge * 0.35],
      [w - edge * 0.35, edge * 0.35],
      [edge * 0.35, h - edge * 0.35],
      [w - edge * 0.35, h - edge * 0.35],
    ] as [number, number][]) {
      if (isClear(context, x, y, screw))
        shapes.push(
          circle(x, y, screw, { fill: '#9a9a9a' }),
          rect(x - screw * 0.7, y - screw * 0.12, screw * 1.4, screw * 0.24, { fill: '#555555' }),
        );
    }
    return shapes;
  },
};

const vhs: SubTheme = {
  id: 'vhs',
  name: 'VHS glitch',
  swatch: ['#101018', '#ff3b5c'],
  qr: { foreground: '#101018', background: '#f5f5ff', errorCorrection: 'M' },
  insets: even(0.1),
  captionBand: 0.12,
  caption: { family: arcade, weight: 400, color: '#e8e8ff', stroke: '#2a2aff' },
  suggestion: 'Tracking adjusted',
  decorate(context) {
    const shapes: Shape[] = [ring(context, '#101018')];
    const bands = frameBands(context);
    // Scan lines, band by band so they never cross the code.
    for (const band of bands) {
      for (let y = band.y + 1; y < band.y + band.height - 1; y += 4)
        shapes.push(rect(band.x, y, band.width, 1, { fill: '#ffffff', opacity: 0.07 }));
    }
    // Seeded RGB tearing: offset red, green and cyan slivers.
    const colours = ['#ff3b5c', '#3dffb0', '#3dd6ff'];
    for (let i = 0; i < 40; i++) {
      const band = bands[Math.floor(context.random() * bands.length)];
      if (!band) continue;
      const height = 1 + context.random() * band.height * 0.08;
      const y = band.y + context.random() * (band.height - height);
      const width = band.width * (0.15 + context.random() * 0.5);
      const x = band.x + context.random() * (band.width - width);
      const colour = colours[i % colours.length] ?? '#ff3b5c';
      shapes.push(rect(x, y, width, height, { fill: colour, opacity: 0.55 }));
      const shift = Math.min(band.x + band.width - x - width, 2 + context.random() * 6);
      if (shift > 0)
        shapes.push(
          rect(x + shift, y, width, height, {
            fill: colours[(i + 1) % colours.length] ?? '#3dd6ff',
            opacity: 0.35,
          }),
        );
    }
    return shapes;
  },
};

function speaker(cx: number, cy: number, r: number): Shape[] {
  const shapes: Shape[] = [
    circle(cx, cy, r, { fill: '#1a1a1a', stroke: '#c7c7c7', lineWidth: Math.max(1.5, r * 0.08) }),
  ];
  // Grille: a grid of dots inside the cone.
  const step = Math.max(3, r * 0.18);
  for (let y = cy - r; y <= cy + r; y += step) {
    for (let x = cx - r; x <= cx + r; x += step) {
      if (Math.hypot(x - cx, y - cy) < r * 0.82)
        shapes.push(circle(x, y, Math.max(0.8, step * 0.22), { fill: '#6e6e6e' }));
    }
  }
  shapes.push(circle(cx, cy, r * 0.22, { fill: '#c7c7c7' }));
  return shapes;
}

const boombox: SubTheme = {
  id: 'boombox',
  name: 'Boombox',
  swatch: ['#2b2b2b', '#ffcf33'],
  qr: { foreground: '#1a1a1a', background: '#f7f7f7', errorCorrection: 'M' },
  insets: { top: 0.14, right: 0.2, bottom: 0.08, left: 0.2 },
  captionBand: 0.12,
  caption: { family: arcade, weight: 400, color: '#ffcf33' },
  suggestion: 'Turn it up',
  decorate(context) {
    const w = context.width;
    const shapes: Shape[] = [
      ring(context, '#d6d6d6'),
      ring(
        context,
        linear(0, 0, 0, context.height, '#3a3a3a', '#232323'),
        { x: 0, y: 0, width: w, height: context.height },
        w * 0.04,
      ),
    ];
    for (const band of [context.edges.left, context.edges.right]) {
      const r = Math.min(band.width * 0.4, band.height * 0.22);
      const cx = band.x + band.width / 2;
      shapes.push(
        ...speaker(cx, band.y + band.height * 0.3, r),
        ...speaker(cx, band.y + band.height * 0.72, r * 0.75),
      );
    }
    // Carry handle and buttons along the top.
    const top = context.edges.top;
    const handleY = top.y + top.height * 0.32;
    shapes.push(
      path()
        .moveTo(w * 0.3, top.y + top.height * 0.85)
        .lineTo(w * 0.3, handleY + top.height * 0.1)
        .quadTo(w * 0.3, handleY, w * 0.35, handleY)
        .lineTo(w * 0.65, handleY)
        .quadTo(w * 0.7, handleY, w * 0.7, handleY + top.height * 0.1)
        .lineTo(w * 0.7, top.y + top.height * 0.85)
        .shape({ stroke: '#c7c7c7', lineWidth: Math.max(2, top.height * 0.1), lineCap: 'round' }),
    );
    for (let i = 0; i < 4; i++) {
      shapes.push(
        rect(w * 0.38 + i * w * 0.065, top.y + top.height * 0.55, w * 0.05, top.height * 0.2, {
          fill: i === 0 ? '#ff3b3b' : '#9a9a9a',
          radius: 2,
        }),
      );
    }
    shapes.push(
      outline(
        { x: 0, y: 0, width: w, height: context.height },
        Math.max(2, Math.round(w * 0.006)),
        '#c7c7c7',
        w * 0.04,
      ),
    );
    return shapes;
  },
};

export const retro: Theme = {
  id: 'retro',
  name: "Retro '80s",
  subThemes: [rust, neon, cassette, vhs, boombox],
  showcase: 'neon',
};
