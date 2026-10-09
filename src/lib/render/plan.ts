import {
  DEFAULT_CAPTION,
  fitCaption,
  measureText,
  type CaptionSettings,
  type MeasureText,
} from './caption';
import type { QrMatrix } from './matrix';
import { rect, seededRandom, type Shape, type TextShape } from './shapes';
import type { QrStyle } from './style';
import { plain } from './themes/classic';
import type { FrameContext, SubTheme } from './themes/types';

export interface Rect {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface DrawPlan {
  width: number;
  height: number;
  moduleSize: number;
  background: string;
  foreground: string;
  // The plain light area behind the code, quiet zone included. Frames never paint here.
  tile: Rect;
  // Where the symbol itself sits inside the image, excluding the quiet zone.
  codeBounds: Rect;
  darkRects: Rect[];
  frame: Shape[];
  caption: TextShape | null;
}

export type PlanResult = { ok: true; plan: DrawPlan } | { ok: false; error: string };

export interface FrameRequest {
  subTheme: SubTheme;
  caption: CaptionSettings;
  measure?: MeasureText;
}

// Scanners need a quiet zone; a busy frame makes that even more true, so framed codes keep at least this.
export const MIN_FRAMED_MARGIN = 4;

const NO_FRAME: FrameRequest = { subTheme: plain, caption: DEFAULT_CAPTION };

function seedFor(id: string): number {
  let hash = 2166136261;
  for (const char of id) hash = Math.imul(hash ^ char.charCodeAt(0), 16777619);
  return hash >>> 0;
}

function codeRects(matrix: QrMatrix, originX: number, originY: number, moduleSize: number): Rect[] {
  const rects: Rect[] = [];
  for (let row = 0; row < matrix.size; row++) {
    let col = 0;
    while (col < matrix.size) {
      if (!matrix.isDark(row, col)) {
        col++;
        continue;
      }
      const start = col;
      while (col < matrix.size && matrix.isDark(row, col)) col++;
      rects.push({
        x: originX + start * moduleSize,
        y: originY + row * moduleSize,
        width: (col - start) * moduleSize,
        height: moduleSize,
      });
    }
  }
  return rects;
}

// Lays out frame, caption strip and code. The image is `style.size` wide; a frame or caption
// makes it taller. Whole-pixel modules keep edges crisp in every output, and leftover pixels
// widen the quiet zone evenly.
export function planDrawing(
  matrix: QrMatrix,
  style: QrStyle,
  frame: FrameRequest = NO_FRAME,
): PlanResult {
  const { subTheme, caption } = frame;
  const width = style.size;
  const px = (fraction: number) => Math.round(width * fraction);
  const left = px(subTheme.insets.left);
  const right = px(subTheme.insets.right);
  const topInset = px(subTheme.insets.top);
  const bottomInset = px(subTheme.insets.bottom);
  const tileSize = width - left - right;

  const framed = subTheme !== plain;
  const margin = framed ? Math.max(MIN_FRAMED_MARGIN, style.margin) : style.margin;
  const modulesAcross = matrix.size + 2 * margin;
  const moduleSize = Math.floor(tileSize / modulesAcross);
  if (moduleSize < 1) {
    return {
      ok: false,
      error: framed
        ? `This code needs an image at least ${Math.ceil(modulesAcross / (1 - subTheme.insets.left - subTheme.insets.right))} px wide in this frame. Increase the size or choose Classic / Plain.`
        : `This code needs at least ${modulesAcross} px to draw. Increase the size or reduce the margin.`,
    };
  }

  const captionShown = caption.enabled && caption.text.trim() !== '';
  const strip = captionShown ? px(subTheme.captionBand) : 0;
  const onTop = caption.position === 'top';
  const tileY = topInset + (onTop ? strip : 0);
  const height = topInset + strip + tileSize + bottomInset;
  const tile = { x: left, y: tileY, width: tileSize, height: tileSize };
  const captionBox = captionShown
    ? { x: left, y: onTop ? topInset : tileY + tileSize, width: tileSize, height: strip }
    : null;

  const aboveCode = captionBox && onTop ? captionBox.y : tile.y;
  const belowCode = captionBox && !onTop ? captionBox.y + captionBox.height : tile.y + tile.height;
  const context: FrameContext = {
    width,
    height,
    tile,
    caption: captionBox,
    captionPosition: caption.position,
    edges: {
      top: { x: 0, y: 0, width, height: aboveCode },
      bottom: { x: 0, y: belowCode, width, height: height - belowCode },
      left: { x: 0, y: aboveCode, width: left, height: belowCode - aboveCode },
      right: {
        x: tile.x + tile.width,
        y: aboveCode,
        width: width - tile.x - tile.width,
        height: belowCode - aboveCode,
      },
    },
    style,
    random: seededRandom(seedFor(subTheme.id)),
  };

  const shapes = subTheme.decorate(context);
  const look = {
    family: subTheme.caption.family,
    weight: subTheme.caption.weight,
    color: subTheme.caption.color ?? style.foreground,
    stroke: subTheme.caption.stroke,
  };
  if (captionBox && subTheme.caption.band) {
    shapes.push(
      rect(captionBox.x, captionBox.y, captionBox.width, captionBox.height, {
        fill: subTheme.caption.band,
      }),
    );
  }
  const captionShape = captionBox
    ? fitCaption(caption.text, captionBox, look, frame.measure ?? measureText)
    : null;

  const offset = Math.floor((tileSize - moduleSize * matrix.size) / 2);
  const codeX = tile.x + offset;
  const codeY = tile.y + offset;
  return {
    ok: true,
    plan: {
      width,
      height,
      moduleSize,
      background: style.background,
      foreground: style.foreground,
      tile,
      codeBounds: {
        x: codeX,
        y: codeY,
        width: moduleSize * matrix.size,
        height: moduleSize * matrix.size,
      },
      darkRects: codeRects(matrix, codeX, codeY, moduleSize),
      frame: shapes,
      caption: captionShape,
    },
  };
}
