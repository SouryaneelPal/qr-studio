import { circle, linear, path, rect, type Shape } from '../shapes';
import {
  around,
  backdrop,
  blobPath,
  brokenLine,
  centre,
  feather,
  flower,
  grow,
  holdingCaption,
  organic,
  pointsAround,
  rays,
  ribbon,
  scatter,
  sign,
  twinkle,
} from './kit';
import { CAPTION_FAMILIES, type SubTheme, type Theme } from './types';

const filmy = CAPTION_FAMILIES.filmy;

const marquee: SubTheme = {
  id: 'marquee',
  name: 'Filmy marquee',
  swatch: ['#7a0019', '#ffe066'],
  qr: { foreground: '#3a000c', background: '#fffaf0', errorCorrection: 'M' },
  tint: '#ffd54a',
  codeScale: 0.54,
  caption: { family: filmy, weight: 400, color: '#ffd54a' },
  suggestion: 'Lights, camera, scan!',
  paint(scene) {
    const w = scene.size;
    const { tile } = scene;
    const shapes: Shape[] = [backdrop(scene, '#1a0508')];
    // Velvet curtains drawn back at both sides, and a scalloped valance above.
    const fold = w * 0.03;
    for (let x = 0; x < tile.x - w * 0.06; x += fold) {
      shapes.push(rect(x, 0, fold, w, { fill: linear(x, 0, x + fold, 0, '#8f0020', '#5c0013') }));
      shapes.push(
        rect(w - x - fold, 0, fold, w, {
          fill: linear(w - x - fold, 0, w - x, 0, '#5c0013', '#8f0020'),
        }),
      );
    }
    const valance = tile.y - w * 0.075;
    shapes.push(rect(0, 0, w, valance, { fill: linear(0, 0, 0, valance, '#a3082a', '#6e0018') }));
    for (let x = w * 0.04; x < w; x += w * 0.08)
      shapes.push(circle(x, valance, w * 0.04, { fill: '#6e0018' }));
    // The screen glowing in the dark, ringed with bulbs.
    shapes.push(
      ...feather(scene, {
        pad: w * 0.03,
        spread: w * 0.05,
        radius: w * 0.02,
        colour: '#fff1c2',
        steps: 6,
      }),
      around(scene, w * 0.024, scene.surface, w * 0.01),
    );
    for (const [x, y] of pointsAround(grow(tile, w * 0.05), w * 0.05)) {
      shapes.push(
        circle(x, y, w * 0.016, { fill: '#fff3b0', opacity: 0.3 }),
        circle(x, y, w * 0.009, { fill: '#ffe066', stroke: '#c99700', lineWidth: 1 }),
      );
    }
    // The audience, in silhouette.
    for (let x = w * 0.02; x < w; x += w * 0.075)
      shapes.push(circle(x, w + w * 0.005, w * 0.045, { fill: '#0a0203' }));
    shapes.push(...sign(scene, '#7a0019', '#d4a017'));
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
      .shape({ fill: '#f4c27a', stroke: colour, lineWidth: Math.max(1, s * 0.12) }),
    circle(cx, cy + s * 0.15, s * 0.22, { fill: colour }),
  ];
}

const marigold: SubTheme = {
  id: 'marigold',
  name: 'Marigold mehendi',
  swatch: ['#7a1f2b', '#ff9f1c'],
  qr: { foreground: '#4a2200', background: '#fff6e3', errorCorrection: 'M' },
  tint: '#ff9f1c',
  codeScale: 0.54,
  caption: { family: filmy, weight: 400, color: '#7b3f00' },
  suggestion: 'Shubh aarambh',
  paint(scene) {
    const w = scene.size;
    const { tile } = scene;
    const shapes: Shape[] = [backdrop(scene, linear(0, 0, 0, w, '#8a2433', '#5e1420'))];
    scatter(scene, 10, w * 0.045, w * 0.05).forEach(([x, y], i) =>
      shapes.push(...paisley(x, y, w * 0.07, '#3d0a12', i % 2 === 1)),
    );
    // Strings of marigolds hanging down both sides, with a swag across the top.
    for (const x of [w * 0.05, w * 0.12, w * 0.88, w * 0.95]) {
      for (let y = w * 0.02; y < w; y += w * 0.045)
        shapes.push(
          ...flower(
            x,
            y,
            w * 0.045,
            10,
            Math.round(y / (w * 0.045)) % 2 ? '#ffc93c' : '#ff9f1c',
            '#e65100',
          ),
        );
    }
    const swagTop = w * 0.04;
    const swagLow = tile.y - w * 0.07;
    for (let i = 0; i <= 16; i++) {
      const t = i / 16;
      const x = w * 0.12 + t * w * 0.76;
      const y = swagTop + (swagLow - swagTop) * Math.sin(Math.PI * t);
      shapes.push(...flower(x, y, w * 0.04, 10, i % 2 ? '#ffc93c' : '#ff9f1c', '#e65100'));
      if (i % 3 === 0)
        shapes.push({
          kind: 'ellipse',
          cx: x,
          cy: y + w * 0.03,
          rx: w * 0.008,
          ry: w * 0.02,
          fill: '#3f8a3a',
        });
    }
    // The cream panel with a mehendi border of dots.
    const reach = holdingCaption(scene, w * 0.055);
    shapes.push(
      around(scene, reach, scene.surface, w * 0.02),
      around(
        scene,
        {
          top: reach.top - w * 0.014,
          bottom: reach.bottom - w * 0.014,
          left: reach.left - w * 0.014,
          right: reach.right - w * 0.014,
        },
        '#7b3f00',
        w * 0.014,
      ),
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
        scene.surface,
        w * 0.012,
      ),
    );
    for (const [x, y] of pointsAround(
      grow(tile, {
        top: reach.top - w * 0.007,
        bottom: reach.bottom - w * 0.007,
        left: reach.left - w * 0.007,
        right: reach.right - w * 0.007,
      }),
      w * 0.025,
    ))
      shapes.push(circle(x, y, Math.max(1, w * 0.003), { fill: '#7b3f00' }));
    return shapes;
  },
};

const poster: SubTheme = {
  id: 'poster',
  name: 'Hand-painted poster',
  swatch: ['#ffd400', '#e63946'],
  qr: { foreground: '#1b1b1b', background: '#ffffff', errorCorrection: 'M' },
  tint: '#ffd400',
  codeScale: 0.52,
  caption: { family: filmy, weight: 400, color: '#b00020' },
  suggestion: 'Full filmy vibes',
  paint(scene) {
    const w = scene.size;
    const { tile } = scene;
    const half = tile.width / 2;
    const ink = '#1b1b1b';
    const line = Math.max(1.5, w * 0.004);
    const shapes: Shape[] = [
      backdrop(scene, linear(0, 0, 0, w, '#2ec4b6', '#ffd166', '#ff9f68')),
      ...rays(scene, 20, half * 1.5, ['#ffd400', '#ff9f68'], 0.5, 0.45),
    ];
    // A painted street: bold, outlined buildings, taller at the sides than under the poster.
    let x = 0;
    const colours = ['#e63946', '#1d8a8a', '#ffd400', '#f4a261', '#2a9d8f'];
    let i = 0;
    while (x < w) {
      const width = w * (0.08 + scene.random() * 0.06);
      const underPoster = x + width > tile.x - w * 0.02 && x < tile.x + tile.width + w * 0.02;
      const height = underPoster ? w * 0.13 : w * (0.3 + scene.random() * 0.25);
      shapes.push(
        rect(x, w - height, width, height, {
          fill: colours[i % colours.length] ?? '#e63946',
          stroke: ink,
          lineWidth: line,
        }),
      );
      for (let wy = w - height + w * 0.025; wy < w - w * 0.03; wy += w * 0.05)
        shapes.push(
          rect(x + width * 0.25, wy, width * 0.5, w * 0.022, {
            fill: '#fff3c4',
            stroke: ink,
            lineWidth: 1,
          }),
        );
      x += width;
      i++;
    }
    // Bunting strung across the top.
    const flag = w * 0.05;
    for (let fx = 0, k = 0; fx < w; fx += flag * 1.1, k++) {
      const top = w * 0.03 + Math.sin((fx / w) * Math.PI) * w * 0.04;
      shapes.push(
        path()
          .polygon([
            [fx, top],
            [fx + flag, top],
            [fx + flag / 2, top + flag],
          ])
          .shape({ fill: k % 2 ? '#1d8a8a' : '#e63946', stroke: ink, lineWidth: 1 }),
      );
    }
    // The poster pasted up: thick ink outline, red border, then the code's surface.
    const reach = holdingCaption(scene, w * 0.06);
    shapes.push(
      around(scene, reach, ink),
      around(
        scene,
        {
          top: reach.top - w * 0.008,
          bottom: reach.bottom - w * 0.008,
          left: reach.left - w * 0.008,
          right: reach.right - w * 0.008,
        },
        '#e63946',
      ),
    );
    shapes.push(
      around(
        scene,
        {
          top: reach.top - w * 0.026,
          bottom: reach.bottom - w * 0.026,
          left: reach.left - w * 0.026,
          right: reach.right - w * 0.026,
        },
        scene.surface,
      ),
    );
    return shapes;
  },
};

const rangoli: SubTheme = {
  id: 'rangoli',
  name: 'Rangoli',
  swatch: ['#b5543a', '#e91e63'],
  qr: { foreground: '#2b0a3d', background: '#fffaf0', errorCorrection: 'M' },
  tint: '#e91e63',
  codeScale: 0.5,
  caption: { family: filmy, weight: 400, color: '#7b1fa2' },
  suggestion: 'शुभ आरंभ',
  paint(scene) {
    const w = scene.size;
    const { tile } = scene;
    const half = tile.width / 2;
    const [cx, cy] = centre(tile);
    const base = half * Math.SQRT2;
    const shapes: Shape[] = [backdrop(scene, '#b5543a')];
    for (let k = 1; k < 8; k++)
      shapes.push(
        ...brokenLine(0, (k * w) / 8, w, (k * w) / 8, 8, '#8f3f2a', 1, 0.6),
        ...brokenLine((k * w) / 8, 0, (k * w) / 8, w, 8, '#8f3f2a', 1, 0.6),
      );
    // Rings of coloured powder, each a petalled outline around the code, largest first.
    const layers: [number, number, number, string][] = [
      [0.2, 0.05, 16, '#e91e63'],
      [0.16, 0.04, 16, '#ff9800'],
      [0.12, 0.035, 8, '#ffeb3b'],
      [0.085, 0.03, 8, '#009688'],
      [0.055, 0.02, 16, '#7b1fa2'],
    ];
    for (const [extra, petal, count, colour] of layers) {
      shapes.push(
        organic(
          scene,
          blobPath(
            scene,
            (angle) => base + w * extra + w * petal * Math.abs(Math.cos((angle * count) / 2)),
            192,
          ),
          colour,
        ),
      );
    }
    for (let i = 0; i < 32; i++) {
      const angle = (i / 32) * Math.PI * 2;
      const r = base + w * 0.235;
      shapes.push(
        circle(cx + Math.cos(angle) * r, cy + Math.sin(angle) * r, w * 0.008, { fill: '#ffffff' }),
      );
    }
    shapes.push(
      organic(
        scene,
        blobPath(scene, () => base + w * 0.02, 96),
        '#ffffff',
      ),
      organic(
        scene,
        blobPath(scene, () => base + w * 0.012, 96),
        scene.surface,
      ),
    );
    shapes.push(...sign(scene, '#fffaf0', '#7b1fa2'));
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
  tint: '#ffb84d',
  codeScale: 0.52,
  caption: { family: filmy, weight: 400, color: '#2a0845' },
  suggestion: 'Happy Diwali ✨',
  paint(scene) {
    const w = scene.size;
    const { tile } = scene;
    const [cx] = centre(tile);
    const shapes: Shape[] = [backdrop(scene, linear(0, 0, w, w, '#1e0536', '#4a1a8a', '#1e0536'))];
    // Coloured disco lights washing in from the corners.
    for (const [x, y, colour] of [
      [0, 0, '#ff3fa4'],
      [w, 0, '#3fd0ff'],
      [0, w, '#ffd23f'],
      [w, w, '#7cff6b'],
    ] as [number, number, string][]) {
      shapes.push(
        backdrop(scene, {
          kind: 'radial',
          cx: x,
          cy: y,
          r: w * 0.55,
          stops: [
            [0, colour, 0.45],
            [1, colour, 0],
          ],
        }),
      );
    }
    // A mirror ball in the top gap, scattering sparkles.
    const ballY = tile.y / 2;
    const ballR = Math.min(w * 0.06, tile.y * 0.35);
    shapes.push(circle(cx, ballY, ballR, { fill: '#c9c9d9' }));
    for (let y = ballY - ballR; y < ballY + ballR; y += ballR / 4) {
      for (let x = cx - ballR; x < cx + ballR; x += ballR / 4) {
        if (Math.hypot(x + ballR / 8 - cx, y + ballR / 8 - ballY) < ballR * 0.9)
          shapes.push(
            rect(x + 1, y + 1, ballR / 4 - 2, ballR / 4 - 2, {
              fill: (x + y) % 3 > 1.5 ? '#ffffff' : '#9a9ab0',
            }),
          );
      }
    }
    const colours = ['#ffd700', '#ff7ac8', '#7ae7ff'];
    scatter(scene, 34, w * 0.02, w * 0.04).forEach(([x, y], i) =>
      shapes.push(
        twinkle(
          x,
          y,
          w * (0.008 + scene.random() * 0.012),
          colours[i % colours.length] ?? '#ffd700',
        ),
      ),
    );
    // Diyas along the bottom.
    for (let x = w * 0.06; x < w; x += w * 0.11) shapes.push(...diya(x, w - w * 0.05, w * 0.06));
    // The glowing panel.
    shapes.push(
      backdrop(scene, {
        kind: 'radial',
        cx,
        cy: tile.y + tile.height / 2,
        r: w * 0.55,
        stops: [
          [0, '#ffb84d', 0.7],
          [1, '#ffb84d', 0],
        ],
      }),
    );
    shapes.push(
      ...feather(scene, {
        pad: w * 0.03,
        spread: w * 0.045,
        radius: w * 0.03,
        colour: '#fff0c9',
        steps: 6,
      }),
      around(scene, w * 0.024, scene.surface, w * 0.02),
    );
    shapes.push(...ribbon(scene, '#ffd700', '#c9a400', '#8a6d00'));
    return shapes;
  },
};

export const bollywood: Theme = {
  id: 'bollywood',
  name: 'Bollywood',
  subThemes: [marquee, marigold, poster, rangoli, discoDiwali],
  showcase: 'marquee',
};
