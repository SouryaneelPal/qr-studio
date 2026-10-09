import { circle, linear, path, rect, type Shape } from '../shapes';
import {
  around,
  backdrop,
  blobPath,
  centre,
  cloud,
  flower,
  grow,
  heart,
  holdingCaption,
  organic,
  ribbon,
  scatter,
  squareReach,
  star,
  twinkle,
} from './kit';
import { CAPTION_FAMILIES, type SceneContext, type SubTheme, type Theme } from './types';

const grotesque = CAPTION_FAMILIES.grotesque;
const UP = -Math.PI / 2;

function bump(angle: number, at: number, width: number): number {
  const d = Math.atan2(Math.sin(angle - at), Math.cos(angle - at));
  return Math.exp(-(d * d) / (2 * width * width));
}

// A fluffy outline that always clears the code's tile by at least `pad`.
function fluffy(
  scene: SceneContext,
  pad: number,
  puff: number,
  extra: (angle: number) => number = () => 0,
): Shape {
  const half = scene.tile.width / 2;
  return blobPath(
    scene,
    (angle) =>
      squareReach(half, angle) + pad + puff * (0.5 + 0.5 * Math.cos(angle * 14)) + extra(angle),
  );
}

// Two lobes on top and a soft point below: a heart, drawn as a cloud.
function heartCloud(scene: SceneContext, pad: number): Shape {
  const w = scene.size;
  return fluffy(
    scene,
    pad,
    w * 0.012,
    (angle) =>
      w * 0.06 * (bump(angle, UP - 0.62, 0.32) + bump(angle, UP + 0.62, 0.32)) +
      w * 0.07 * bump(angle, Math.PI / 2, 0.2),
  );
}

const bubblegum: SubTheme = {
  id: 'bubblegum',
  name: 'Bubblegum',
  swatch: ['#ffb3d1', '#ff4f93'],
  qr: { foreground: '#5c0b33', background: '#fff7fb', errorCorrection: 'M' },
  tint: '#ff8fbd',
  codeScale: 0.56,
  caption: { family: grotesque, weight: 800, color: '#c2185b' },
  suggestion: 'Scan me, pookie 💕',
  paint(scene) {
    const w = scene.size;
    const shapes: Shape[] = [backdrop(scene, linear(0, 0, 0, w, '#ff9cc5', '#ffd0e4', '#ffe6f1'))];
    for (const [x, y] of scatter(scene, 7, w * 0.07, w * 0.08))
      shapes.push(...cloud(x, y, w * 0.13, '#ffffff', 0.7));
    scatter(scene, 24, w * 0.03, w * 0.05).forEach(([x, y], i) =>
      shapes.push(
        heart(x, y, w * (0.025 + scene.random() * 0.025), i % 3 === 0 ? '#ffffff' : '#ff4f93', 0.9),
      ),
    );
    shapes.push(
      organic(scene, heartCloud(scene, w * 0.06), '#ffffff', 0.5),
      organic(scene, heartCloud(scene, w * 0.04), scene.surface),
    );
    shapes.push(...ribbon(scene, '#ffffff', '#ff8fbd', '#ff4f93'));
    return shapes;
  },
};

const lavender: SubTheme = {
  id: 'lavender',
  name: 'Lavender cloud',
  swatch: ['#cbb8ff', '#ffffff'],
  qr: { foreground: '#2e1a5c', background: '#fbf9ff', errorCorrection: 'M' },
  tint: '#a990f0',
  codeScale: 0.56,
  caption: { family: grotesque, weight: 800, color: '#2e1a5c' },
  suggestion: 'Head in the clouds ☁️',
  paint(scene) {
    const w = scene.size;
    const shapes: Shape[] = [backdrop(scene, linear(0, 0, 0, w, '#b9a2ff', '#dccfff', '#f3edff'))];
    for (const [x, y] of scatter(scene, 20, w * 0.012, w * 0.04))
      shapes.push(twinkle(x, y, w * 0.012, '#ffffff', 0.9));
    for (const [x, y] of scatter(scene, 8, w * 0.07, w * 0.08))
      shapes.push(...cloud(x, y, w * 0.12, '#ffffff', 0.55));
    shapes.push(
      organic(scene, fluffy(scene, w * 0.06, w * 0.03), '#c9b6ff'),
      organic(scene, fluffy(scene, w * 0.045, w * 0.026), scene.surface),
    );
    shapes.push(...ribbon(scene, '#ece4ff', '#b9a2ff', '#8f74d9'));
    return shapes;
  },
};

function strawberry(cx: number, cy: number, size: number): Shape[] {
  const s = size / 2;
  return [
    path()
      .moveTo(cx, cy + s)
      .cubicTo(cx - s * 1.1, cy + s * 0.2, cx - s * 0.95, cy - s * 0.75, cx, cy - s * 0.55)
      .cubicTo(cx + s * 0.95, cy - s * 0.75, cx + s * 1.1, cy + s * 0.2, cx, cy + s)
      .close()
      .shape({ fill: '#e63950' }),
    path()
      .polygon([
        [cx - s * 0.6, cy - s * 0.6],
        [cx - s * 0.15, cy - s * 0.45],
        [cx, cy - s * 0.95],
        [cx + s * 0.15, cy - s * 0.45],
        [cx + s * 0.6, cy - s * 0.6],
        [cx, cy - s * 0.3],
      ])
      .shape({ fill: '#3f9b4b' }),
    ...[
      [-0.35, -0.1],
      [0.35, -0.1],
      [0, 0.15],
      [-0.25, 0.4],
      [0.25, 0.4],
    ].map(([dx = 0, dy = 0]) =>
      circle(cx + dx * s, cy + dy * s, Math.max(0.8, s * 0.07), { fill: '#ffe08a' }),
    ),
  ];
}

const strawberryMilk: SubTheme = {
  id: 'strawberry',
  name: 'Strawberry milk',
  swatch: ['#ffd6e0', '#e63950'],
  qr: { foreground: '#4a0d1c', background: '#fffaf3', errorCorrection: 'M' },
  tint: '#ff9fb5',
  codeScale: 0.5,
  caption: { family: grotesque, weight: 800, color: '#8a1530' },
  suggestion: 'Berry sweet 🍓',
  paint(scene) {
    const w = scene.size;
    const shapes: Shape[] = [backdrop(scene, '#fff1f4')];
    // A gingham tablecloth.
    const step = w / 12;
    for (let i = 0; i < 12; i++) {
      shapes.push(
        rect(i * step, 0, step / 2, w, { fill: '#ffb3c7', opacity: 0.35 }),
        rect(0, i * step, w, step / 2, { fill: '#ffb3c7', opacity: 0.35 }),
      );
    }
    // The carton: a pink body with a gabled top, and the code on its cream label.
    const reach = holdingCaption(scene, w * 0.075);
    const body = grow(scene.tile, reach);
    const ridge = body.y - w * 0.11;
    shapes.push(
      path()
        .polygon([
          [body.x, body.y],
          [body.x + body.width / 2, ridge],
          [body.x + body.width, body.y],
        ])
        .shape({ fill: '#ff9fb5', stroke: '#d6406a', lineWidth: Math.max(1.5, w * 0.004) }),
      rect(body.x + body.width / 2 - w * 0.05, ridge - w * 0.025, w * 0.1, w * 0.03, {
        fill: '#ffffff',
        stroke: '#d6406a',
        lineWidth: Math.max(1, w * 0.003),
      }),
    );
    shapes.push(around(scene, reach, '#ffb3c7', w * 0.012));
    for (const [x, y] of [
      [body.x + w * 0.035, body.y + w * 0.035],
      [body.x + body.width - w * 0.035, body.y + w * 0.035],
    ] as [number, number][])
      shapes.push(...strawberry(x, y, w * 0.045));
    shapes.push(
      around(scene, w * 0.032, '#e63950', w * 0.02),
      around(scene, w * 0.026, scene.surface, w * 0.016),
    );
    for (const [x, y] of scatter(scene, 6, w * 0.03, w * 0.04))
      shapes.push(...strawberry(x, y, w * 0.05));
    return shapes;
  },
};

const bunny: SubTheme = {
  id: 'bunny',
  name: 'Bunny',
  swatch: ['#d7f0ff', '#f48fb1'],
  qr: { foreground: '#3d1020', background: '#ffffff', errorCorrection: 'M' },
  tint: '#f8bbd0',
  codeScale: 0.54,
  caption: { family: grotesque, weight: 800, color: '#ad1457' },
  suggestion: 'Some bunny loves you',
  paint(scene) {
    const w = scene.size;
    const { tile } = scene;
    const [cx] = centre(tile);
    const line = Math.max(1.5, w * 0.005);
    const shapes: Shape[] = [backdrop(scene, linear(0, 0, 0, w, '#cdebff', '#eef8ff', '#c5ecb4'))];
    shapes.push(rect(0, w * 0.86, w, w * 0.14, { fill: '#a8dd95' }));
    for (let x = w * 0.03; x < w; x += w * 0.09)
      shapes.push(
        ...flower(
          x,
          w * 0.93 + (scene.random() - 0.5) * w * 0.04,
          w * 0.03,
          5,
          scene.random() < 0.5 ? '#ffffff' : '#ffd23f',
          '#f48fb1',
        ),
      );
    // The bunny: ears and head above, a round furry body hugging the card, paws on its sides.
    const headR = w * 0.085;
    const headY = tile.y - w * 0.075 - headR * 0.55;
    for (const side of [-1, 1]) {
      const ex = cx + side * headR * 0.55;
      shapes.push(
        {
          kind: 'ellipse',
          cx: ex,
          cy: headY - headR * 1.55,
          rx: headR * 0.36,
          ry: headR * 0.95,
          rotation: side * 0.15,
          fill: '#ffffff',
          stroke: '#c8a3b3',
          lineWidth: line,
        },
        {
          kind: 'ellipse',
          cx: ex,
          cy: headY - headR * 1.45,
          rx: headR * 0.18,
          ry: headR * 0.65,
          rotation: side * 0.15,
          fill: '#f8bbd0',
        },
      );
    }
    shapes.push(
      around(scene, w * 0.075, '#ffffff', w * 0.13),
      around(scene, w * 0.075, 'rgba(200, 163, 179, 0.25)', w * 0.13),
    );
    shapes.push(circle(cx, headY, headR, { fill: '#ffffff', stroke: '#c8a3b3', lineWidth: line }));
    shapes.push(
      circle(cx - headR * 0.38, headY - headR * 0.05, headR * 0.1, { fill: '#3d1020' }),
      circle(cx + headR * 0.38, headY - headR * 0.05, headR * 0.1, { fill: '#3d1020' }),
    );
    shapes.push(
      circle(cx, headY + headR * 0.22, headR * 0.09, { fill: '#f06292' }),
      circle(cx - headR * 0.62, headY + headR * 0.25, headR * 0.14, { fill: '#f8bbd0' }),
      circle(cx + headR * 0.62, headY + headR * 0.25, headR * 0.14, { fill: '#f8bbd0' }),
    );
    for (const side of [-1, 1]) {
      const px = side < 0 ? tile.x - w * 0.035 : tile.x + tile.width + w * 0.035;
      shapes.push({
        kind: 'ellipse',
        cx: px,
        cy: tile.y + tile.height * 0.55,
        rx: w * 0.026,
        ry: w * 0.04,
        fill: '#ffffff',
        stroke: '#c8a3b3',
        lineWidth: line,
      });
    }
    shapes.push(around(scene, w * 0.022, scene.surface, w * 0.02));
    shapes.push(...ribbon(scene, '#ffffff', '#f8bbd0', '#f48fb1'));
    return shapes;
  },
};

const sparkle: SubTheme = {
  id: 'sparkle',
  name: 'Sparkle',
  swatch: ['#b8c6ff', '#ffd23f'],
  qr: { foreground: '#2a1748', background: '#fffdf4', errorCorrection: 'M' },
  tint: '#ffd23f',
  codeScale: 0.54,
  caption: { family: grotesque, weight: 800, color: '#5a2d82' },
  suggestion: 'Sparkle on ✨',
  paint(scene) {
    const w = scene.size;
    const half = scene.tile.width / 2;
    const colours = ['#ffffff', '#ffd23f', '#ff9ad5', '#7fd8ff'];
    const shapes: Shape[] = [backdrop(scene, linear(0, 0, w, w, '#9fb0ff', '#d9c2ff', '#ffc9ec'))];
    scatter(scene, 30, w * 0.02, w * 0.04).forEach(([x, y], i) =>
      shapes.push(
        twinkle(
          x,
          y,
          w * (0.01 + scene.random() * 0.012),
          colours[i % colours.length] ?? '#ffffff',
        ),
      ),
    );
    scatter(scene, 10, w * 0.025, w * 0.06).forEach(([x, y], i) =>
      shapes.push(star(x, y, w * 0.022, 0.45, 5, colours[(i + 1) % colours.length] ?? '#ffd23f')),
    );
    // A twelve-pointed star plate with a soft golden glow.
    const spikes = (pad: number, length: number) =>
      blobPath(
        scene,
        (angle) => squareReach(half, angle) + pad + length * Math.abs(Math.cos(angle * 6)) ** 3,
      );
    shapes.push(
      organic(scene, spikes(w * 0.07, w * 0.09), '#ffe98a', 0.55),
      organic(scene, spikes(w * 0.05, w * 0.07), '#ffd23f'),
      organic(scene, spikes(w * 0.035, w * 0.05), scene.surface),
    );
    shapes.push(...ribbon(scene, '#ffe98a', '#e0a800', '#c98f00'));
    return shapes;
  },
};

export const pookie: Theme = {
  id: 'pookie',
  name: 'Pookie',
  subThemes: [bubblegum, lavender, strawberryMilk, bunny, sparkle],
  showcase: 'bunny',
};
