import { circle, path, rect } from '../shapes';
import { inset, outline, perimeterPoints, ring, thinnestEdge } from './kit';
import { CAPTION_FAMILIES, type SubTheme, type Theme } from './types';

const even = (value: number) => ({ top: value, right: value, bottom: value, left: value });

export const plain: SubTheme = {
  id: 'plain',
  name: 'Plain',
  swatch: ['#ffffff', '#111111'],
  qr: { foreground: '#111111', background: '#ffffff', errorCorrection: 'M' },
  insets: even(0),
  captionBand: 0.13,
  caption: { family: CAPTION_FAMILIES.grotesque, weight: 800 },
  suggestion: 'Scan me!',
  // No frame at all: only the caption strip, in the code's own background colour.
  decorate: (context) => (context.caption ? [ring(context, context.style.background)] : []),
};

const roundedCard: SubTheme = {
  id: 'rounded',
  name: 'Rounded card',
  swatch: ['#ffffff', '#1b1b1b'],
  qr: { foreground: '#111111', background: '#ffffff', errorCorrection: 'M' },
  insets: even(0.07),
  captionBand: 0.13,
  caption: { family: CAPTION_FAMILIES.grotesque, weight: 800, color: '#1b1b1b' },
  suggestion: 'Say hello 👋',
  decorate(context) {
    const w = context.width;
    const border = Math.max(2, Math.round(w * 0.008));
    const shadow = border * 2;
    const card = {
      x: border,
      y: border,
      width: w - border - shadow,
      height: context.height - border - shadow,
    };
    const radius = w * 0.06;
    return [
      ring(context, '#f3efe6'),
      ring(context, '#1b1b1b', { ...card, x: card.x + shadow, y: card.y + shadow }, radius),
      ring(context, '#ffffff', card, radius),
      outline(card, border, '#1b1b1b', radius),
    ];
  },
};

const polaroid: SubTheme = {
  id: 'polaroid',
  name: 'Polaroid',
  swatch: ['#fbf8f1', '#8d8577'],
  qr: { foreground: '#1e1d1a', background: '#ffffff', errorCorrection: 'M' },
  insets: { top: 0.07, right: 0.07, bottom: 0.13, left: 0.07 },
  captionBand: 0.12,
  caption: { family: CAPTION_FAMILIES.grotesque, weight: 700, color: '#3a3833' },
  suggestion: 'Wish you were here',
  decorate(context) {
    const w = context.width;
    const shadow = Math.round(w * 0.012);
    const paper = { x: shadow, y: 0, width: w - 2 * shadow, height: context.height - shadow };
    return [
      ring(context, '#e6e0d4'),
      ring(
        context,
        'rgba(60, 50, 35, 0.25)',
        { ...paper, x: paper.x + shadow, y: paper.y + shadow },
        w * 0.01,
      ),
      ring(context, '#fbf8f1', paper, w * 0.01),
    ];
  },
};

const ticket: SubTheme = {
  id: 'ticket',
  name: 'Ticket stub',
  swatch: ['#ffe9b0', '#b5452a'],
  qr: { foreground: '#2a1a12', background: '#fffaf0', errorCorrection: 'M' },
  insets: { top: 0.07, right: 0.07, bottom: 0.07, left: 0.16 },
  captionBand: 0.12,
  caption: { family: CAPTION_FAMILIES.grotesque, weight: 800, color: '#7a2e12' },
  suggestion: 'Admit one',
  decorate(context) {
    const w = context.width;
    const h = context.height;
    const lineX = context.tile.x - Math.round(w * 0.05);
    const notch = Math.round(w * 0.035);
    const shapes = [
      ring(context, '#ffe9b0'),
      outline({ x: 0, y: 0, width: w, height: h }, Math.max(2, Math.round(w * 0.01)), '#b5452a'),
    ];
    // Perforation: a dashed tear line with half-moon notches at each end.
    const dash = Math.max(3, Math.round(w * 0.018));
    for (let y = notch * 1.5; y < h - notch * 1.5; y += dash * 2) {
      shapes.push(rect(lineX - 1, y, Math.max(2, w * 0.006), dash, { fill: '#b5452a' }));
    }
    shapes.push(
      circle(lineX, 0, notch, { fill: '#1f3a5f' }),
      circle(lineX, h, notch, { fill: '#1f3a5f' }),
    );
    // A stub stripe with tiny stars of the stub's own.
    const stubCentre = lineX / 2;
    for (let y = notch * 2.5; y < h - notch * 2.5; y += w * 0.09) {
      shapes.push(circle(stubCentre, y, Math.max(2, w * 0.012), { fill: '#e07a4f' }));
    }
    return shapes;
  },
};

const stamp: SubTheme = {
  id: 'stamp',
  name: 'Postage stamp',
  swatch: ['#ffffff', '#c0392b'],
  qr: { foreground: '#1d1d1f', background: '#ffffff', errorCorrection: 'M' },
  insets: even(0.1),
  captionBand: 0.12,
  caption: { family: CAPTION_FAMILIES.grotesque, weight: 800, color: '#a5281b' },
  suggestion: 'Sent with love',
  decorate(context) {
    const w = context.width;
    const edge = thinnestEdge(context);
    const bite = Math.max(3, Math.round(edge * 0.18));
    const border = Math.round(edge * 0.55);
    const shapes = [ring(context, '#ffffff')];
    // Scalloped edge: bites of the backdrop colour taken out all round.
    for (const [x, y] of perimeterPoints(context, 0, bite * 2.6)) {
      shapes.push(circle(x, y, bite, { fill: '#d9e7ef' }));
    }
    const frameLine = inset({ x: 0, y: 0, width: w, height: context.height }, border);
    shapes.push(outline(frameLine, Math.max(2, Math.round(w * 0.007)), '#c0392b'));
    // A postmark of wavy lines in the top-right corner of the frame.
    const top = context.edges.top;
    if (top.height > edge * 0.6) {
      for (let i = 0; i < 3; i++) {
        const y = top.y + top.height * (0.3 + i * 0.2);
        const x0 = w * 0.62;
        const x1 = w - border - bite * 2;
        if (x1 <= x0) break;
        const wave = path().moveTo(x0, y);
        const step = (x1 - x0) / 4;
        for (let k = 0; k < 4; k++)
          wave.quadTo(
            x0 + step * (k + 0.5),
            y + (k % 2 === 0 ? -1 : 1) * edge * 0.06,
            x0 + step * (k + 1),
            y,
          );
        shapes.push(
          wave.shape({ stroke: '#7d8a96', lineWidth: Math.max(1, w * 0.004), opacity: 0.8 }),
        );
      }
    }
    return shapes;
  },
};

export const classic: Theme = {
  id: 'classic',
  name: 'Classic',
  subThemes: [plain, roundedCard, polaroid, ticket, stamp],
  showcase: 'polaroid',
};
