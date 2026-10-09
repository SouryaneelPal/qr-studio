import { circle, linear, path, rect, type Shape } from '../shapes';
import {
  around,
  backdrop,
  brokenLine,
  grow,
  holdingCaption,
  pointsAround,
  scatter,
  type Sides,
} from './kit';
import { CAPTION_FAMILIES, type SceneContext, type SubTheme, type Theme } from './types';

const grotesque = CAPTION_FAMILIES.grotesque;

export const plain: SubTheme = {
  id: 'plain',
  name: 'Plain',
  swatch: ['#ffffff', '#111111'],
  qr: { foreground: '#111111', background: '#ffffff', errorCorrection: 'M' },
  tint: '#111111',
  codeScale: 1,
  caption: { family: grotesque, weight: 800 },
  suggestion: 'Scan me!',
  // No scene at all: only room for the caption, in the code's own background colour.
  paint: (scene) => (scene.caption ? [backdrop(scene, scene.style.background)] : []),
};

// A soft drop shadow under an object around the code, nudged down and to the right.
export function shadowUnder(
  scene: SceneContext,
  reach: Sides,
  radius: number,
  colour = 'rgba(40, 30, 20, 0.22)',
): Shape {
  const nudge = Math.max(2, Math.round(scene.size * 0.012));
  return around(
    scene,
    {
      top: reach.top - nudge,
      left: reach.left - nudge,
      right: reach.right + nudge,
      bottom: reach.bottom + nudge * 1.5,
    },
    colour,
    radius,
  );
}

function shrink(reach: Sides, by: number): Sides {
  return {
    top: reach.top - by,
    right: reach.right - by,
    bottom: reach.bottom - by,
    left: reach.left - by,
  };
}

function paperFibres(scene: SceneContext, colour: string, count: number): Shape[] {
  const shapes: Shape[] = [];
  for (const [x, y] of scatter(scene, count, scene.size * 0.02, 0)) {
    const length = scene.size * (0.01 + scene.random() * 0.03);
    const angle = scene.random() * Math.PI;
    shapes.push(
      ...brokenLine(
        x,
        y,
        x + Math.cos(angle) * length,
        y + Math.sin(angle) * length,
        1,
        colour,
        Math.max(0.8, scene.size * 0.002),
        0.35,
      ),
    );
  }
  return shapes;
}

const roundedCard: SubTheme = {
  id: 'rounded',
  name: 'Rounded card',
  swatch: ['#efe8db', '#1b1b1b'],
  qr: { foreground: '#111111', background: '#ffffff', errorCorrection: 'M' },
  tint: '#e0cfb3',
  codeScale: 0.62,
  caption: { family: grotesque, weight: 800, color: '#1b1b1b' },
  suggestion: 'Say hello 👋',
  paint(scene) {
    const pad = scene.size * 0.045;
    const reach = holdingCaption(scene, pad);
    const radius = scene.size * 0.05;
    return [
      backdrop(scene, linear(0, 0, scene.size, scene.size, '#f4eee3', '#e8dfcf')),
      ...paperFibres(scene, '#b9ab93', 140),
      shadowUnder(scene, reach, radius),
      around(scene, reach, scene.surface, radius),
    ];
  },
};

const polaroid: SubTheme = {
  id: 'polaroid',
  name: 'Polaroid',
  swatch: ['#8a5a36', '#fbf8f1'],
  qr: { foreground: '#1e1d1a', background: '#fbf8f1', errorCorrection: 'M' },
  tint: '#c69a6b',
  codeScale: 0.58,
  caption: { family: grotesque, weight: 700, color: '#3a3833' },
  suggestion: 'Wish you were here',
  paint(scene) {
    const w = scene.size;
    const shapes: Shape[] = [backdrop(scene, linear(0, 0, w, w, '#9b6a43', '#7a4f2f', '#8f5f3b'))];
    // Wood grain: long, slightly wavy streaks across the desk.
    for (let i = 0; i < 26; i++) {
      const y = (i + scene.random() * 0.6) * (w / 26);
      shapes.push(
        ...brokenLine(
          0,
          y,
          w,
          y + (scene.random() - 0.5) * w * 0.04,
          14,
          i % 3 === 0 ? '#5e3a20' : '#b07f55',
          Math.max(1, w * 0.003),
          0.35,
        ),
      );
    }
    // A coffee ring and a pencil resting on the desk.
    shapes.push(
      circle(w * 0.1, w * 0.12, w * 0.06, {
        stroke: '#4a2c17',
        lineWidth: Math.max(2, w * 0.008),
        opacity: 0.35,
      }),
    );
    shapes.push(
      path()
        .polygon([
          [w * 0.8, w * 0.96],
          [w * 0.97, w * 0.83],
          [w * 0.985, w * 0.845],
          [w * 0.815, w * 0.975],
        ])
        .shape({ fill: '#f2b33d' }),
      path()
        .polygon([
          [w * 0.97, w * 0.83],
          [w * 0.995, w * 0.815],
          [w * 0.985, w * 0.845],
        ])
        .shape({ fill: '#3a2a1a' }),
    );
    const pad = w * 0.035;
    const reach = holdingCaption(scene, pad);
    // A Polaroid always has a deep bottom edge, caption or not.
    reach.bottom = Math.max(reach.bottom, pad * 3);
    shapes.push(
      shadowUnder(scene, reach, w * 0.008, 'rgba(30, 15, 5, 0.35)'),
      around(scene, reach, scene.surface, w * 0.008),
    );
    return shapes;
  },
};

const ticket: SubTheme = {
  id: 'ticket',
  name: 'Ticket stub',
  swatch: ['#7a0f1d', '#ffe9b0'],
  qr: { foreground: '#2a1a12', background: '#ffeab8', errorCorrection: 'M' },
  tint: '#e9b949',
  codeScale: 0.56,
  caption: { family: grotesque, weight: 800, color: '#7a2e12' },
  suggestion: 'Admit one',
  paint(scene) {
    const w = scene.size;
    const carpet = '#6e0d1a';
    const shapes: Shape[] = [backdrop(scene, carpet)];
    // Cinema carpet: a repeating gold diamond and teal dot pattern.
    const step = w / 9;
    for (let row = 0; row <= 10; row++) {
      const y = row * step;
      for (let x = (row % 2) * (step / 2); x < w + step; x += step) {
        shapes.push(
          path()
            .polygon([
              [x, y - step * 0.3],
              [x + step * 0.3, y],
              [x, y + step * 0.3],
              [x - step * 0.3, y],
            ])
            .shape({ fill: '#c9962e', opacity: 0.5 }),
        );
        shapes.push(circle(x + step / 2, y, step * 0.07, { fill: '#2f8f8a', opacity: 0.8 }));
      }
    }
    const pad = w * 0.04;
    const reach = holdingCaption(scene, pad);
    reach.left = Math.max(reach.left, pad * 3);
    shapes.push(
      shadowUnder(scene, reach, w * 0.012, 'rgba(0, 0, 0, 0.35)'),
      around(scene, reach, scene.surface, w * 0.012),
    );
    // The stub: a perforated tear line with half-moon notches.
    const tear = scene.tile.x - pad * 1.7;
    const top = scene.tile.y - reach.top;
    const bottom = scene.tile.y + scene.tile.height + reach.bottom;
    for (let y = top + pad * 0.7; y < bottom - pad * 0.7; y += pad * 0.7) {
      shapes.push(rect(tear - 1, y, Math.max(2, w * 0.005), pad * 0.35, { fill: '#b5452a' }));
    }
    shapes.push(
      circle(tear, top, pad * 0.55, { fill: carpet }),
      circle(tear, bottom, pad * 0.55, { fill: carpet }),
    );
    for (let y = top + pad; y < bottom - pad; y += pad * 1.2)
      shapes.push(
        circle((tear + scene.tile.x - reach.left) / 2, y, Math.max(1.5, w * 0.006), {
          fill: '#e07a4f',
        }),
      );
    return shapes;
  },
};

const stamp: SubTheme = {
  id: 'stamp',
  name: 'Postage stamp',
  swatch: ['#ead8b4', '#c0392b'],
  qr: { foreground: '#1d1d1f', background: '#ffffff', errorCorrection: 'M' },
  tint: '#d9b98a',
  codeScale: 0.56,
  caption: { family: grotesque, weight: 800, color: '#a5281b' },
  suggestion: 'Sent with love',
  paint(scene) {
    const w = scene.size;
    const envelope = '#ecdcbc';
    const shapes: Shape[] = [backdrop(scene, linear(0, 0, 0, w, '#f1e2c4', '#e2cda6'))];
    // The envelope's flap folds down to a point above the stamp.
    const tip = scene.tile.y - w * 0.08;
    const line = Math.max(1.5, w * 0.004);
    shapes.push(
      ...brokenLine(0, 0, w / 2, tip, 6, '#c2a679', line),
      ...brokenLine(w, 0, w / 2, tip, 6, '#c2a679', line),
    );
    // A postmark with wavy cancellation lines, on the envelope beside the stamp.
    const markY = w * 0.5;
    shapes.push(
      circle(w * 0.1, markY, w * 0.065, { stroke: '#5b6b7a', lineWidth: line, opacity: 0.7 }),
    );
    for (let i = 0; i < 3; i++) {
      const y = markY - w * 0.03 + i * w * 0.03;
      shapes.push(
        ...brokenLine(w * 0.02, y, w * 0.18, y, 3, '#5b6b7a', Math.max(1, w * 0.003), 0.6),
      );
    }
    const pad = w * 0.05;
    const reach = holdingCaption(scene, pad);
    shapes.push(
      shadowUnder(scene, reach, 0, 'rgba(60, 40, 10, 0.18)'),
      around(scene, reach, '#ffffff'),
    );
    // Scalloped edge: bites of envelope colour all round the stamp.
    const bite = pad * 0.22;
    for (const [x, y] of pointsAround(grow(scene.tile, reach), bite * 2.6))
      shapes.push(circle(x, y, bite, { fill: envelope }));
    shapes.push(
      around(scene, shrink(reach, pad * 0.42), '#c0392b'),
      around(scene, shrink(reach, pad * 0.52), scene.surface),
    );
    return shapes;
  },
};

export const classic: Theme = {
  id: 'classic',
  name: 'Classic',
  subThemes: [plain, roundedCard, polaroid, ticket, stamp],
  showcase: 'polaroid',
};
