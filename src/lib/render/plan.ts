import {
  DEFAULT_CAPTION,
  fitCaption,
  measureText,
  type CaptionSettings,
  type MeasureText,
} from './caption';
import { mixColours } from './color';
import type { QrMatrix } from './matrix';
import { seededRandom, type Shape, type TextShape } from './shapes';
import type { QrStyle } from './style';
import { plain } from './themes/classic';
import { keepClear } from './themes/kit';
import type { SceneContext, SubTheme } from './themes/types';

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
  // The code's surface colour: its background, after any blend.
  background: string;
  foreground: string;
  // The solid light area behind the code, quiet zone included. Scene art never paints here.
  tile: Rect;
  // Where the symbol itself sits inside the image, excluding the quiet zone.
  codeBounds: Rect;
  darkRects: Rect[];
  scene: Shape[];
  caption: TextShape | null;
}

export type PlanResult = { ok: true; plan: DrawPlan } | { ok: false; error: string };

export interface SceneRequest {
  subTheme: SubTheme;
  caption: CaptionSettings;
  // How much of the scene's tint to mix into the code's surface, 0 to MAX_BLEND.
  blend: number;
  measure?: MeasureText;
}

// Scanners need a quiet zone; busy art next to the code makes that even more true.
export const MIN_SCENE_MARGIN = 4;

// The highest blend proven (by the scene tests) to keep every scene decodable and at
// least 4 of 5 stress conditions passing.
export const MAX_BLEND = 0.25;

const PLAIN_CAPTION_STRIP = 0.13;
const NO_SCENE: SceneRequest = { subTheme: plain, caption: DEFAULT_CAPTION, blend: 0 };

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

interface Layout {
  tile: Rect;
  caption: Rect | null;
  margin: number;
  surface: string;
}

// Plain has no scene: the code fills the image, shrinking only to make room for a caption.
function plainLayout(
  size: number,
  style: QrStyle,
  caption: CaptionSettings,
  shown: boolean,
): Layout {
  const strip = shown ? Math.round(size * PLAIN_CAPTION_STRIP) : 0;
  const tileSize = size - strip;
  const onTop = caption.position === 'top';
  const tile = {
    x: Math.round((size - tileSize) / 2),
    y: onTop ? strip : 0,
    width: tileSize,
    height: tileSize,
  };
  const captionBox = shown
    ? {
        x: Math.round(size * 0.05),
        y: onTop ? 0 : tileSize,
        width: Math.round(size * 0.9),
        height: strip,
      }
    : null;
  return { tile, caption: captionBox, margin: style.margin, surface: style.background };
}

// Scenes centre the code and leave the space above and below for the art and the caption.
function sceneLayout(size: number, style: QrStyle, request: SceneRequest, shown: boolean): Layout {
  const { subTheme, caption, blend } = request;
  const tileSize = Math.round(size * subTheme.codeScale);
  const offset = Math.round((size - tileSize) / 2);
  const tile = { x: offset, y: offset, width: tileSize, height: tileSize };
  const height = Math.round(Math.min(size * 0.1, offset * 0.62));
  const width = Math.round(size * 0.7);
  const y =
    caption.position === 'top'
      ? Math.round((offset - height) / 2)
      : offset + tileSize + Math.round((size - offset - tileSize - height) / 2);
  return {
    tile,
    caption: shown ? { x: Math.round((size - width) / 2), y, width, height } : null,
    margin: Math.max(MIN_SCENE_MARGIN, style.margin),
    surface: mixColours(style.background, subTheme.tint, Math.min(MAX_BLEND, Math.max(0, blend))),
  };
}

// Lays out the scene, caption and code in a square image `style.size` wide. Whole-pixel modules
// keep edges crisp in every output, and leftover pixels widen the quiet zone evenly.
export function planDrawing(
  matrix: QrMatrix,
  style: QrStyle,
  request: SceneRequest = NO_SCENE,
): PlanResult {
  const { subTheme, caption } = request;
  const size = style.size;
  const isPlain = subTheme === plain;
  const shown = caption.enabled && caption.text.trim() !== '';
  const layout = isPlain
    ? plainLayout(size, style, caption, shown)
    : sceneLayout(size, style, request, shown);
  const { tile } = layout;

  const modulesAcross = matrix.size + 2 * layout.margin;
  const moduleSize = Math.floor(tile.width / modulesAcross);
  if (moduleSize < 1) {
    const needed = Math.ceil((modulesAcross * size) / tile.width);
    return {
      ok: false,
      error: isPlain
        ? `This code needs at least ${needed} px to draw. Increase the size or reduce the margin.`
        : `This code needs an image at least ${needed} px wide in this scene. Increase the size or choose Classic / Plain.`,
    };
  }

  const context: SceneContext = {
    size,
    tile,
    surface: layout.surface,
    caption: layout.caption,
    captionPosition: caption.position,
    style,
    random: seededRandom(seedFor(subTheme.id)),
  };
  const scene = keepClear(tile, subTheme.paint(context));
  const look = {
    family: subTheme.caption.family,
    weight: subTheme.caption.weight,
    color: subTheme.caption.color ?? style.foreground,
    stroke: subTheme.caption.stroke,
  };
  const captionShape = layout.caption
    ? fitCaption(caption.text, layout.caption, look, request.measure ?? measureText)
    : null;

  const offset = Math.floor((tile.width - moduleSize * matrix.size) / 2);
  const codeX = tile.x + offset;
  const codeY = tile.y + offset;
  return {
    ok: true,
    plan: {
      width: size,
      height: size,
      moduleSize,
      background: layout.surface,
      foreground: style.foreground,
      tile,
      codeBounds: {
        x: codeX,
        y: codeY,
        width: moduleSize * matrix.size,
        height: moduleSize * matrix.size,
      },
      darkRects: codeRects(matrix, codeX, codeY, moduleSize),
      scene,
      caption: captionShape,
    },
  };
}
