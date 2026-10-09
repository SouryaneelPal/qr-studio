import { parseHexColor } from './color';
import type { DrawPlan } from './plan';

export function drawToCanvas(context: CanvasRenderingContext2D, plan: DrawPlan): void {
  context.fillStyle = plan.background;
  context.fillRect(0, 0, plan.size, plan.size);
  context.fillStyle = plan.foreground;
  for (const rect of plan.darkRects) {
    context.fillRect(rect.x, rect.y, rect.width, rect.height);
  }
}

export function planToSvg(plan: DrawPlan): string {
  const path = plan.darkRects
    .map((rect) => `M${rect.x} ${rect.y}h${rect.width}v${rect.height}h-${rect.width}z`)
    .join('');
  return [
    `<svg xmlns="http://www.w3.org/2000/svg" width="${plan.size}" height="${plan.size}" viewBox="0 0 ${plan.size} ${plan.size}" shape-rendering="crispEdges">`,
    `<rect width="${plan.size}" height="${plan.size}" fill="${plan.background}"/>`,
    `<path fill="${plan.foreground}" d="${path}"/>`,
    '</svg>',
  ].join('');
}

export interface Pixels {
  data: Uint8ClampedArray;
  width: number;
  height: number;
}

// Rasterises the same plan the canvas draws, so decoding works without a canvas (tests, workers).
export function planToPixels(plan: DrawPlan): Pixels {
  const { size } = plan;
  const data = new Uint8ClampedArray(size * size * 4);
  const bg = parseHexColor(plan.background);
  const fg = parseHexColor(plan.foreground);

  for (let i = 0; i < data.length; i += 4) {
    data[i] = bg.r;
    data[i + 1] = bg.g;
    data[i + 2] = bg.b;
    data[i + 3] = 255;
  }
  for (const rect of plan.darkRects) {
    for (let y = rect.y; y < rect.y + rect.height; y++) {
      for (let x = rect.x; x < rect.x + rect.width; x++) {
        const i = (y * size + x) * 4;
        data[i] = fg.r;
        data[i + 1] = fg.g;
        data[i + 2] = fg.b;
      }
    }
  }
  return { data, width: size, height: size };
}
