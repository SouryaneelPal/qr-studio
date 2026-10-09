import { circle, linear, path, rect, type Shape } from '../shapes';
import {
  around,
  backdrop,
  brokenLine,
  centre,
  grow,
  holdingCaption,
  organic,
  scatter,
  sign,
  type Sides,
} from './kit';
import { shadowUnder } from './classic';
import { CAPTION_FAMILIES, type SceneContext, type SubTheme, type Theme } from './types';

const display = CAPTION_FAMILIES.display;

function shrink(reach: Sides, by: number): Sides {
  return {
    top: reach.top - by,
    right: reach.right - by,
    bottom: reach.bottom - by,
    left: reach.left - by,
  };
}

// A beam of light falling from above, wide enough to wash over the whole card.
function spotlight(scene: SceneContext, colour: string, opacity: number): Shape {
  const w = scene.size;
  const [cx] = centre(scene.tile);
  // The beam must contain the code's corners, or the hole cut for the code would be filled.
  const beam = path()
    .polygon([
      [cx - w * 0.3, -1],
      [cx + w * 0.3, -1],
      [w + w * 0.05, w + 1],
      [-w * 0.05, w + 1],
    ])
    .shape({});
  return organic(scene, beam, linear(0, 0, 0, w, colour, '#000000'), opacity);
}

const noir: SubTheme = {
  id: 'noir',
  name: 'Noir',
  swatch: ['#0d0d0d', '#f2ead3'],
  qr: { foreground: '#0d0d0d', background: '#f7f1e1', errorCorrection: 'M' },
  tint: '#c9b98f',
  codeScale: 0.56,
  caption: { family: display, weight: 700, color: '#1a1a1a' },
  suggestion: 'Strictly confidential',
  paint(scene) {
    const w = scene.size;
    const [cx, cy] = centre(scene.tile);
    const shapes: Shape[] = [backdrop(scene, '#0b0b0c')];
    shapes.push(spotlight(scene, '#fff3d6', 0.22));
    shapes.push(
      backdrop(scene, {
        kind: 'radial',
        cx,
        cy,
        r: w * 0.62,
        stops: [
          [0, '#fff3d6', 0.28],
          [0.55, '#fff3d6', 0.08],
          [1, '#000000', 0],
        ],
      }),
    );
    // Drifting cigarette smoke, very faint.
    for (const [x, y] of scatter(scene, 5, w * 0.06, w * 0.06)) {
      const curl = path().moveTo(x, y);
      for (let k = 0; k < 3; k++)
        curl.quadTo(
          x + (k % 2 ? -1 : 1) * w * 0.05,
          y - w * 0.04 * (k + 0.5),
          x,
          y - w * 0.04 * (k + 1),
        );
      shapes.push(
        curl.shape({
          stroke: '#d8d8d8',
          lineWidth: Math.max(2, w * 0.012),
          opacity: 0.08,
          lineCap: 'round',
        }),
      );
    }
    // The calling card, casting a hard shadow, with a fine gold border.
    const reach = holdingCaption(scene, w * 0.06);
    shapes.push(
      shadowUnder(
        scene,
        { ...reach, right: reach.right + w * 0.02, bottom: reach.bottom + w * 0.02 },
        0,
        'rgba(0, 0, 0, 0.7)',
      ),
      around(scene, reach, scene.surface),
    );
    shapes.push(
      around(scene, shrink(reach, w * 0.022), '#b08d3c'),
      around(scene, shrink(reach, w * 0.027), scene.surface),
    );
    return shapes;
  },
};

const sepia: SubTheme = {
  id: 'sepia',
  name: 'Sepia film',
  swatch: ['#3b2a1a', '#e8d9b5'],
  qr: { foreground: '#2b1a0c', background: '#f6ecd8', errorCorrection: 'M' },
  tint: '#b58a52',
  codeScale: 0.56,
  caption: { family: display, weight: 700, color: '#2b1a0c' },
  suggestion: 'Roll the reel',
  paint(scene) {
    const w = scene.size;
    const { tile } = scene;
    const shapes: Shape[] = [backdrop(scene, linear(0, 0, w, w, '#8a6a43', '#5a4026', '#7b5b37'))];
    // A strip of film running top to bottom through the scene, the code on one frame.
    const side = w * 0.085;
    const strip = { top: tile.y, bottom: w - tile.y - tile.height, left: side, right: side };
    shapes.push(around(scene, strip, '#1f150c'));
    const hole = side * 0.36;
    for (let y = hole * 0.6; y < w; y += hole * 1.9) {
      for (const x of [tile.x - side * 0.7, tile.x + tile.width + side * 0.7 - hole]) {
        shapes.push(rect(x, y, hole, hole * 0.75, { fill: '#e8d9b5', radius: hole * 0.15 }));
      }
    }
    // The neighbouring frames, faded.
    for (const y of [tile.y - tile.height - w * 0.03, tile.y + tile.height + w * 0.03]) {
      shapes.push(
        rect(tile.x - side * 0.15, y, tile.width + side * 0.3, tile.height, {
          fill: '#c9b48a',
          opacity: 0.35,
        }),
      );
    }
    shapes.push(around(scene, w * 0.015, scene.surface));
    for (const [x, y] of scatter(scene, 50, w * 0.004, w * 0.02))
      shapes.push(circle(x, y, Math.max(0.8, w * 0.002), { fill: '#f6ecd8', opacity: 0.5 }));
    for (let i = 0; i < 5; i++) {
      const x = w * (0.05 + scene.random() * 0.9);
      shapes.push(
        ...brokenLine(x, 0, x + (scene.random() - 0.5) * w * 0.02, w, 10, '#f6ecd8', 1, 0.18),
      );
    }
    shapes.push(...sign(scene, '#e8d9b5', '#2b1a0c', { radius: 0 }));
    return shapes;
  },
};

function rose(cx: number, cy: number, size: number): Shape[] {
  const r = size / 2;
  const shapes: Shape[] = [
    path()
      .moveTo(cx, cy + r * 0.6)
      .quadTo(cx - r * 0.5, cy + r * 1.4, cx - r * 1.6, cy + r * 1.7)
      .shape({ stroke: '#3d6b35', lineWidth: Math.max(1.5, r * 0.12), lineCap: 'round' }),
    path()
      .moveTo(cx - r * 0.7, cy + r * 1.35)
      .quadTo(cx - r * 0.5, cy + r * 0.8, cx - r * 0.05, cy + r * 1.0)
      .quadTo(cx - r * 0.3, cy + r * 1.4, cx - r * 0.7, cy + r * 1.35)
      .close()
      .shape({ fill: '#4f8a43' }),
  ];
  const petals: [number, number, number, string][] = [
    [-0.45, 0.1, 0.55, '#7a0c1e'],
    [0.45, 0.1, 0.55, '#7a0c1e'],
    [0, 0.35, 0.55, '#940f26'],
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
  swatch: ['#2a0610', '#c21a36'],
  qr: { foreground: '#1a0508', background: '#fbf3f3', errorCorrection: 'M' },
  tint: '#c97884',
  codeScale: 0.54,
  caption: { family: display, weight: 700, color: '#5e0a18' },
  suggestion: 'A rose for you',
  paint(scene) {
    const w = scene.size;
    const { tile } = scene;
    const [cx, cy] = centre(tile);
    const shapes: Shape[] = [
      backdrop(scene, {
        kind: 'radial',
        cx,
        cy,
        r: w * 0.75,
        stops: [
          [0, '#5a0d1d'],
          [1, '#14030a'],
        ],
      }),
    ];
    // Folds in the velvet: soft diagonal sheens.
    for (let i = -4; i < 8; i++)
      shapes.push(
        ...brokenLine(i * w * 0.14, 0, i * w * 0.14 + w * 0.5, w, 12, '#ffffff', w * 0.025, 0.035),
      );
    for (const [x, y] of scatter(scene, 8, w * 0.02, w * 0.05))
      shapes.push(circle(x, y, w * 0.012, { fill: '#b3122e', opacity: 0.8 }));
    const reach = holdingCaption(scene, w * 0.05);
    shapes.push(
      shadowUnder(scene, reach, w * 0.006, 'rgba(0, 0, 0, 0.55)'),
      around(scene, reach, scene.surface, w * 0.006),
    );
    shapes.push(
      around(
        scene,
        {
          top: reach.top - w * 0.018,
          bottom: reach.bottom - w * 0.018,
          left: reach.left - w * 0.018,
          right: reach.right - w * 0.018,
        },
        '#b3122e',
      ),
    );
    shapes.push(
      around(
        scene,
        {
          top: reach.top - w * 0.022,
          bottom: reach.bottom - w * 0.022,
          left: reach.left - w * 0.022,
          right: reach.right - w * 0.022,
        },
        scene.surface,
      ),
    );
    // The rose lies over the card's corner, just clear of the code.
    shapes.push(...rose(tile.x + tile.width + w * 0.1, tile.y + tile.height + w * 0.09, w * 0.15));
    return shapes;
  },
};

// A fan of radiating ribs: the art-deco sunburst.
function fan(cx: number, cy: number, radius: number, colour: string, line: number): Shape[] {
  const shapes: Shape[] = [
    path()
      .moveTo(cx - radius, cy)
      .cubicTo(cx - radius, cy - radius * 1.33, cx + radius, cy - radius * 1.33, cx + radius, cy)
      .shape({ stroke: colour, lineWidth: line }),
  ];
  for (let i = 1; i < 6; i++) {
    const angle = (Math.PI * i) / 6;
    shapes.push(
      path()
        .moveTo(cx, cy)
        .lineTo(cx - Math.cos(angle) * radius * 0.95, cy - Math.sin(angle) * radius * 0.95)
        .shape({ stroke: colour, lineWidth: line * 0.8 }),
    );
  }
  return shapes;
}

// A plaque with stepped art-deco corners.
function stepped(scene: SceneContext, reach: Sides, step: number): Shape {
  const box = grow(scene.tile, reach);
  const x0 = box.x;
  const y0 = box.y;
  const x1 = box.x + box.width;
  const y1 = box.y + box.height;
  return path()
    .polygon([
      [x0 + step, y0],
      [x1 - step, y0],
      [x1 - step, y0 + step / 2],
      [x1 - step / 2, y0 + step / 2],
      [x1 - step / 2, y0 + step],
      [x1, y0 + step],
      [x1, y1 - step],
      [x1 - step / 2, y1 - step],
      [x1 - step / 2, y1 - step / 2],
      [x1 - step, y1 - step / 2],
      [x1 - step, y1],
      [x0 + step, y1],
      [x0 + step, y1 - step / 2],
      [x0 + step / 2, y1 - step / 2],
      [x0 + step / 2, y1 - step],
      [x0, y1 - step],
      [x0, y0 + step],
      [x0 + step / 2, y0 + step],
      [x0 + step / 2, y0 + step / 2],
      [x0 + step, y0 + step / 2],
    ])
    .shape({});
}

const goldDeco: SubTheme = {
  id: 'gold-deco',
  name: 'Gold deco',
  swatch: ['#111111', '#d4af37'],
  qr: { foreground: '#111111', background: '#fbf6e6', errorCorrection: 'M' },
  tint: '#d4af37',
  codeScale: 0.54,
  caption: { family: display, weight: 700, color: '#111111' },
  suggestion: 'Members only',
  paint(scene) {
    const w = scene.size;
    const shapes: Shape[] = [backdrop(scene, '#101010')];
    // A wall of gold fans, row on row.
    const r = w * 0.06;
    const line = Math.max(1, w * 0.0025);
    for (let row = 0; row * r < w + r; row++) {
      for (let x = (row % 2) * r; x < w + r; x += r * 2)
        shapes.push(...fan(x, row * r, r, '#8a7128', line));
    }
    const reach = holdingCaption(scene, w * 0.075);
    const step = w * 0.035;
    shapes.push(
      organic(scene, stepped(scene, reach, step), '#d4af37'),
      organic(scene, stepped(scene, shrink(reach, w * 0.012), step * 0.85), '#111111'),
      organic(scene, stepped(scene, shrink(reach, w * 0.018), step * 0.75), '#d4af37'),
      organic(scene, stepped(scene, shrink(reach, w * 0.023), step * 0.68), scene.surface),
    );
    return shapes;
  },
};

const smokyJazz: SubTheme = {
  id: 'jazz',
  name: 'Smoky jazz',
  swatch: ['#2a2a2e', '#ff5fa2'],
  qr: { foreground: '#1a1a1a', background: '#f6f3ef', errorCorrection: 'M' },
  tint: '#ff8fbd',
  codeScale: 0.52,
  caption: { family: display, weight: 700, color: '#1a1a1a' },
  suggestion: 'Late night jazz',
  paint(scene) {
    const w = scene.size;
    const { tile } = scene;
    const shapes: Shape[] = [backdrop(scene, linear(0, 0, 0, w, '#1c1c22', '#2e2a33', '#141418'))];
    // Piano keys along the bottom of the club.
    const keysTop = w * 0.84;
    const keyWidth = w / 18;
    for (let i = 0; i < 18; i++)
      shapes.push(
        rect(i * keyWidth + 1, keysTop, keyWidth - 2, w - keysTop, { fill: '#f2f2f2', radius: 2 }),
      );
    for (let i = 0; i < 18; i++) {
      if ([2, 6].includes(i % 7)) continue;
      shapes.push(
        rect((i + 1) * keyWidth - keyWidth * 0.3, keysTop, keyWidth * 0.6, (w - keysTop) * 0.6, {
          fill: '#0e0e0e',
          radius: 1,
        }),
      );
    }
    // Smoke drifting up past the sign.
    for (const [x, y] of scatter(scene, 14, w * 0.06, w * 0.02))
      shapes.push(
        circle(x, y, w * (0.04 + scene.random() * 0.05), { fill: '#d9d4e0', opacity: 0.06 }),
      );
    // The club sign hanging on chains, ringed with a pink neon tube.
    const reach = holdingCaption(scene, w * 0.06);
    const top = tile.y - reach.top;
    for (const x of [tile.x + tile.width * 0.2, tile.x + tile.width * 0.8])
      shapes.push(rect(x - 1, 0, 2, top, { fill: '#8a8a8a' }));
    shapes.push(
      around(
        scene,
        {
          top: reach.top + w * 0.012,
          bottom: reach.bottom + w * 0.012,
          left: reach.left + w * 0.012,
          right: reach.right + w * 0.012,
        },
        '#ff5fa2',
        w * 0.04,
        0.35,
      ),
    );
    shapes.push(
      around(scene, reach, '#ff5fa2', w * 0.035),
      around(scene, shrink(reach, w * 0.008), '#2a2a2e', w * 0.03),
      around(scene, shrink(reach, w * 0.016), scene.surface, w * 0.025),
    );
    return shapes;
  },
};

export const noirTheme: Theme = {
  id: 'noir',
  name: 'Mafia Noir',
  subThemes: [noir, sepia, redRose, goldDeco, smokyJazz],
  showcase: 'gold-deco',
};
