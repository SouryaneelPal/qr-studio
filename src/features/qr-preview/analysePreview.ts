import { capacityAdvice, type CapacityReport } from '../../lib/capacity/capacity';
import { buildPayload } from '../../lib/payload';
import { describeForScreenReader } from '../../lib/payload/describe';
import type { QrInputs, QrType, Warning } from '../../lib/payload/types';
import type { DrawPlan } from '../../lib/render/plan';
import { renderQr } from '../../lib/render/renderQr';
import type { QrStyle } from '../../lib/render/style';
import { readabilityWarnings } from '../../lib/scan/readability';
import { selfCheck, type ScanCheck } from '../../lib/scan/selfCheck';

export interface PreviewRequest {
  type: QrType;
  input: QrInputs[QrType];
  style: QrStyle;
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

export function analysePreview({ type, input, style }: PreviewRequest): PreviewModel {
  const build = buildPayload(type, input);
  if (!build.ok) return { state: 'incomplete' };

  const rendered = renderQr(build.payload, style);
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
    scan: selfCheck(rendered.plan, build.payload),
    contentWarnings: build.warnings,
    readabilityWarnings: readabilityWarnings({
      style,
      version: rendered.matrix.version,
      moduleSize: rendered.plan.moduleSize,
    }),
    advice,
    altText: describeForScreenReader(type, input),
  };
}
