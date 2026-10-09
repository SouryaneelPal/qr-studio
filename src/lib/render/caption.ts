import type { Rect } from './plan';
import type { FontSpec, TextShape } from './shapes';

export const CAPTION_MAX_LENGTH = 40;

export type CaptionPosition = 'top' | 'bottom';

export interface CaptionSettings {
  enabled: boolean;
  text: string;
  position: CaptionPosition;
}

export const DEFAULT_CAPTION: CaptionSettings = { enabled: false, text: '', position: 'bottom' };

const FALLBACK_FONTS =
  "system-ui, -apple-system, 'Segoe UI', 'Noto Color Emoji', 'Apple Color Emoji', sans-serif";

export function cssFont(font: FontSpec): string {
  return `${font.weight} ${font.size}px "${font.family}", ${FALLBACK_FONTS}`;
}

const segmenter = new Intl.Segmenter(undefined, { granularity: 'grapheme' });

// Counts what people see as characters, so an emoji or a Devanagari conjunct counts once.
export function graphemes(text: string): string[] {
  return Array.from(segmenter.segment(text), (segment) => segment.segment);
}

export function limitCaption(text: string): string {
  const characters = graphemes(text);
  return characters.length > CAPTION_MAX_LENGTH
    ? characters.slice(0, CAPTION_MAX_LENGTH).join('')
    : text;
}

export type MeasureText = (text: string, font: FontSpec) => number;

// Without a canvas (unit tests) widths are estimated; the browser always measures real glyphs.
export function estimateWidth(text: string, font: FontSpec): number {
  return graphemes(text).length * font.size * 0.62;
}

let measuringContext:
  CanvasRenderingContext2D | OffscreenCanvasRenderingContext2D | null | undefined;

function getMeasuringContext() {
  if (measuringContext !== undefined) return measuringContext;
  measuringContext = null;
  try {
    if (typeof OffscreenCanvas !== 'undefined') {
      measuringContext = new OffscreenCanvas(1, 1).getContext('2d');
    } else if (typeof document !== 'undefined') {
      measuringContext = document.createElement('canvas').getContext('2d');
    }
  } catch {
    measuringContext = null;
  }
  return measuringContext;
}

export const measureText: MeasureText = (text, font) => {
  const context = getMeasuringContext();
  if (!context) return estimateWidth(text, font);
  context.font = cssFont(font);
  return context.measureText(text).width;
};

export interface CaptionLook {
  family: string;
  weight: number;
  color: string;
  stroke?: string;
}

const MIN_SIZE_RATIO = 0.32;
const START_SIZE_RATIO = 0.52;
const ELLIPSIS = '…';

// Shrinks the caption to fit the strip, down to a readable minimum, then trims it with "…".
export function fitCaption(
  text: string,
  box: Rect,
  look: CaptionLook,
  measure: MeasureText = measureText,
): TextShape | null {
  const trimmed = text.trim();
  if (trimmed === '') return null;

  const maxWidth = box.width * 0.9;
  const minSize = Math.max(11, Math.round(box.height * MIN_SIZE_RATIO));
  const startSize = Math.max(minSize, Math.round(box.height * START_SIZE_RATIO));
  const fontAt = (size: number): FontSpec => ({ family: look.family, weight: look.weight, size });

  let size = startSize;
  let width = measure(trimmed, fontAt(size));
  if (width > maxWidth) {
    size = Math.max(minSize, Math.floor((size * maxWidth) / width));
    width = measure(trimmed, fontAt(size));
  }

  let shown = trimmed;
  if (width > maxWidth) {
    const characters = graphemes(trimmed);
    while (characters.length > 1 && width > maxWidth) {
      characters.pop();
      shown = `${characters.join('').trimEnd()}${ELLIPSIS}`;
      width = measure(shown, fontAt(size));
    }
  }

  return {
    kind: 'text',
    text: shown,
    x: box.x + box.width / 2,
    y: box.y + box.height / 2,
    font: fontAt(size),
    width,
    fill: look.color,
    stroke: look.stroke,
    strokeWidth: look.stroke ? Math.max(1, Math.round(size * 0.12)) : undefined,
  };
}
