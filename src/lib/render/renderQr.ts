import { analyseCapacity, type CapacityReport } from '../capacity/capacity';
import { DEFAULT_CAPTION, type CaptionSettings, type MeasureText } from './caption';
import { createMatrix, type QrMatrix } from './matrix';
import { planDrawing, type DrawPlan } from './plan';
import type { QrStyle } from './style';
import { findSubTheme, PLAIN_THEME, type ThemeChoice } from './themes';

export interface QrDesign {
  theme: ThemeChoice;
  caption: CaptionSettings;
}

export const DEFAULT_DESIGN: QrDesign = { theme: PLAIN_THEME, caption: DEFAULT_CAPTION };

export type RenderResult =
  | { ok: true; matrix: QrMatrix; plan: DrawPlan; capacity: CapacityReport }
  | { ok: false; error: string; capacity: CapacityReport };

// The single entry point for turning content into something drawable. The preview,
// every download and the scan checks all go through here.
export function renderQr(
  payload: string,
  style: QrStyle,
  design: QrDesign = DEFAULT_DESIGN,
  measure?: MeasureText,
): RenderResult {
  const byteLength = new TextEncoder().encode(payload).length;
  const capacity = analyseCapacity(byteLength, style.errorCorrection);
  if (!capacity.fits) {
    return {
      ok: false,
      error: `Too much content for one QR code: ${capacity.byteLength} bytes, but the limit at level ${style.errorCorrection} is ${capacity.maxByteLength}.`,
      capacity,
    };
  }

  const matrix = createMatrix(payload, style.errorCorrection);
  const planned = planDrawing(matrix, style, {
    subTheme: findSubTheme(design.theme),
    caption: design.caption,
    measure,
  });
  if (!planned.ok) return { ok: false, error: planned.error, capacity };
  return { ok: true, matrix, plan: planned.plan, capacity };
}
