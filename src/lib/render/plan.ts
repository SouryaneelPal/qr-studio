import type { QrMatrix } from './matrix';
import type { QrStyle } from './style';

export interface Rect {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface DrawPlan {
  size: number;
  moduleSize: number;
  background: string;
  foreground: string;
  darkRects: Rect[];
}

export type PlanResult = { ok: true; plan: DrawPlan } | { ok: false; error: string };

// Whole-pixel modules keep edges crisp in every output; leftover pixels widen the quiet zone evenly.
export function planDrawing(matrix: QrMatrix, style: QrStyle): PlanResult {
  const modulesAcross = matrix.size + 2 * style.margin;
  const moduleSize = Math.floor(style.size / modulesAcross);
  if (moduleSize < 1) {
    return {
      ok: false,
      error: `This code needs at least ${modulesAcross} px to draw. Increase the size or reduce the margin.`,
    };
  }

  const offset = Math.floor((style.size - moduleSize * matrix.size) / 2);
  const darkRects: Rect[] = [];

  for (let row = 0; row < matrix.size; row++) {
    let col = 0;
    while (col < matrix.size) {
      if (!matrix.isDark(row, col)) {
        col++;
        continue;
      }
      const start = col;
      while (col < matrix.size && matrix.isDark(row, col)) col++;
      darkRects.push({
        x: offset + start * moduleSize,
        y: offset + row * moduleSize,
        width: (col - start) * moduleSize,
        height: moduleSize,
      });
    }
  }

  return {
    ok: true,
    plan: {
      size: style.size,
      moduleSize,
      background: style.background,
      foreground: style.foreground,
      darkRects,
    },
  };
}
