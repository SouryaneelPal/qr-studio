import { analyseCapacity, type CapacityReport } from '../capacity/capacity';
import { createMatrix, type QrMatrix } from './matrix';
import { planDrawing, type DrawPlan } from './plan';
import type { QrStyle } from './style';

export type RenderResult =
  | { ok: true; matrix: QrMatrix; plan: DrawPlan; capacity: CapacityReport }
  | { ok: false; error: string; capacity: CapacityReport };

// The single entry point for turning content into something drawable. The preview,
// every download and the scan checks all go through here.
export function renderQr(payload: string, style: QrStyle): RenderResult {
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
  const planned = planDrawing(matrix, style);
  if (!planned.ok) return { ok: false, error: planned.error, capacity };
  return { ok: true, matrix, plan: planned.plan, capacity };
}
