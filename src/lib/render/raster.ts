import { cssFont } from './caption';
import { drawToCanvas, planToPixels, type Pixels } from './outputs';
import type { DrawPlan } from './plan';
import type { FontSpec } from './shapes';

type Surface = {
  context: CanvasRenderingContext2D | OffscreenCanvasRenderingContext2D;
  read: () => Pixels;
};

function createSurface(width: number, height: number): Surface | null {
  try {
    if (typeof OffscreenCanvas !== 'undefined') {
      const context = new OffscreenCanvas(width, height).getContext('2d');
      if (context) return { context, read: () => context.getImageData(0, 0, width, height) };
    }
    if (typeof document !== 'undefined') {
      const canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;
      const context = canvas.getContext('2d');
      if (context) return { context, read: () => context.getImageData(0, 0, width, height) };
    }
  } catch {
    // Fall through to the canvas-free rasteriser.
  }
  return null;
}

// The pixels a camera would see: the exact canvas image, frame and caption included.
// Without a canvas (unit tests) it falls back to the code-only rasteriser.
export function rasterize(plan: DrawPlan): Pixels {
  const surface = createSurface(plan.width, plan.height);
  if (!surface) return planToPixels(plan);
  drawToCanvas(surface.context, plan);
  return surface.read();
}

function captionFonts(plan: DrawPlan): FontSpec[] {
  return plan.caption ? [plan.caption.font] : [];
}

// Canvas draws with a fallback font if the real one isn't loaded yet, so wait for it first.
export async function fontsReadyFor(plan: DrawPlan): Promise<void> {
  if (typeof document === 'undefined' || !('fonts' in document)) return;
  await Promise.all(
    captionFonts(plan).map((font) =>
      document.fonts.load(cssFont(font), plan.caption?.text).catch(() => []),
    ),
  );
}

// The @font-face rules already loaded on this page for the caption font, so an SVG can carry them.
export function fontFaceCss(plan: DrawPlan): string {
  if (!plan.caption || typeof document === 'undefined') return '';
  const family = plan.caption.font.family;
  const rules: string[] = [];
  for (const sheet of Array.from(document.styleSheets)) {
    let cssRules: CSSRuleList;
    try {
      cssRules = sheet.cssRules;
    } catch {
      continue;
    }
    for (const rule of Array.from(cssRules)) {
      if (
        rule instanceof CSSFontFaceRule &&
        rule.style.getPropertyValue('font-family').replace(/["']/g, '') === family
      ) {
        rules.push(rule.cssText);
      }
    }
  }
  return rules.join('');
}
