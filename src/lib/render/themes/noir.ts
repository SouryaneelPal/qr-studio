import { circle, linear, path, rect, type Shape } from '../shapes';
import { clearPoints, isClear, outline, perimeterPoints, ring, thinnestEdge } from './kit';
import { CAPTION_FAMILIES, type FrameContext, type SubTheme, type Theme } from './types';

const even = (value: number) => ({ top: value, right: value, bottom: value, left: value });
const display = CAPTION_FAMILIES.display;

const CORNERS = [
  [0, 0, 1, 1],
  [1, 0, -1, 1],
  [0, 1, 1, -1],
  [1, 1, -1, -1],
] as const;

// Art-deco corner: nested stepped brackets drawn as thin bars.
function decoCorners(context: FrameContext, colour: string): Shape[] {
  const w = context.width;
  const h = context.height;
  const edge = thinnestEdge(context);
  const bar = Math.max(1.5, w * 0.004);
  const shapes: Shape[] = [];
  for (const [fx, fy, dx, dy] of CORNERS) {
    const ox = fx * w;
    const oy = fy * h;
    for (let step = 0; step < 3; step++) {
      const at = edge * (0.25 + step * 0.17);
      const reach = edge * (0.95 - step * 0.2);
      const x = ox + dx * at;
      const y = oy + dy * at;
      shapes.push(
        rect(Math.min(x, x + dx * reach), y - bar / 2, reach, bar, { fill: colour }),
        rect(x - bar / 2, Math.min(y, y + dy * reach), bar, reach, { fill: colour }),
      );
    }
    shapes.push(circle(ox + dx * edge * 0.25, oy + dy * edge * 0.25, bar * 1.8, { fill: colour }));
  }
  return shapes;
}

function doubleRule(context: FrameContext, colour: string): Shape[] {
  const w = context.width;
  const edge = thinnestEdge(context);
  const line = Math.max(1.5, Math.round(w * 0.004));
  const full = { x: 0, y: 0, width: w, height: context.height };
  const at = (fraction: number) => {
    const by = Math.round(edge * fraction);
    return { x: by, y: by, width: full.width - 2 * by, height: full.height - 2 * by };
  };
  return [outline(at(0.12), line, colour), outline(at(0.2), line, colour)];
}

const noir: SubTheme = {
  id: 'noir',
  name: 'Noir',
  swatch: ['#0d0d0d', '#f2ead3'],
  qr: { foreground: '#0d0d0d', background: '#f7f1e1', errorCorrection: 'M' },
  insets: even(0.1),
  captionBand: 0.12,
  caption: { family: display, weight: 700, color: '#f2ead3' },
  suggestion: 'Strictly confidential',
  decorate: (context) => [
    ring(context, '#0d0d0d'),
    ...doubleRule(context, '#f2ead3'),
    ...decoCorners(context, '#f2ead3'),
  ],
};

const sepia: SubTheme = {
  id: 'sepia',
  name: 'Sepia film',
  swatch: ['#3b2a1a', '#e8d9b5'],
  qr: { foreground: '#2b1a0c', background: '#f6ecd8', errorCorrection: 'M' },
  insets: { top: 0.08, right: 0.13, bottom: 0.08, left: 0.13 },
  captionBand: 0.12,
  caption: { family: display, weight: 700, color: '#f3e3c3' },
  suggestion: 'Roll the reel',
  decorate(context) {
    const { left, right } = context.edges;
    const shapes: Shape[] = [ring(context, linear(0, 0, 0, context.height, '#4a3420', '#2e2013'))];
    // Film strips down both sides, with sprocket holes.
    for (const band of [left, right]) {
      const width = band.width * 0.62;
      const strip = {
        x: band.x === 0 ? 0 : context.width - width,
        y: 0,
        width,
        height: context.height,
      };
      shapes.push(rect(strip.x, strip.y, strip.width, strip.height, { fill: '#1a120b' }));
      const hole = strip.width * 0.42;
      for (let y = hole * 0.6; y < context.height - hole; y += hole * 1.7) {
        shapes.push(
          rect(strip.x + (strip.width - hole) / 2, y, hole, hole * 0.75, {
            fill: '#e8d9b5',
            radius: hole * 0.15,
          }),
        );
      }
    }
    // Faint scratches on the film.
    for (let i = 0; i < 6; i++) {
      const x = context.width * (0.2 + context.random() * 0.6);
      const top = context.edges.top;
      if (top.height > 4)
        shapes.push(
          rect(x, top.y + top.height * 0.15, 1, top.height * 0.6, {
            fill: '#e8d9b5',
            opacity: 0.25,
          }),
        );
    }
    return shapes;
  },
};

function rose(cx: number, cy: number, size: number): Shape[] {
  const r = size / 2;
  const shapes: Shape[] = [];
  // Stem and leaf below the bloom.
  shapes.push(
    path()
      .moveTo(cx, cy + r * 0.6)
      .quadTo(cx + r * 0.25, cy + r * 1.3, cx - r * 0.1, cy + r * 1.9)
      .shape({ stroke: '#3d6b35', lineWidth: Math.max(1.5, r * 0.12), lineCap: 'round' }),
    path()
      .moveTo(cx + r * 0.08, cy + r * 1.2)
      .quadTo(cx + r * 0.9, cy + r * 0.9, cx + r * 0.75, cy + r * 1.45)
      .quadTo(cx + r * 0.4, cy + r * 1.5, cx + r * 0.08, cy + r * 1.2)
      .close()
      .shape({ fill: '#4f8a43' }),
  );
  // Petals: overlapping circles from outside in, darker at the heart.
  const petals: [number, number, number, string][] = [
    [-0.45, 0.1, 0.55, '#8c0f24'],
    [0.45, 0.1, 0.55, '#8c0f24'],
    [0, 0.35, 0.55, '#a3132c'],
    [-0.2, -0.2, 0.5, '#b3122e'],
    [0.2, -0.2, 0.5, '#c21a36'],
    [0, -0.05, 0.38, '#d6264a'],
  ];
  for (const [dx, dy, pr, colour] of petals)
    shapes.push(circle(cx + dx * r, cy + dy * r, pr * r, { fill: colour }));
  shapes.push(
    path()
      .moveTo(cx - r * 0.2, cy - r * 0.05)
      .quadTo(cx, cy - r * 0.35, cx + r * 0.2, cy - r * 0.05)
      .shape({ stroke: '#5e0a18', lineWidth: Math.max(1, r * 0.08), lineCap: 'round' }),
  );
  return shapes;
}

const redRose: SubTheme = {
  id: 'rose',
  name: 'Red rose',
  swatch: ['#121212', '#c21a36'],
  qr: { foreground: '#1a0508', background: '#fbf3f3', errorCorrection: 'M' },
  insets: even(0.11),
  captionBand: 0.12,
  caption: { family: display, weight: 700, color: '#f2c4cb' },
  suggestion: 'A rose for you',
  decorate(context) {
    const w = context.width;
    const h = context.height;
    const edge = thinnestEdge(context);
    const shapes: Shape[] = [
      ring(context, '#121212'),
      outline(
        { x: edge * 0.15, y: edge * 0.15, width: w - edge * 0.3, height: h - edge * 0.3 },
        Math.max(1.5, Math.round(w * 0.004)),
        '#8c0f24',
      ),
    ];
    const size = edge * 0.5;
    const spots: [number, number][] = [
      [edge * 0.5, edge * 0.42],
      [w - edge * 0.5, h - edge * 0.85],
    ];
    for (const [x, y] of spots)
      if (isClear(context, x, y + size * 0.4, size * 1.05)) shapes.push(...rose(x, y, size));
    return shapes;
  },
};

// A quarter-circle fan with radiating ribs.
function fan(cx: number, cy: number, radius: number, colour: string, upward: boolean): Shape[] {
  const dir = upward ? -1 : 1;
  const shapes: Shape[] = [];
  const arc = path().moveTo(cx - radius, cy);
  arc
    .cubicTo(
      cx - radius,
      cy + dir * radius * 1.33,
      cx + radius,
      cy + dir * radius * 1.33,
      cx + radius,
      cy,
    )
    .close();
  shapes.push(arc.shape({ stroke: colour, lineWidth: Math.max(1, radius * 0.06) }));
  for (let i = 1; i < 6; i++) {
    const angle = (Math.PI * i) / 6;
    shapes.push(
      path()
        .moveTo(cx, cy)
        .lineTo(cx - Math.cos(angle) * radius * 0.95, cy + dir * Math.sin(angle) * radius * 0.95)
        .shape({ stroke: colour, lineWidth: Math.max(1, radius * 0.05) }),
    );
  }
  return shapes;
}

const goldDeco: SubTheme = {
  id: 'gold-deco',
  name: 'Gold deco',
  swatch: ['#111111', '#d4af37'],
  qr: { foreground: '#111111', background: '#fbf6e6', errorCorrection: 'M' },
  insets: even(0.11),
  captionBand: 0.12,
  caption: { family: display, weight: 700, color: '#e6c766' },
  suggestion: 'Members only',
  decorate(context) {
    const edge = thinnestEdge(context);
    const shapes: Shape[] = [ring(context, '#111111'), ...doubleRule(context, '#d4af37')];
    const radius = edge * 0.4;
    for (const band of [context.edges.top, context.edges.bottom]) {
      const upward = band.y > 0;
      const baseY = upward ? band.y + band.height * 0.82 : band.y + band.height * 0.18;
      for (let x = radius * 1.4; x < context.width - radius; x += radius * 2.1) {
        // The fan's control points reach 1.33 radii out, so clear that whole box.
        if (isClear(context, x, baseY + (upward ? -radius / 2 : radius / 2), radius * 0.9))
          shapes.push(...fan(x, baseY, radius, '#d4af37', upward));
      }
    }
    for (const [x, y] of clearPoints(
      context,
      perimeterPoints(context, edge * 0.5, edge * 1.2),
      edge * 0.08,
    )) {
      if (y > edge && y < context.height - edge)
        shapes.push(
          path()
            .polygon([
              [x, y - edge * 0.08],
              [x + edge * 0.06, y],
              [x, y + edge * 0.08],
              [x - edge * 0.06, y],
            ])
            .shape({ fill: '#d4af37' }),
        );
    }
    return shapes;
  },
};

const smokyJazz: SubTheme = {
  id: 'jazz',
  name: 'Smoky jazz',
  swatch: ['#3a3a3a', '#f5f5f5'],
  qr: { foreground: '#1a1a1a', background: '#f5f5f5', errorCorrection: 'M' },
  insets: { top: 0.1, right: 0.09, bottom: 0.14, left: 0.09 },
  captionBand: 0.12,
  caption: { family: display, weight: 700, color: '#ececec' },
  suggestion: 'Late night jazz',
  decorate(context) {
    const w = context.width;
    const shapes: Shape[] = [ring(context, linear(0, 0, 0, context.height, '#4a4a4a', '#1f1f1f'))];
    // Soft smoke curling up the sides.
    for (let i = 0; i < 5; i++) {
      const band = i % 2 === 0 ? context.edges.left : context.edges.right;
      const x = band.x + band.width * (0.3 + context.random() * 0.4);
      const curl = path().moveTo(x, context.height * (0.9 - i * 0.05));
      let y = context.height * (0.9 - i * 0.05);
      for (let k = 0; k < 4; k++) {
        const ny = y - context.height * 0.15;
        curl.quadTo(x + (k % 2 === 0 ? 1 : -1) * band.width * 0.2, (y + ny) / 2, x, ny);
        y = ny;
      }
      shapes.push(
        curl.shape({
          stroke: '#d0d0d0',
          lineWidth: Math.max(2, band.width * 0.12),
          opacity: 0.18,
          lineCap: 'round',
        }),
      );
    }
    // Piano keys along the bottom edge.
    const bottom = context.edges.bottom;
    const keysTop = bottom.y + bottom.height * 0.42;
    const keyHeight = bottom.y + bottom.height - keysTop - bottom.height * 0.12;
    const keyWidth = w / 22;
    for (let i = 0; i < 22; i++) {
      shapes.push(
        rect(i * keyWidth + 1, keysTop, keyWidth - 2, keyHeight, { fill: '#f5f5f5', radius: 2 }),
      );
    }
    for (let i = 0; i < 22; i++) {
      if ([2, 6].includes(i % 7)) continue;
      shapes.push(
        rect((i + 1) * keyWidth - keyWidth * 0.3, keysTop, keyWidth * 0.6, keyHeight * 0.6, {
          fill: '#111111',
          radius: 1,
        }),
      );
    }
    return shapes;
  },
};

export const noirTheme: Theme = {
  id: 'noir',
  name: 'Mafia Noir',
  subThemes: [noir, sepia, redRose, goldDeco, smokyJazz],
  showcase: 'gold-deco',
};
