import { circle, intersects, linear, path, rect, type Shape } from '../shapes';
import {
  around,
  backdrop,
  blobPath,
  brokenLine,
  centre,
  grow,
  holdingCaption,
  organic,
  pointsAround,
  scatter,
  sign,
  type Sides,
} from './kit';
import { CAPTION_FAMILIES, type SubTheme, type Theme } from './types';

const arcade = CAPTION_FAMILIES.arcade;

function widest(a: Sides, b: Partial<Sides>): Sides {
  return {
    top: Math.max(a.top, b.top ?? 0),
    right: Math.max(a.right, b.right ?? 0),
    bottom: Math.max(a.bottom, b.bottom ?? 0),
    left: Math.max(a.left, b.left ?? 0),
  };
}

function rivet(x: number, y: number, r: number): Shape[] {
  return [
    circle(x, y, r, { fill: '#6b7176', stroke: '#2d2f31', lineWidth: Math.max(1, r * 0.25) }),
    circle(x - r * 0.3, y - r * 0.3, r * 0.35, { fill: '#e2e6e9', opacity: 0.8 }),
  ];
}

const rust: SubTheme = {
  id: 'rust',
  name: 'Rusted metal',
  swatch: ['#8a3b12', '#a7aeb3'],
  qr: { foreground: '#2a1205', background: '#fff3e6', errorCorrection: 'M' },
  tint: '#c0622b',
  codeScale: 0.56,
  caption: { family: arcade, weight: 400, color: '#2a1205' },
  suggestion: 'Built to last',
  paint(scene) {
    const w = scene.size;
    const shapes: Shape[] = [backdrop(scene, linear(0, 0, w, w, '#9a4a1c', '#6b2f12', '#8a3b12'))];
    // Procedural rust: seeded specks of oxide, pitting and bare metal, plus drips.
    const palette = ['#c0622b', '#4a1e0a', '#d98b4a', '#3a2418', '#7d8a8f'];
    const speck = 1 + w * 0.006;
    for (const [x, y] of scatter(scene, 900, speck, 0)) {
      const size = 1 + scene.random() * (speck - 1);
      shapes.push(
        rect(x, y, size, size * (0.5 + scene.random()), {
          fill: palette[Math.floor(scene.random() * palette.length)] ?? '#c0622b',
          opacity: 0.25 + scene.random() * 0.5,
        }),
      );
    }
    for (let i = 0; i < 14; i++) {
      const x = scene.random() * w;
      const top = scene.random() * w * 0.6;
      shapes.push(
        ...brokenLine(
          x,
          top,
          x + (scene.random() - 0.5) * w * 0.01,
          top + w * (0.1 + scene.random() * 0.25),
          4,
          '#4a1e0a',
          Math.max(1.5, w * 0.006),
          0.35,
        ),
      );
    }
    // The riveted steel plate, its rivets kept off the caption.
    const reach = holdingCaption(scene, w * 0.065);
    shapes.push(
      around(
        scene,
        { ...reach, right: reach.right + w * 0.01, bottom: reach.bottom + w * 0.012 },
        'rgba(20, 8, 2, 0.45)',
        w * 0.012,
      ),
    );
    shapes.push(
      around(
        scene,
        reach,
        linear(0, scene.tile.y, 0, scene.tile.y + scene.tile.height, '#b9c0c5', '#8d969c'),
        w * 0.012,
      ),
    );
    const plate = grow(scene.tile, reach);
    for (const [x, y] of pointsAround(grow(plate, -w * 0.022), w * 0.075)) {
      const r = w * 0.009;
      if (
        scene.caption &&
        intersects(
          { x: x - r, y: y - r, width: 2 * r, height: 2 * r },
          grow(scene.caption, w * 0.01),
        )
      )
        continue;
      shapes.push(...rivet(x, y, r));
    }
    shapes.push(around(scene, w * 0.02, scene.surface, w * 0.008));
    return shapes;
  },
};

const neon: SubTheme = {
  id: 'neon',
  name: 'Neon arcade',
  swatch: ['#14002b', '#ff2fd6'],
  qr: { foreground: '#14002b', background: '#fdf7ff', errorCorrection: 'M' },
  tint: '#ff2fd6',
  codeScale: 0.54,
  caption: { family: arcade, weight: 400, color: '#3df5ff' },
  suggestion: 'Insert coin',
  paint(scene) {
    const w = scene.size;
    const { tile } = scene;
    const [cx] = centre(tile);
    const half = tile.width / 2;
    const shapes: Shape[] = [backdrop(scene, linear(0, 0, 0, w, '#0b0016', '#2a0050', '#14002b'))];
    for (const [x, y] of scatter(scene, 40, w * 0.005, w * 0.03))
      shapes.push(circle(x, y, Math.max(0.8, w * 0.0025), { fill: '#ffffff', opacity: 0.7 }));
    // A huge striped sun setting behind the arcade screen.
    const sunReach = half * 1.75;
    shapes.push(
      organic(
        scene,
        blobPath(scene, () => sunReach, 96),
        linear(
          0,
          tile.y - sunReach,
          0,
          tile.y + tile.height + sunReach,
          '#ffd23f',
          '#ff6a3d',
          '#ff2fd6',
        ),
      ),
    );
    const horizon = tile.y + tile.height + w * 0.03;
    for (let i = 1; i <= 5; i++) {
      const y = tile.y + tile.height * (0.45 + i * 0.1);
      const thickness = Math.max(1, w * 0.004 * i);
      shapes.push(
        rect(0, y, tile.x - w * 0.06, thickness, { fill: '#14002b' }),
        rect(tile.x + tile.width + w * 0.06, y, w, thickness, { fill: '#14002b' }),
      );
    }
    // The perspective grid floor.
    shapes.push(rect(0, horizon, w, w - horizon, { fill: '#25004d' }));
    const line = Math.max(1, w * 0.003);
    for (let i = -9; i <= 9; i++)
      shapes.push(
        ...brokenLine(cx + i * w * 0.02, horizon, cx + i * w * 0.13, w, 1, '#ff2fd6', line, 0.85),
      );
    for (let k = 0; k <= 5; k++) {
      const y = horizon + (w - horizon) * (k / 5) ** 1.7;
      shapes.push(rect(0, y, w, line, { fill: '#ff2fd6', opacity: 0.85 }));
    }
    // The arcade screen: neon-edged bezel around a bright screen.
    shapes.push(
      around(scene, w * 0.062, '#ff2fd6', w * 0.03, 0.35),
      around(scene, w * 0.05, '#1a0033', w * 0.026),
      around(scene, w * 0.042, '#3df5ff', w * 0.022),
      around(scene, w * 0.036, '#1a0033', w * 0.02),
      around(scene, w * 0.016, scene.surface, w * 0.012),
    );
    shapes.push(...sign(scene, '#14002b', '#ff2fd6'));
    return shapes;
  },
};

function reel(cx: number, cy: number, r: number): Shape[] {
  const shapes: Shape[] = [
    circle(cx, cy, r, { fill: '#5c3b1e' }),
    circle(cx, cy, r * 0.55, { fill: '#f4e9d0' }),
    circle(cx, cy, r * 0.25, { fill: '#2b2b2b' }),
  ];
  for (let i = 0; i < 6; i++) {
    const angle = (i * Math.PI) / 3;
    shapes.push(
      rect(
        cx + Math.cos(angle) * r * 0.4 - r * 0.05,
        cy + Math.sin(angle) * r * 0.4 - r * 0.05,
        r * 0.1,
        r * 0.1,
        { fill: '#2b2b2b' },
      ),
    );
  }
  return shapes;
}

const cassette: SubTheme = {
  id: 'cassette',
  name: 'Cassette label',
  swatch: ['#2b2b2b', '#ff8a3d'],
  qr: { foreground: '#1e1e1e', background: '#fbf4e2', errorCorrection: 'M' },
  tint: '#ff8a3d',
  codeScale: 0.5,
  caption: { family: arcade, weight: 400, color: '#2b2b2b' },
  suggestion: 'Side A',
  paint(scene) {
    const w = scene.size;
    const { tile } = scene;
    const [cx, cy] = centre(tile);
    const shapes: Shape[] = [backdrop(scene, '#7fd1c7')];
    for (let i = -6; i < 14; i++)
      shapes.push(...brokenLine(i * w * 0.1, 0, i * w * 0.1 + w, w, 12, '#9fe0d7', w * 0.02, 0.6));
    // The cassette body fills most of the scene, always a little larger than its label.
    const label = holdingCaption(scene, w * 0.05);
    const body = widest(
      { top: w * 0.18, bottom: w * 0.2, left: w * 0.21, right: w * 0.21 },
      { top: label.top + w * 0.03, bottom: label.bottom + w * 0.03 },
    );
    shapes.push(
      around(
        scene,
        {
          top: body.top - w * 0.01,
          bottom: body.bottom + w * 0.02,
          left: body.left - w * 0.01,
          right: body.right + w * 0.02,
        },
        'rgba(0, 0, 0, 0.25)',
        w * 0.05,
      ),
    );
    shapes.push(around(scene, body, '#2b2b2b', w * 0.05));
    const outer = grow(tile, body);
    for (const [x, y] of [
      [outer.x + w * 0.03, outer.y + w * 0.03],
      [outer.x + outer.width - w * 0.03, outer.y + w * 0.03],
      [outer.x + w * 0.03, outer.y + outer.height - w * 0.03],
      [outer.x + outer.width - w * 0.03, outer.y + outer.height - w * 0.03],
    ] as [number, number][]) {
      shapes.push(
        circle(x, y, w * 0.012, { fill: '#9a9a9a' }),
        rect(x - w * 0.008, y - w * 0.002, w * 0.016, w * 0.004, { fill: '#555555' }),
      );
    }
    // Tape windows with reels either side of the label.
    for (const side of [-1, 1]) {
      const rx = side < 0 ? tile.x - w * 0.115 : tile.x + tile.width + w * 0.115;
      shapes.push(
        rect(rx - w * 0.075, cy - w * 0.085, w * 0.15, w * 0.17, {
          fill: '#4a4a4a',
          radius: w * 0.03,
        }),
        ...reel(rx, cy, w * 0.06),
      );
    }
    // The label, striped across the top, holding the code and the caption.
    shapes.push(around(scene, label, scene.surface, w * 0.015));
    const stripeTop = tile.y - label.top + w * 0.008;
    if (scene.captionPosition !== 'top' || !scene.caption) {
      shapes.push(
        rect(
          tile.x - label.left + w * 0.01,
          stripeTop,
          tile.width + label.left + label.right - w * 0.02,
          w * 0.012,
          { fill: '#ff8a3d' },
        ),
      );
      shapes.push(
        rect(
          tile.x - label.left + w * 0.01,
          stripeTop + w * 0.016,
          tile.width + label.left + label.right - w * 0.02,
          w * 0.012,
          { fill: '#1fa39a' },
        ),
      );
    }
    shapes.push(
      path()
        .polygon([
          [cx - w * 0.1, tile.y + tile.height + body.bottom],
          [cx - w * 0.07, tile.y + tile.height + body.bottom - w * 0.03],
          [cx + w * 0.07, tile.y + tile.height + body.bottom - w * 0.03],
          [cx + w * 0.1, tile.y + tile.height + body.bottom],
        ])
        .shape({ fill: '#3d3d3d' }),
    );
    return shapes;
  },
};

const vhs: SubTheme = {
  id: 'vhs',
  name: 'VHS glitch',
  swatch: ['#1d1b2a', '#ff3b5c'],
  qr: { foreground: '#101018', background: '#f5f5ff', errorCorrection: 'M' },
  tint: '#7d7dff',
  codeScale: 0.5,
  caption: { family: arcade, weight: 400, color: '#f3e3c8' },
  suggestion: 'Tracking adjusted',
  paint(scene) {
    const w = scene.size;
    const { tile } = scene;
    const shapes: Shape[] = [backdrop(scene, linear(0, 0, 0, w, '#24213a', '#14121f'))];
    // Scan lines and seeded RGB tearing on the wall behind the TV, never on the code.
    for (let y = 1; y < w; y += 4) shapes.push(...brokenLine(0, y, w, y, 8, '#ffffff', 1, 0.06));
    const colours = ['#ff3b5c', '#3dffb0', '#3dd6ff'];
    for (let i = 0; i < 46; i++) {
      const height = 1 + scene.random() * w * 0.014;
      const width = w * (0.05 + scene.random() * 0.3);
      const x = scene.random() * w;
      const y = scene.random() * w;
      const colour = colours[i % colours.length] ?? '#ff3b5c';
      shapes.push(
        rect(x, y, width, height, { fill: colour, opacity: 0.5 }),
        rect(x + 3 + scene.random() * 6, y, width, height, {
          fill: colours[(i + 1) % colours.length] ?? '#3dd6ff',
          opacity: 0.3,
        }),
      );
    }
    // The TV: antenna, wooden cabinet, knobs, and the screen around the code.
    const cabinet = widest(holdingCaption(scene, w * 0.075), {
      right: w * 0.16,
      bottom: w * 0.075,
    });
    const top = tile.y - cabinet.top;
    const line = Math.max(1.5, w * 0.005);
    shapes.push(
      ...brokenLine(w / 2, top, w * 0.3, top - w * 0.17, 3, '#c7c7c7', line),
      ...brokenLine(w / 2, top, w * 0.72, top - w * 0.15, 3, '#c7c7c7', line),
    );
    shapes.push(around(scene, cabinet, linear(0, top, 0, top + w, '#6b5240', '#4a3828'), w * 0.04));
    const knobX = tile.x + tile.width + cabinet.right * 0.55;
    for (const [i, y] of [tile.y + tile.height * 0.25, tile.y + tile.height * 0.5].entries())
      shapes.push(
        circle(knobX, y, w * (0.026 - i * 0.006), {
          fill: '#d8c3a5',
          stroke: '#2b2118',
          lineWidth: line,
        }),
      );
    for (let k = 0; k < 4; k++)
      shapes.push(
        rect(knobX - w * 0.03, tile.y + tile.height * 0.68 + k * w * 0.018, w * 0.06, w * 0.008, {
          fill: '#2b2118',
        }),
      );
    shapes.push(
      around(scene, w * 0.03, '#141414', w * 0.04),
      around(scene, w * 0.014, scene.surface, w * 0.03),
    );
    return shapes;
  },
};

function speaker(cx: number, cy: number, r: number): Shape[] {
  const shapes: Shape[] = [
    circle(cx, cy, r, { fill: '#1a1a1a', stroke: '#c7c7c7', lineWidth: Math.max(1.5, r * 0.08) }),
  ];
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
  tint: '#ffcf33',
  codeScale: 0.44,
  caption: { family: arcade, weight: 400, color: '#ffcf33' },
  suggestion: 'Turn it up',
  paint(scene) {
    const w = scene.size;
    const { tile } = scene;
    const [, cy] = centre(tile);
    const shapes: Shape[] = [backdrop(scene, '#b5523b')];
    // A brick wall behind.
    const brickH = w / 16;
    for (let row = 0; row < 16; row++) {
      const offset = row % 2 === 0 ? 0 : w / 16;
      for (let x = -offset; x < w; x += w / 8)
        shapes.push(
          rect(x + 1, row * brickH + 1, w / 8 - 2, brickH - 2, {
            fill: row % 3 === 0 ? '#c4624a' : '#a8492f',
            radius: 1,
          }),
        );
    }
    const body = widest(holdingCaption(scene, w * 0.06), {
      left: w * 0.26,
      right: w * 0.26,
      top: w * 0.1,
      bottom: w * 0.08,
    });
    const outer = grow(tile, body);
    // Carry handle and buttons along the top.
    const line = Math.max(3, w * 0.014);
    shapes.push(
      path()
        .moveTo(w * 0.32, outer.y)
        .lineTo(w * 0.32, outer.y - w * 0.06)
        .quadTo(w * 0.32, outer.y - w * 0.09, w * 0.36, outer.y - w * 0.09)
        .lineTo(w * 0.64, outer.y - w * 0.09)
        .quadTo(w * 0.68, outer.y - w * 0.09, w * 0.68, outer.y - w * 0.06)
        .lineTo(w * 0.68, outer.y)
        .shape({ stroke: '#c7c7c7', lineWidth: line, lineCap: 'round' }),
    );
    shapes.push(
      around(
        scene,
        { ...body, right: body.right + w * 0.012, bottom: body.bottom + w * 0.015 },
        'rgba(0, 0, 0, 0.35)',
        w * 0.04,
      ),
      around(
        scene,
        body,
        linear(0, outer.y, 0, outer.y + outer.height, '#3a3a3a', '#202020'),
        w * 0.04,
      ),
    );
    for (let i = 0; i < 4; i++)
      shapes.push(
        rect(tile.x + i * w * 0.07, outer.y + w * 0.025, w * 0.05, w * 0.025, {
          fill: i === 0 ? '#ff3b3b' : '#9a9a9a',
          radius: 2,
        }),
      );
    for (const side of [-1, 1]) {
      const sx = side < 0 ? tile.x - w * 0.14 : tile.x + tile.width + w * 0.14;
      shapes.push(...speaker(sx, cy, w * 0.105));
    }
    shapes.push(
      around(scene, w * 0.03, '#c7c7c7', w * 0.02),
      around(scene, w * 0.022, scene.surface, w * 0.015),
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
