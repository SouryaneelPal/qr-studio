import type { Rect } from '../plan';
import { circle, glowPaint, linear, path, rect, type Shape } from '../shapes';
import {
  around,
  backdrop,
  bolt,
  brokenLine,
  centre,
  cloud,
  compact,
  crack,
  feather,
  grow,
  organic,
  pointsAround,
  rays,
  ribbon,
  scatter,
  sign,
  ticker,
} from './kit';
import { CAPTION_FAMILIES, type SceneContext, type SubTheme, type Theme } from './types';

const arcade = CAPTION_FAMILIES.arcade;

// A heraldic kite shield around the code: flat top, straight sides, curving to a point.
function kiteShield(scene: SceneContext, pad: number, depth: number): Shape {
  const { x, y, width, height } = scene.tile;
  const [cx] = centre(scene.tile);
  const left = x - pad;
  const right = x + width + pad;
  const shoulder = y + height + pad * 0.3;
  const point = y + height + pad + depth;
  return path()
    .moveTo(left, y - pad)
    .lineTo(right, y - pad)
    .lineTo(right, shoulder)
    .quadTo(right, point - depth * 0.35, cx, point)
    .quadTo(left, point - depth * 0.35, left, shoulder)
    .close()
    .shape({});
}

// An eight-sided plate with bevelled corners around the code.
function octagon(scene: SceneContext, pad: number, cut: number): Shape {
  const { x, y, width, height } = scene.tile;
  const x0 = x - pad;
  const y0 = y - pad;
  const x1 = x + width + pad;
  const y1 = y + height + pad;
  return path()
    .polygon([
      [x0 + cut, y0],
      [x1 - cut, y0],
      [x1, y0 + cut],
      [x1, y1 - cut],
      [x1 - cut, y1],
      [x0 + cut, y1],
      [x0, y1 - cut],
      [x0, y0 + cut],
    ])
    .shape({});
}

const shield: SubTheme = {
  id: 'shield',
  name: 'Shield',
  swatch: ['#1d3a8a', '#d62828'],
  qr: { foreground: '#0b1f4d', background: '#ffffff', errorCorrection: 'M' },
  tint: '#5b7bd6',
  codeScale: 0.56,
  caption: { family: arcade, weight: 400, color: '#ffffff' },
  suggestion: 'Ready for duty',
  paint(scene) {
    const w = scene.size;
    const [cx, cy] = centre(scene.tile);
    const half = scene.tile.width / 2;
    const shapes: Shape[] = [
      backdrop(scene, glowPaint(cx, cy, w * 0.8, '#2b4fb3')),
      backdrop(scene, {
        kind: 'radial',
        cx,
        cy,
        r: w * 0.8,
        stops: [
          [0, '#1d3a8a', 0],
          [0.55, '#1d3a8a', 0.5],
          [1, '#0d1f52', 1],
        ],
      }),
      ...rays(scene, 28, half * 1.55, ['#4a72e0', '#ffffff'], 0.5, 0.18),
    ];
    for (const [x, y] of scatter(scene, 22, w * 0.018)) shapes.push(...starAt(x, y, w * 0.016));
    shapes.push(
      organic(scene, kiteShield(scene, w * 0.075, w * 0.12), '#d62828'),
      organic(scene, kiteShield(scene, w * 0.058, w * 0.1), '#ffffff'),
      organic(scene, kiteShield(scene, w * 0.044, w * 0.085), '#1d3a8a'),
      organic(scene, kiteShield(scene, w * 0.026, w * 0.062), scene.surface),
    );
    shapes.push(...ribbon(scene, '#d62828', '#8f1414', '#ffffff'));
    return shapes;
  },
};

function starAt(x: number, y: number, r: number): Shape[] {
  const corners: [number, number][] = [];
  for (let i = 0; i < 10; i++) {
    const radius = i % 2 === 0 ? r : r * 0.42;
    const angle = -Math.PI / 2 + (i * Math.PI) / 5;
    corners.push([x + Math.cos(angle) * radius, y + Math.sin(angle) * radius]);
  }
  return [path().polygon(corners).shape({ fill: '#ffffff', opacity: 0.85 })];
}

const iron: SubTheme = {
  id: 'iron',
  name: 'Iron',
  swatch: ['#8b1e1e', '#d4a017'],
  qr: { foreground: '#3b0a0a', background: '#fff8e7', errorCorrection: 'M' },
  tint: '#e8a33c',
  codeScale: 0.56,
  caption: { family: arcade, weight: 400, color: '#ffd166' },
  suggestion: 'Suit up & scan',
  paint(scene) {
    const w = scene.size;
    const shapes: Shape[] = [backdrop(scene, linear(0, 0, w, w, '#a3201f', '#5e1010', '#8b1e1e'))];
    // Armour seams: angular lines cutting across the plating.
    const line = Math.max(1.5, w * 0.004);
    for (let i = 0; i < 7; i++) {
      const y = (i + 0.5) * (w / 7);
      shapes.push(
        ...brokenLine(0, y, w * 0.3, y + w * 0.06, 4, '#4d0c0c', line),
        ...brokenLine(w * 0.7, y + w * 0.06, w, y, 4, '#4d0c0c', line),
      );
    }
    // Gold plates in each corner of the image.
    const plate = w * 0.16;
    for (const [ox, oy, dx, dy] of [
      [0, 0, 1, 1],
      [w, 0, -1, 1],
      [0, w, 1, -1],
      [w, w, -1, -1],
    ] as const) {
      shapes.push(
        path()
          .polygon([
            [ox, oy],
            [ox + dx * plate, oy],
            [ox + dx * plate, oy + dy * plate * 0.45],
            [ox + dx * plate * 0.45, oy + dy * plate],
            [ox, oy + dy * plate],
          ])
          .shape({ fill: '#d4a017', stroke: '#7a5200', lineWidth: line }),
      );
    }
    // The chest plate: gold rim, dark band, then a warm glowing surface around the code.
    shapes.push(
      organic(scene, octagon(scene, w * 0.075, w * 0.085), '#d4a017'),
      organic(scene, octagon(scene, w * 0.06, w * 0.07), '#5c0f0f'),
    );
    for (const [x, y] of pointsAround(grow(scene.tile, w * 0.067), w * 0.07))
      shapes.push(circle(x, y, Math.max(1.5, w * 0.006), { fill: '#f0c75e' }));
    shapes.push(
      ...feather(scene, { pad: w * 0.022, spread: w * 0.03, radius: w * 0.02, colour: '#ffd89a' }),
      around(scene, w * 0.018, scene.surface, w * 0.015),
    );
    shapes.push(...sign(scene, '#5c0f0f', '#d4a017'));
    return shapes;
  },
};

// A forked lightning bolt drawn in short pieces down the side of the scene.
function lightning(scene: SceneContext, x: number, colour: string, width: number): Shape[] {
  const shapes: Shape[] = [];
  let px = x;
  let py = 0;
  for (let i = 0; i < 9; i++) {
    const nx = px + (scene.random() - 0.5) * scene.size * 0.08;
    const ny = py + scene.size * 0.08;
    shapes.push(
      ...brokenLine(px, py, nx, ny, 1, colour, width),
      ...brokenLine(px, py, nx, ny, 1, colour, width * 3.5, 0.18),
    );
    px = nx;
    py = ny;
  }
  return shapes;
}

const thunder: SubTheme = {
  id: 'thunder',
  name: 'Thunder',
  swatch: ['#0f1c3f', '#cfd8e3'],
  qr: { foreground: '#0f1c3f', background: '#f4f7fb', errorCorrection: 'M' },
  tint: '#8fa0bb',
  codeScale: 0.56,
  caption: { family: arcade, weight: 400, color: '#0b1530' },
  suggestion: 'Bring the storm',
  paint(scene) {
    const w = scene.size;
    const shapes: Shape[] = [backdrop(scene, linear(0, 0, 0, w, '#0b1530', '#26344f', '#3a4660'))];
    for (const [x, y] of scatter(scene, 9, w * 0.08))
      shapes.push(...cloud(x, Math.min(y, w * 0.3), w * 0.2, '#1b2742', 0.85));
    shapes.push(
      ...lightning(scene, w * 0.1, '#e8f0ff', Math.max(1.5, w * 0.005)),
      ...lightning(scene, w * 0.88, '#e8f0ff', Math.max(1.5, w * 0.005)),
    );
    for (const [x, y] of scatter(scene, 50, w * 0.01, w * 0.04))
      shapes.push(
        ...brokenLine(x, y, x - w * 0.012, y + w * 0.03, 1, '#9fb3d1', Math.max(1, w * 0.002), 0.5),
      );
    // The stone tablet, lit from above, with chipped edges.
    shapes.push(
      around(
        scene,
        w * 0.062,
        linear(0, scene.tile.y, 0, scene.tile.y + scene.tile.height, '#d2d7de', '#9aa3ad'),
        w * 0.02,
      ),
    );
    for (const [x, y] of pointsAround(grow(scene.tile, w * 0.05), w * 0.09))
      shapes.push(circle(x, y, Math.max(1.5, w * 0.008), { fill: '#7e8794', opacity: 0.6 }));
    shapes.push(...feather(scene, { pad: w * 0.016, spread: w * 0.02, radius: w * 0.01 }));
    for (const [x, y] of scatter(scene, 4, w * 0.02, 0))
      shapes.push(bolt(x, y, w * 0.03, '#ffffff'));
    shapes.push(...sign(scene, '#8e97a3', '#3b4452'));
    return shapes;
  },
};

const gamma: SubTheme = {
  id: 'gamma',
  name: 'Gamma',
  swatch: ['#2f7d32', '#9dff8f'],
  qr: { foreground: '#10350f', background: '#f3fff0', errorCorrection: 'M' },
  tint: '#7fd46f',
  codeScale: 0.56,
  caption: { family: arcade, weight: 400, color: '#e8ffd9' },
  suggestion: 'Smash that scan',
  paint(scene) {
    const w = scene.size;
    const [cx, cy] = centre(scene.tile);
    const shapes: Shape[] = [
      backdrop(scene, {
        kind: 'radial',
        cx,
        cy,
        r: w * 0.75,
        stops: [
          [0, '#3fa043'],
          [1, '#0f3d12'],
        ],
      }),
    ];
    // Cracked ground: fissures running out from the energy plate.
    const plate = grow(scene.tile, w * 0.07);
    for (const [x, y] of pointsAround(plate, w * 0.07)) {
      const angle = Math.atan2(y - cy, x - cx) + (scene.random() - 0.5) * 0.5;
      const line = crack(
        scene,
        x + Math.cos(angle) * w * 0.02,
        y + Math.sin(angle) * w * 0.02,
        angle,
        w * 0.18,
        '#0a2a0c',
        Math.max(1.5, w * 0.005),
      );
      if (line) shapes.push(line);
    }
    for (const [x, y] of scatter(scene, 16, w * 0.025)) {
      const r = w * (0.012 + scene.random() * 0.012);
      shapes.push(
        path()
          .polygon([
            [x - r, y],
            [x - r * 0.3, y - r],
            [x + r, y - r * 0.4],
            [x + r * 0.7, y + r * 0.6],
            [x - r * 0.2, y + r],
          ])
          .shape({ fill: '#2a5a2c', stroke: '#0a2a0c', lineWidth: 1 }),
      );
    }
    shapes.push(
      ...feather(scene, {
        pad: w * 0.07,
        spread: w * 0.05,
        radius: w * 0.05,
        colour: '#9dff8f',
        steps: 6,
      }),
      organic(scene, octagon(scene, w * 0.06, w * 0.04), '#1f5e22'),
      ...compact([
        crack(scene, plate.x, plate.y, Math.PI * 1.25, w * 0.08, '#9dff8f', Math.max(1, w * 0.003)),
      ]),
      around(scene, w * 0.03, scene.surface, w * 0.02),
    );
    shapes.push(...sign(scene, '#123d14', '#7cff6b'));
    return shapes;
  },
};

const SEGMENTS: Record<string, string> = {
  '0': 'abcdef',
  '7': 'abc',
};

// Seven-segment digits drawn as bars, so the countdown needs no font.
function digit(value: string, x: number, y: number, height: number, colour: string): Shape[] {
  const width = height * 0.55;
  const t = Math.max(1.2, height * 0.13);
  const half = height / 2;
  const bars: Record<string, Rect> = {
    a: { x: x + t, y, width: width - 2 * t, height: t },
    b: { x: x + width - t, y: y + t, width: t, height: half - 1.5 * t },
    c: { x: x + width - t, y: y + half + 0.5 * t, width: t, height: half - 1.5 * t },
    d: { x: x + t, y: y + height - t, width: width - 2 * t, height: t },
    e: { x, y: y + half + 0.5 * t, width: t, height: half - 1.5 * t },
    f: { x, y: y + t, width: t, height: half - 1.5 * t },
  };
  return Array.from(SEGMENTS[value] ?? '', (key) => bars[key]).flatMap((bar) =>
    bar ? [rect(bar.x, bar.y, bar.width, bar.height, { fill: colour, radius: t / 3 })] : [],
  );
}

function countdown(text: string, cx: number, cy: number, height: number, colour: string): Shape[] {
  const charWidth = height * 0.75;
  const total = Array.from(text).reduce(
    (sum, char) => sum + (char === ':' ? charWidth * 0.45 : charWidth),
    0,
  );
  let x = cx - total / 2;
  const y = cy - height / 2;
  const shapes: Shape[] = [];
  for (const char of text) {
    if (char === ':') {
      shapes.push(
        circle(x + charWidth * 0.18, y + height * 0.3, height * 0.07, { fill: colour }),
        circle(x + charWidth * 0.18, y + height * 0.7, height * 0.07, { fill: colour }),
      );
      x += charWidth * 0.45;
    } else {
      shapes.push(...digit(char, x, y, height, colour));
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
  tint: '#ff7b2e',
  codeScale: 0.54,
  caption: { family: arcade, weight: 400, color: '#ffb347', stroke: '#2b0505' },
  suggestion: 'The clock is ticking',
  paint(scene) {
    const w = scene.size;
    const { tile } = scene;
    const shapes: Shape[] = [
      backdrop(scene, linear(0, 0, 0, w, '#1f0303', '#6b1010', '#c23a1a', '#ff7b2e')),
    ];
    for (const [x, y] of scatter(scene, 26, w * 0.01, w * 0.02))
      shapes.push(circle(x, y, Math.max(1, w * 0.004), { fill: '#ffcf7a', opacity: 0.7 }));
    // A ruined skyline. Buildings below the monitor are kept short so they never reach it.
    const below = w - (tile.y + tile.height) - w * 0.02;
    let x = 0;
    while (x < w) {
      const width = w * (0.06 + scene.random() * 0.07);
      const underCode = x + width > tile.x && x < tile.x + tile.width;
      const height = underCode
        ? below * (0.5 + scene.random() * 0.4)
        : w * (0.25 + scene.random() * 0.35);
      const top = w - height;
      const jag = width * 0.3;
      shapes.push(
        path()
          .polygon([
            [x, w],
            [x, top + jag],
            [x + width * 0.3, top],
            [x + width * 0.55, top + jag * 0.8],
            [x + width * 0.8, top + jag * 0.2],
            [x + width, top + jag],
            [x + width, w],
          ])
          .shape({ fill: '#1a0a08' }),
      );
      for (let wy = top + jag + w * 0.02; wy < w - w * 0.02; wy += w * 0.035) {
        for (let wx = x + width * 0.2; wx < x + width * 0.8; wx += width * 0.3) {
          if (scene.random() < 0.3)
            shapes.push(rect(wx, wy, w * 0.008, w * 0.012, { fill: '#ff9a3c', opacity: 0.8 }));
        }
      }
      x += width + w * 0.005;
    }
    // The monitor: a dark bezel, a deep bottom edge for the countdown, and a glowing screen.
    // Kept shallow enough that a bottom caption's ticker never covers the digits.
    const bezel = { top: w * 0.035, left: w * 0.035, right: w * 0.035, bottom: w * 0.05 };
    shapes.push(
      rect(
        tile.x + tile.width / 2 - w * 0.03,
        tile.y + tile.height + bezel.bottom,
        w * 0.06,
        w * 0.03,
        { fill: '#2a2a2e' },
      ),
    );
    shapes.push(
      ...feather(scene, {
        pad: w * 0.06,
        spread: w * 0.06,
        radius: w * 0.04,
        colour: '#ff9a3c',
        steps: 6,
      }),
    );
    shapes.push(
      around(scene, bezel, '#26262b', w * 0.02),
      around(scene, w * 0.014, scene.surface, w * 0.01),
    );
    shapes.push(
      ...countdown(
        '00:00:07',
        tile.x + tile.width / 2,
        tile.y + tile.height + w * 0.014 + (bezel.bottom - w * 0.014) / 2,
        w * 0.024,
        '#ff4d2e',
      ),
    );
    shapes.push(...ticker(scene, '#1a0505', '#ff4d2e'));
    return shapes;
  },
};

export const superhero: Theme = {
  id: 'superhero',
  name: 'Superhero',
  subThemes: [shield, iron, thunder, gamma, doomsday],
  showcase: 'doomsday',
};
