import type { ErrorCorrection } from '../capacity/capacity';
import { contrastRatio, parseHexColor, relativeLuminance, type Rgb } from '../render/color';
import { planToPixels, type Pixels } from '../render/outputs';
import type { DrawPlan, Rect } from '../render/plan';
import { decodePixels } from './decode';
import { MIN_MARGIN } from './readability';
import {
  boxBlur,
  coverRect,
  crop,
  downscaleAndRestore,
  downscaleByFactor,
  lowLight,
  rotate,
} from './transforms';

export type ConditionId = 'blur' | 'small-print' | 'low-light' | 'tilt' | 'smudge';

export const STRESS_SETTINGS = {
  cameraModulePx: 6,
  blurModules: 1,
  printedModulePx: 1.5,
  lowLight: { contrast: 0.35, brightness: 0.6, noise: 10 },
  tiltDegrees: 7,
  // A quarter of the width (about 6% of the area). At the 12% first planned, even level L
  // survives every case we measured, so the smudge couldn't show what error correction buys.
  smudgeFraction: 0.25,
} as const;

// What a phone camera sees: the code at a few pixels per module, whatever size it was exported at.
export interface Scene {
  pixels: Pixels;
  modules: number;
  modulePx: number;
  codeBounds: Rect;
  background: string;
  // What shows past the image edge when it is tilted: the colour at its corner.
  surround: Rgb;
}

function cornerColour(pixels: Pixels): Rgb {
  return { r: pixels.data[0] ?? 255, g: pixels.data[1] ?? 255, b: pixels.data[2] ?? 255 };
}

// `full` is the finished image (frame and caption included); without one, the code alone is used.
export function captureScene(plan: DrawPlan, full: Pixels = planToPixels(plan)): Scene {
  const modules = Math.round(plan.codeBounds.width / plan.moduleSize);
  // A whole-number reduction keeps every module on the same pixel grid; uneven
  // resampling alone was enough to stop jsQR reading some undamaged codes.
  const factor = Math.max(1, Math.round(plan.moduleSize / STRESS_SETTINGS.cameraModulePx));
  // Start the reduction grid on the code's edge, otherwise every module edge is split
  // across two averaged pixels.
  const { codeBounds } = plan;
  const shiftX = codeBounds.x % factor;
  const shiftY = codeBounds.y % factor;
  const aligned =
    shiftX === 0 && shiftY === 0
      ? full
      : crop(full, shiftX, shiftY, full.width - shiftX, full.height - shiftY);
  return {
    pixels: downscaleByFactor(aligned, factor),
    modules,
    modulePx: plan.moduleSize / factor,
    codeBounds: {
      x: (codeBounds.x - shiftX) / factor,
      y: (codeBounds.y - shiftY) / factor,
      width: Math.round(codeBounds.width / factor),
      height: Math.round(codeBounds.height / factor),
    },
    background: plan.background,
    surround: cornerColour(full),
  };
}

interface Condition {
  id: ConditionId;
  label: string;
  description: string;
  apply: (scene: Scene) => Pixels;
}

const CONDITIONS: readonly Condition[] = [
  {
    id: 'blur',
    label: 'Out of focus',
    description: 'A camera that hasn’t focused, so each square bleeds into its neighbours.',
    // A box 2r + 1 pixels wide, rounded down so it never exceeds one module.
    apply: (scene) =>
      boxBlur(scene.pixels, Math.floor((scene.modulePx * STRESS_SETTINGS.blurModules - 1) / 2)),
  },
  {
    id: 'small-print',
    label: 'Printed small',
    description: 'Printed or shown so small that each square covers only about 1.5 camera pixels.',
    apply: (scene) =>
      downscaleAndRestore(scene.pixels, STRESS_SETTINGS.printedModulePx / scene.modulePx),
  },
  {
    id: 'low-light',
    label: 'Low light',
    description: 'A dim room: contrast drops to about a third, the image darkens and gets grainy.',
    apply: (scene) => lowLight(scene.pixels, STRESS_SETTINGS.lowLight),
  },
  {
    id: 'tilt',
    label: 'Slight tilt',
    description: `The phone is held about ${STRESS_SETTINGS.tiltDegrees}° off straight.`,
    apply: (scene) => rotate(scene.pixels, STRESS_SETTINGS.tiltDegrees, scene.surround),
  },
  {
    id: 'smudge',
    label: 'Smudged corner',
    description: 'A sticker, fold or thumb covers one corner of the code.',
    apply: smudge,
  },
];

// The bottom-right corner is the only one without a finder pattern, so covering it
// tests error correction rather than whether the code can be found at all.
export function smudgeRect(scene: Pick<Scene, 'codeBounds'>): Rect {
  const { codeBounds } = scene;
  const side = Math.max(1, Math.round(codeBounds.width * STRESS_SETTINGS.smudgeFraction));
  return {
    x: codeBounds.x + codeBounds.width - side,
    y: codeBounds.y + codeBounds.height - side,
    width: side,
    height: side,
  };
}

// Version 2+ codes have an alignment pattern 7 modules in from the bottom-right corner.
// jsQR picks any lookalike when it is hidden, which tests jsQR's search rather than the
// code's damage tolerance, so the smudge leaves it visible.
export function alignmentPatternRect(
  scene: Pick<Scene, 'codeBounds' | 'modules' | 'modulePx'>,
): Rect | null {
  const VERSION_1_MODULES = 21;
  if (scene.modules <= VERSION_1_MODULES) return null;
  const firstModule = scene.modules - 9;
  return {
    x: Math.floor(scene.codeBounds.x + firstModule * scene.modulePx),
    y: Math.floor(scene.codeBounds.y + firstModule * scene.modulePx),
    width: Math.ceil(5 * scene.modulePx) + 1,
    height: Math.ceil(5 * scene.modulePx) + 1,
  };
}

function copyRect(target: Pixels, source: Pixels, rect: Rect): void {
  for (let y = rect.y; y < Math.min(source.height, rect.y + rect.height); y++) {
    const start = (y * source.width + rect.x) * 4;
    const end = (y * source.width + Math.min(source.width, rect.x + rect.width)) * 4;
    target.data.set(source.data.subarray(start, end), start);
  }
}

function smudge(scene: Scene): Pixels {
  const covered = coverRect(scene.pixels, smudgeRect(scene), parseHexColor(scene.background));
  const alignment = alignmentPatternRect(scene);
  if (alignment) copyRect(covered, scene.pixels, alignment);
  return covered;
}

export interface StressRequest {
  plan: DrawPlan;
  payload: string;
  errorCorrection: ErrorCorrection;
  margin: number;
  // The finished image from the page's canvas, so frames and captions are tested too.
  pixels?: Pixels;
}

export interface ConditionResult {
  id: ConditionId;
  label: string;
  description: string;
  passed: boolean;
}

export interface StressReport {
  results: ConditionResult[];
  passedCount: number;
  total: number;
  suggestions: string[];
  durationMs: number;
}

const STRONG_CONTRAST = 7;

export function suggestFixes(
  failed: ReadonlySet<ConditionId>,
  request: Omit<StressRequest, 'payload'>,
): string[] {
  const { plan, errorCorrection, margin } = request;
  const suggestions = new Set<string>();
  const contrast = contrastRatio(plan.foreground, plan.background);
  const lowEc = errorCorrection === 'L' || errorCorrection === 'M';

  if (failed.has('smudge') || failed.has('blur') || failed.has('low-light')) {
    if (lowEc)
      suggestions.add(
        'Raise error correction to Q or H so damaged or unclear parts can be rebuilt.',
      );
    else if (errorCorrection === 'Q')
      suggestions.add('Raise error correction to H for the most damage tolerance.');
  }
  if (failed.has('low-light')) {
    if (relativeLuminance(plan.foreground) > relativeLuminance(plan.background)) {
      suggestions.add(
        'Use a dark code on a light background. Inverted codes fail first in poor light.',
      );
    } else if (contrast < STRONG_CONTRAST) {
      suggestions.add(
        `Increase contrast (now ${contrast.toFixed(1)}:1): darken the code colour or lighten the background.`,
      );
    }
  }
  if (failed.has('tilt') && margin < MIN_MARGIN) {
    suggestions.add(
      `Increase the margin to at least ${MIN_MARGIN} modules so the code’s edges stay clear when tilted.`,
    );
  }
  if (failed.has('small-print') || failed.has('blur')) {
    suggestions.add(
      'Make the code bigger when you print or display it, or shorten the content so it has fewer, larger squares.',
    );
  }
  if (suggestions.size === 0 && failed.size > 0) {
    suggestions.add(
      'Shorten the content or raise error correction to give scanners more room for error.',
    );
  }
  return [...suggestions];
}

export function runStressTest(request: StressRequest): StressReport {
  const started = performance.now();
  const scene = captureScene(request.plan, request.pixels);

  const results = CONDITIONS.map((condition) => ({
    id: condition.id,
    label: condition.label,
    description: condition.description,
    passed: decodePixels(condition.apply(scene)) === request.payload,
  }));

  const failed = new Set(results.filter((result) => !result.passed).map((result) => result.id));
  return {
    results,
    passedCount: results.length - failed.size,
    total: results.length,
    suggestions: suggestFixes(failed, request),
    durationMs: performance.now() - started,
  };
}
