import { capacityAdvice, type CapacityReport } from '../../lib/capacity/capacity';
import { buildPayload } from '../../lib/payload';
import { describeForScreenReader } from '../../lib/payload/describe';
import type { QrInputs, QrType, Warning } from '../../lib/payload/types';
import type { DrawPlan } from '../../lib/render/plan';
import { rasterize } from '../../lib/render/raster';
import { renderQr, type QrDesign } from '../../lib/render/renderQr';
import type { QrStyle } from '../../lib/render/style';
import { readabilityWarnings } from '../../lib/scan/readability';
import { selfCheck, type ScanCheck } from '../../lib/scan/selfCheck';

export interface PreviewRequest {
  type: QrType;
  input: QrInputs[QrType];
  style: QrStyle;
  design: QrDesign;
  // Changes when web fonts finish loading, so captions are re-measured with the real font.
  fontsVersion: number;
}

export type PreviewModel =
  | { state: 'incomplete' }
  | { state: 'error'; message: string; advice: string[] }
  | {
      state: 'ready';
      payload: string;
      plan: DrawPlan;
      capacity: Extract<CapacityReport, { fits: true }>;
      scan: ScanCheck;
      contentWarnings: Warning[];
      readabilityWarnings: Warning[];
      advice: string[];
      altText: string;
    };

export function analysePreview({ type, input, style, design }: PreviewRequest): PreviewModel {
  const build = buildPayload(type, input);
  if (!build.ok) return { state: 'incomplete' };

  const rendered = renderQr(build.payload, style, design);
  const advice = capacityAdvice(rendered.capacity.byteLength, style.errorCorrection);
  if (!rendered.ok || !rendered.capacity.fits) {
    return {
      state: 'error',
      message: rendered.ok ? 'This content doesn’t fit in a QR code.' : rendered.error,
      advice: rendered.capacity.fits ? [] : advice.slice(1),
    };
  }

  return {
    state: 'ready',
    payload: build.payload,
    plan: rendered.plan,
    capacity: rendered.capacity,
    scan: selfCheck(rasterize(rendered.plan), build.payload),
    contentWarnings: build.warnings,
    readabilityWarnings: readabilityWarnings({
      style,
      version: rendered.matrix.version,
      moduleSize: rendered.plan.moduleSize,
    }),
    advice,
    altText: rendered.plan.caption
      ? `${describeForScreenReader(type, input)}, captioned “${rendered.plan.caption.text}”`
      : describeForScreenReader(type, input),
  };
}
