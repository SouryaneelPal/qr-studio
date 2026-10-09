import { contrastRatio, mixColours } from '../color';
import {
  CAPTION_MAX_LENGTH,
  estimateWidth,
  fitCaption,
  graphemes,
  limitCaption,
  type CaptionPosition,
} from '../caption';
import { createMatrix } from '../matrix';
import { planToSvg } from '../outputs';
import { MAX_BLEND, MIN_SCENE_MARGIN, planDrawing, type DrawPlan, type Rect } from '../plan';
import { renderQr } from '../renderQr';
import { contains, intersects, shapeBounds } from '../shapes';
import { DEFAULT_STYLE, type QrStyle } from '../style';
import { THEMES, type ThemeId } from '.';
import { plain } from './classic';

const CAPTION = 'Scan me for the GDG on Campus SRM party!';
const scenes = THEMES.flatMap((theme) => theme.subThemes.map((sub) => ({ theme, sub })));
const framedScenes = scenes.filter(({ sub }) => sub !== plain);

interface Variant {
  caption: boolean;
  position: CaptionPosition;
  blend: number;
}

function draw(
  themeId: ThemeId,
  subThemeId: string,
  variant: Variant,
  overrides: Partial<QrStyle> = {},
): DrawPlan {
  const sub = THEMES.find((theme) => theme.id === themeId)?.subThemes.find(
    (candidate) => candidate.id === subThemeId,
  );
  if (!sub) throw new Error(`No scene ${themeId}/${subThemeId}`);
  const style = {
    ...DEFAULT_STYLE,
    foreground: sub.qr.foreground,
    background: sub.qr.background,
    ...overrides,
  };
  const design = {
    theme: { themeId, subThemeId },
    caption: { enabled: variant.caption, text: CAPTION, position: variant.position },
    blend: variant.blend,
  };
  const result = renderQr('GDG on Campus SRM', style, design, estimateWidth);
  if (!result.ok) throw new Error(result.error);
  return result.plan;
}

// The corner points of an outline drawn with absolute M/L/Q/C commands.
function outlinePoints(d: string): [number, number][] {
  const points: [number, number][] = [];
  for (const command of d.match(/[MLQC][^MLQCZ]*/g) ?? []) {
    const numbers = command
      .slice(1)
      .trim()
      .split(/[\s,]+/)
      .map(Number);
    const x = numbers[numbers.length - 2];
    const y = numbers[numbers.length - 1];
    if (x !== undefined && y !== undefined) points.push([x, y]);
  }
  return points;
}

function insidePolygon(points: [number, number][], [x, y]: [number, number]): boolean {
  let inside = false;
  for (let i = 0, j = points.length - 1; i < points.length; j = i++) {
    const [xi, yi] = points[i] ?? [0, 0];
    const [xj, yj] = points[j] ?? [0, 0];
    if (yi > y !== yj > y && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi) inside = !inside;
  }
  return inside;
}

function corners(box: Rect): [number, number][] {
  return [
    [box.x, box.y],
    [box.x + box.width, box.y],
    [box.x + box.width, box.y + box.height],
    [box.x, box.y + box.height],
  ];
}

describe('scene catalogue', () => {
  it('has 6 themes with 5 scenes each, all with unique ids', () => {
    expect(THEMES).toHaveLength(6);
    for (const theme of THEMES) expect(theme.subThemes).toHaveLength(5);
    const ids = scenes.map(({ sub }) => sub.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it.each(scenes)(
    '$theme.name / $sub.name keeps 4.5:1 contrast on its surface, even at full blend',
    ({ sub }) => {
      expect(contrastRatio(sub.qr.foreground, sub.qr.background)).toBeGreaterThanOrEqual(4.5);
      expect(
        contrastRatio(sub.qr.foreground, mixColours(sub.qr.background, sub.tint, MAX_BLEND)),
      ).toBeGreaterThanOrEqual(4.5);
    },
  );

  it('every scene suggests a caption within the limit', () => {
    for (const { sub } of scenes) {
      expect(sub.suggestion.trim()).not.toBe('');
      expect(graphemes(sub.suggestion).length).toBeLessThanOrEqual(CAPTION_MAX_LENGTH);
    }
  });
});

describe('scene geometry', () => {
  const variants: Variant[] = [
    { caption: false, position: 'bottom', blend: 0 },
    { caption: true, position: 'bottom', blend: 0 },
    { caption: true, position: 'top', blend: MAX_BLEND },
  ];
  const cases = framedScenes.flatMap(({ theme, sub }) =>
    variants.map((variant) => ({
      theme,
      sub,
      variant,
      label: `caption ${variant.caption ? variant.position : 'off'}, blend ${variant.blend}`,
    })),
  );

  it.each(cases)(
    '$theme.name / $sub.name ($label) is square and keeps all art off the code',
    ({ theme, sub, variant }) => {
      const plan = draw(theme.id, sub.id, variant);
      const { tile } = plan;
      expect(plan.width).toBe(DEFAULT_STYLE.size);
      expect(plan.height).toBe(DEFAULT_STYLE.size);

      // The tile is the code plus a quiet zone of at least 4 modules on every side.
      const quiet = MIN_SCENE_MARGIN * plan.moduleSize;
      expect(plan.codeBounds.x - tile.x).toBeGreaterThanOrEqual(quiet);
      expect(plan.codeBounds.y - tile.y).toBeGreaterThanOrEqual(quiet);
      expect(
        tile.x + tile.width - (plan.codeBounds.x + plan.codeBounds.width),
      ).toBeGreaterThanOrEqual(quiet);
      expect(
        tile.y + tile.height - (plan.codeBounds.y + plan.codeBounds.height),
      ).toBeGreaterThanOrEqual(quiet);

      for (const shape of plan.scene) {
        if (shape.kind !== 'ring') {
          expect(intersects(shapeBounds(shape), tile), `${shape.kind} overlaps the code`).toBe(
            false,
          );
          continue;
        }
        // Rings may surround the code, but their hole must hold the whole tile, and their
        // outline must enclose that hole so nothing paints inside it.
        expect(contains(shape.hole, tile)).toBe(true);
        if (shape.outerPath) {
          const outline = outlinePoints(shape.outerPath);
          for (const point of corners(shape.hole))
            expect(insidePolygon(outline, point), 'outline must enclose the code').toBe(true);
        } else {
          expect(contains(shape.outer, shape.hole)).toBe(true);
        }
      }

      if (variant.caption) {
        expect(plan.caption).not.toBeNull();
        const bounds = plan.caption ? shapeBounds(plan.caption) : tile;
        expect(intersects(bounds, tile)).toBe(false);
        expect(bounds.y + bounds.height <= tile.y).toBe(variant.position === 'top');
        expect(bounds.x).toBeGreaterThanOrEqual(0);
        expect(bounds.x + bounds.width).toBeLessThanOrEqual(plan.width);
      } else {
        expect(plan.caption).toBeNull();
      }
    },
  );

  it.each(framedScenes)(
    '$theme.name / $sub.name only draws its caption holder when the caption is on',
    ({ theme, sub }) => {
      const off = draw(theme.id, sub.id, { caption: false, position: 'bottom', blend: 0 });
      const on = draw(theme.id, sub.id, { caption: true, position: 'bottom', blend: 0 });
      expect(off.caption).toBeNull();
      expect(on.caption).not.toBeNull();
      expect(on.height).toBe(off.height);
    },
  );

  it.each(framedScenes)(
    '$theme.name / $sub.name tints its surface with the blend',
    ({ theme, sub }) => {
      const plain0 = draw(theme.id, sub.id, { caption: false, position: 'bottom', blend: 0 });
      const blended = draw(theme.id, sub.id, {
        caption: false,
        position: 'bottom',
        blend: MAX_BLEND,
      });
      expect(plain0.background).toBe(sub.qr.background);
      expect(blended.background).toBe(mixColours(sub.qr.background, sub.tint, MAX_BLEND));
    },
  );

  it('keeps Classic / Plain identical to the unthemed output, including a margin under 4', () => {
    const matrix = createMatrix('hello', 'M');
    const style = { ...DEFAULT_STYLE, size: 256, margin: 2 };
    const planned = planDrawing(matrix, style);
    if (!planned.ok) throw new Error(planned.error);
    expect(planned.plan.width).toBe(256);
    expect(planned.plan.height).toBe(256);
    expect(planned.plan.scene).toEqual([]);
    expect(planned.plan.tile).toEqual({ x: 0, y: 0, width: 256, height: 256 });
    expect(planned.plan.codeBounds.x).toBe(
      Math.floor((256 - planned.plan.moduleSize * matrix.size) / 2),
    );
  });

  it('keeps a Plain code with a caption square, shrinking the code to make room', () => {
    const plan = draw('classic', 'plain', { caption: true, position: 'bottom', blend: 0 });
    expect(plan.height).toBe(plan.width);
    expect(plan.tile.width).toBeLessThan(plan.width);
  });

  it('raises a scene’s quiet zone to 4 modules even if the margin is set lower', () => {
    const plan = draw(
      'pookie',
      'bubblegum',
      { caption: false, position: 'bottom', blend: 0 },
      { margin: 0 },
    );
    expect(plan.codeBounds.x - plan.tile.x).toBeGreaterThanOrEqual(4 * plan.moduleSize);
  });
});

describe('seeded art', () => {
  it.each([
    ['retro', 'rust'],
    ['retro', 'vhs'],
    ['superhero', 'gamma'],
    ['classic', 'rounded'],
  ] as const)('%s / %s draws identically every time', (themeId, subThemeId) => {
    const variant = { caption: true, position: 'bottom' as const, blend: MAX_BLEND };
    const first = draw(themeId, subThemeId, variant);
    const second = draw(themeId, subThemeId, variant);
    expect(JSON.stringify(second.scene)).toBe(JSON.stringify(first.scene));
    expect(planToSvg(second)).toBe(planToSvg(first));
    expect(first.scene.length).toBeGreaterThan(50);
  });
});

describe('captions', () => {
  const box = { x: 40, y: 400, width: 600, height: 60 };
  const look = { family: 'Bricolage Grotesque', weight: 800, color: '#111111' };

  it('limits captions to 40 characters, counting emoji as one', () => {
    expect(graphemes(limitCaption('x'.repeat(60)))).toHaveLength(40);
    expect(graphemes(limitCaption('👩🏽‍💻'.repeat(45)))).toHaveLength(40);
    expect(limitCaption('short')).toBe('short');
  });

  it('shrinks long captions to fit their holder', () => {
    const shape = fitCaption(CAPTION, box, look, estimateWidth);
    expect(shape?.text).toBe(CAPTION);
    expect(shape?.width ?? Infinity).toBeLessThanOrEqual(box.width);
    expect(shape?.font.size ?? 0).toBeLessThan(Math.round(box.height * 0.52));
  });

  it('never goes below a readable size, trimming with … instead', () => {
    const tiny = { ...box, width: 120 };
    const shape = fitCaption(CAPTION, tiny, look, estimateWidth);
    expect(shape?.font.size).toBeGreaterThanOrEqual(Math.max(11, Math.round(tiny.height * 0.32)));
    expect(shape?.text.endsWith('…')).toBe(true);
    expect(shape?.width ?? Infinity).toBeLessThanOrEqual(tiny.width);
  });

  it('keeps emoji in captions', () => {
    expect(fitCaption('Berry sweet 🍓', box, look, estimateWidth)?.text).toBe('Berry sweet 🍓');
  });

  it('draws nothing for a blank caption', () => {
    expect(fitCaption('   ', box, look, estimateWidth)).toBeNull();
  });

  it('puts the scene and caption into the SVG as well', () => {
    const plan = draw('bollywood', 'marquee', { caption: true, position: 'top', blend: 0 });
    const svg = planToSvg(plan, '@font-face{font-family:"Yatra One"}');
    expect(svg).toContain(`viewBox="0 0 ${plan.width} ${plan.height}"`);
    expect(svg).toContain('font-family="&quot;Yatra One&quot;');
    expect(svg).toContain('<style>@font-face{font-family:"Yatra One"}</style>');
    expect(svg).toContain('fill-rule="evenodd"');
  });
});
