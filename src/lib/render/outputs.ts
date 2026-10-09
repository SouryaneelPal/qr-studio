import { cssFont } from './caption';
import { parseHexColor } from './color';
import type { DrawPlan, Rect } from './plan';
import type { Paint, Shape, TextShape } from './shapes';

type Context2D = CanvasRenderingContext2D | OffscreenCanvasRenderingContext2D;

function canvasPaint(context: Context2D, paint: Paint): string | CanvasGradient {
  if (typeof paint === 'string') return paint;
  const gradient = context.createLinearGradient(paint.x1, paint.y1, paint.x2, paint.y2);
  for (const [offset, color] of paint.stops) gradient.addColorStop(offset, color);
  return gradient;
}

function addRect(target: Path2D, box: Rect, radius = 0) {
  if (radius > 0) target.roundRect(box.x, box.y, box.width, box.height, radius);
  else target.rect(box.x, box.y, box.width, box.height);
}

function drawText(context: Context2D, shape: TextShape) {
  context.font = cssFont(shape.font);
  context.textAlign = 'center';
  context.textBaseline = 'middle';
  if (shape.stroke && shape.strokeWidth) {
    context.lineJoin = 'round';
    context.lineWidth = shape.strokeWidth * 2;
    context.strokeStyle = shape.stroke;
    context.strokeText(shape.text, shape.x, shape.y);
  }
  context.fillStyle = shape.fill;
  context.fillText(shape.text, shape.x, shape.y);
}

function drawShape(context: Context2D, shape: Shape) {
  if (shape.kind === 'text') {
    drawText(context, shape);
    return;
  }
  context.save();
  if (shape.kind === 'ring') {
    const outline = new Path2D();
    addRect(outline, shape.outer, shape.outerRadius);
    addRect(outline, shape.hole, shape.holeRadius);
    context.fillStyle = canvasPaint(context, shape.fill);
    context.fill(outline, 'evenodd');
    context.restore();
    return;
  }

  const outline = new Path2D();
  switch (shape.kind) {
    case 'rect':
      addRect(outline, shape, shape.radius);
      break;
    case 'circle':
      outline.arc(shape.cx, shape.cy, shape.r, 0, Math.PI * 2);
      break;
    case 'ellipse':
      outline.ellipse(shape.cx, shape.cy, shape.rx, shape.ry, shape.rotation ?? 0, 0, Math.PI * 2);
      break;
    case 'path':
      outline.addPath(new Path2D(shape.d));
      context.lineCap = shape.lineCap ?? 'butt';
      break;
  }
  context.globalAlpha = shape.opacity ?? 1;
  if (shape.fill) {
    context.fillStyle = canvasPaint(context, shape.fill);
    context.fill(outline);
  }
  if (shape.stroke) {
    context.strokeStyle = shape.stroke;
    context.lineWidth = shape.lineWidth ?? 1;
    context.lineJoin = 'round';
    context.stroke(outline);
  }
  context.restore();
}

// Frame first, then the solid tile and the code on top, then the caption: the same order
// the SVG uses, so both outputs layer identically.
export function drawToCanvas(context: Context2D, plan: DrawPlan): void {
  context.clearRect(0, 0, plan.width, plan.height);
  for (const shape of plan.frame) drawShape(context, shape);
  context.fillStyle = plan.background;
  context.fillRect(plan.tile.x, plan.tile.y, plan.tile.width, plan.tile.height);
  context.fillStyle = plan.foreground;
  for (const rect of plan.darkRects) {
    context.fillRect(rect.x, rect.y, rect.width, rect.height);
  }
  if (plan.caption) drawText(context, plan.caption);
}

function escapeXml(value: string): string {
  return value.replace(/[&<>"']/g, (char) => `&#${char.charCodeAt(0)};`);
}

function n(value: number): string {
  return String(Math.round(value * 100) / 100);
}

function svgRectPath(box: Rect, radius = 0): string {
  if (radius <= 0)
    return `M${n(box.x)} ${n(box.y)}h${n(box.width)}v${n(box.height)}h${n(-box.width)}z`;
  const r = Math.min(radius, box.width / 2, box.height / 2);
  return [
    `M${n(box.x + r)} ${n(box.y)}`,
    `H${n(box.x + box.width - r)}`,
    `A${n(r)} ${n(r)} 0 0 1 ${n(box.x + box.width)} ${n(box.y + r)}`,
    `V${n(box.y + box.height - r)}`,
    `A${n(r)} ${n(r)} 0 0 1 ${n(box.x + box.width - r)} ${n(box.y + box.height)}`,
    `H${n(box.x + r)}`,
    `A${n(r)} ${n(r)} 0 0 1 ${n(box.x)} ${n(box.y + box.height - r)}`,
    `V${n(box.y + r)}`,
    `A${n(r)} ${n(r)} 0 0 1 ${n(box.x + r)} ${n(box.y)}z`,
  ].join('');
}

class SvgPaints {
  readonly defs: string[] = [];

  ref(paint: Paint): string {
    if (typeof paint === 'string') return paint;
    const id = `g${this.defs.length}`;
    const stops = paint.stops
      .map(([offset, color]) => `<stop offset="${n(offset)}" stop-color="${color}"/>`)
      .join('');
    this.defs.push(
      `<linearGradient id="${id}" gradientUnits="userSpaceOnUse" x1="${n(paint.x1)}" y1="${n(paint.y1)}" x2="${n(paint.x2)}" y2="${n(paint.y2)}">${stops}</linearGradient>`,
    );
    return `url(#${id})`;
  }
}

function svgText(shape: TextShape): string {
  const stroke =
    shape.stroke && shape.strokeWidth
      ? ` stroke="${shape.stroke}" stroke-width="${n(shape.strokeWidth * 2)}" stroke-linejoin="round" paint-order="stroke"`
      : '';
  // textLength pins the line to the width measured for the preview, whatever font the viewer has.
  return `<text x="${n(shape.x)}" y="${n(shape.y)}" text-anchor="middle" dominant-baseline="central" font-family="&quot;${escapeXml(shape.font.family)}&quot;, system-ui, sans-serif" font-weight="${shape.font.weight}" font-size="${n(shape.font.size)}" fill="${shape.fill}"${stroke} textLength="${n(shape.width)}" lengthAdjust="spacingAndGlyphs">${escapeXml(shape.text)}</text>`;
}

function svgShape(shape: Shape, paints: SvgPaints): string {
  if (shape.kind === 'text') return svgText(shape);
  if (shape.kind === 'ring') {
    return `<path fill-rule="evenodd" fill="${paints.ref(shape.fill)}" d="${svgRectPath(shape.outer, shape.outerRadius)}${svgRectPath(shape.hole, shape.holeRadius)}"/>`;
  }
  const attributes = [
    `fill="${shape.fill ? paints.ref(shape.fill) : 'none'}"`,
    shape.stroke
      ? `stroke="${shape.stroke}" stroke-width="${n(shape.lineWidth ?? 1)}" stroke-linejoin="round"`
      : '',
    shape.opacity !== undefined ? `opacity="${n(shape.opacity)}"` : '',
  ]
    .filter(Boolean)
    .join(' ');
  switch (shape.kind) {
    case 'rect':
      return `<path ${attributes} d="${svgRectPath(shape, shape.radius)}"/>`;
    case 'circle':
      return `<circle cx="${n(shape.cx)}" cy="${n(shape.cy)}" r="${n(shape.r)}" ${attributes}/>`;
    case 'ellipse': {
      const turn = shape.rotation
        ? ` transform="rotate(${n((shape.rotation * 180) / Math.PI)} ${n(shape.cx)} ${n(shape.cy)})"`
        : '';
      return `<ellipse cx="${n(shape.cx)}" cy="${n(shape.cy)}" rx="${n(shape.rx)}" ry="${n(shape.ry)}"${turn} ${attributes}/>`;
    }
    case 'path':
      return `<path ${attributes}${shape.lineCap ? ` stroke-linecap="${shape.lineCap}"` : ''} d="${shape.d}"/>`;
  }
}

// `fontCss` carries @font-face rules for the caption font so the file looks the same anywhere.
export function planToSvg(plan: DrawPlan, fontCss = ''): string {
  const paints = new SvgPaints();
  const frame = plan.frame.map((shape) => svgShape(shape, paints)).join('');
  const code = plan.darkRects
    .map((rect) => `M${rect.x} ${rect.y}h${rect.width}v${rect.height}h-${rect.width}z`)
    .join('');
  const caption = plan.caption ? svgText(plan.caption) : '';
  const style = fontCss ? `<style>${fontCss}</style>` : '';
  const defs =
    paints.defs.length > 0 || style ? `<defs>${style}${paints.defs.join('')}</defs>` : '';
  return [
    `<svg xmlns="http://www.w3.org/2000/svg" width="${plan.width}" height="${plan.height}" viewBox="0 0 ${plan.width} ${plan.height}">`,
    defs,
    frame,
    `<g shape-rendering="crispEdges">`,
    `<rect x="${plan.tile.x}" y="${plan.tile.y}" width="${plan.tile.width}" height="${plan.tile.height}" fill="${plan.background}"/>`,
    `<path fill="${plan.foreground}" d="${code}"/>`,
    '</g>',
    caption,
    '</svg>',
  ].join('');
}

export interface Pixels {
  data: Uint8ClampedArray;
  width: number;
  height: number;
}

function frameBase(plan: DrawPlan): string {
  const base = plan.frame.find((shape) => shape.kind === 'ring');
  if (base?.kind !== 'ring') return plan.background;
  const paint = base.fill;
  const colour = typeof paint === 'string' ? paint : (paint.stops[0]?.[1] ?? plan.background);
  return /^#[0-9a-f]{6}$/i.test(colour) ? colour : plan.background;
}

// Rasterises the code and its tile without a canvas, for places that have none (unit tests).
// Frame artwork and captions are reduced to the frame's base colour; in a browser, decoding
// always uses the real canvas image instead (see raster.ts).
export function planToPixels(plan: DrawPlan): Pixels {
  const { width, height } = plan;
  const data = new Uint8ClampedArray(width * height * 4);
  const outside = parseHexColor(frameBase(plan));
  const bg = parseHexColor(plan.background);
  const fg = parseHexColor(plan.foreground);
  const { tile } = plan;

  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const inTile =
        x >= tile.x && x < tile.x + tile.width && y >= tile.y && y < tile.y + tile.height;
      const colour = inTile ? bg : outside;
      const i = (y * width + x) * 4;
      data[i] = colour.r;
      data[i + 1] = colour.g;
      data[i + 2] = colour.b;
      data[i + 3] = 255;
    }
  }
  for (const rect of plan.darkRects) {
    for (let y = rect.y; y < rect.y + rect.height; y++) {
      for (let x = rect.x; x < rect.x + rect.width; x++) {
        const i = (y * width + x) * 4;
        data[i] = fg.r;
        data[i + 1] = fg.g;
        data[i + 2] = fg.b;
      }
    }
  }
  return { data, width, height };
}
