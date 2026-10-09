import { contrastRatio } from '../color';
import { CAPTION_MAX_LENGTH, estimateWidth, fitCaption, graphemes, limitCaption } from '../caption';
import { createMatrix } from '../matrix';
import { planToSvg } from '../outputs';
import { planDrawing, MIN_FRAMED_MARGIN } from '../plan';
import { renderQr } from '../renderQr';
import { contains, intersects, shapeBounds } from '../shapes';
import { DEFAULT_STYLE, type QrStyle } from '../style';
import { findSubTheme, THEMES } from '.';
import { plain } from './classic';

const CAPTION = 'Scan me for the GDG on Campus SRM party!';
const allSubThemes = THEMES.flatMap((theme) => theme.subThemes.map((sub) => ({ theme, sub })));

function framed(
  themeId: string,
  subThemeId: string,
  caption: { enabled: boolean; text: string; position: 'top' | 'bottom' },
  overrides: Partial<QrStyle> = {},
) {
  const sub = findSubTheme({ themeId: themeId as never, subThemeId });
  const style = {
    ...DEFAULT_STYLE,
    foreground: sub.qr.foreground,
    background: sub.qr.background,
    ...overrides,
  };
  const result = renderQr(
    'GDG on Campus SRM',
    style,
    { theme: { themeId: themeId as never, subThemeId }, caption },
    estimateWidth,
  );
  if (!result.ok) throw new Error(result.error);
  return result.plan;
}

describe('theme catalogue', () => {
  it('has 6 themes with 5 sub-themes each, all with unique ids', () => {
    expect(THEMES).toHaveLength(6);
    for (const theme of THEMES) expect(theme.subThemes).toHaveLength(5);
    const ids = allSubThemes.map(({ sub }) => sub.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it.each(allSubThemes)(
    '$theme.name / $sub.name has QR colours of at least 4.5:1, dark on light',
    ({ sub }) => {
      expect(contrastRatio(sub.qr.foreground, sub.qr.background)).toBeGreaterThanOrEqual(4.5);
    },
  );

  it('every sub-theme suggests a caption within the limit', () => {
    for (const { sub } of allSubThemes) {
      expect(sub.suggestion.trim()).not.toBe('');
      expect(graphemes(sub.suggestion).length).toBeLessThanOrEqual(CAPTION_MAX_LENGTH);
    }
  });
});

describe('frame geometry', () => {
  const positions = ['top', 'bottom'] as const;
  const cases = allSubThemes.flatMap(({ theme, sub }) =>
    positions.map((position) => ({ theme, sub, position })),
  );

  it.each(cases)(
    '$theme.name / $sub.name with the caption at the $position keeps clear of the code',
    ({ theme, sub, position }) => {
      const plan = framed(theme.id, sub.id, { enabled: true, text: CAPTION, position });
      const { tile } = plan;

      // The tile holds the code plus a quiet zone of at least 4 modules on every side.
      const quiet = MIN_FRAMED_MARGIN * plan.moduleSize;
      expect(plan.codeBounds.x - tile.x).toBeGreaterThanOrEqual(sub === plain ? 0 : quiet);
      expect(
        tile.x + tile.width - (plan.codeBounds.x + plan.codeBounds.width),
      ).toBeGreaterThanOrEqual(sub === plain ? 0 : quiet);

      for (const shape of plan.frame) {
        if (shape.kind === 'ring') {
          expect(contains(shape.hole, tile), 'a frame band covers the code').toBe(true);
        } else {
          expect(intersects(shapeBounds(shape), tile), `${shape.kind} overlaps the code`).toBe(
            false,
          );
        }
      }
      expect(plan.caption).not.toBeNull();
      if (plan.caption) expect(intersects(shapeBounds(plan.caption), tile)).toBe(false);
      if (plan.caption) {
        const above = shapeBounds(plan.caption).y + shapeBounds(plan.caption).height <= tile.y;
        expect(above).toBe(position === 'top');
      }
    },
  );

  it.each(allSubThemes)(
    '$theme.name / $sub.name closes up when the caption is off',
    ({ theme, sub }) => {
      const off = framed(theme.id, sub.id, { enabled: false, text: CAPTION, position: 'bottom' });
      const on = framed(theme.id, sub.id, { enabled: true, text: CAPTION, position: 'bottom' });
      expect(off.caption).toBeNull();
      expect(on.height).toBeGreaterThan(off.height);
    },
  );

  it('keeps Classic / Plain identical to the unframed output', () => {
    const matrix = createMatrix('hello', 'M');
    const style = { ...DEFAULT_STYLE, size: 256, margin: 2 };
    const planned = planDrawing(matrix, style);
    if (!planned.ok) throw new Error(planned.error);
    expect(planned.plan.width).toBe(256);
    expect(planned.plan.height).toBe(256);
    expect(planned.plan.frame).toEqual([]);
    expect(planned.plan.tile).toEqual({ x: 0, y: 0, width: 256, height: 256 });
    // Plain keeps the user's own margin, even below 4.
    expect(planned.plan.codeBounds.x).toBe(
      Math.floor((256 - planned.plan.moduleSize * matrix.size) / 2),
    );
  });

  it('raises a framed code’s quiet zone to 4 modules', () => {
    const plan = framed(
      'pookie',
      'bubblegum',
      { enabled: false, text: '', position: 'bottom' },
      { margin: 0 },
    );
    expect(plan.codeBounds.x - plan.tile.x).toBeGreaterThanOrEqual(4 * plan.moduleSize);
  });
});

describe('seeded textures', () => {
  it.each([
    ['retro', 'rust'],
    ['retro', 'vhs'],
    ['superhero', 'gamma'],
  ])('%s / %s draws identically every time', (themeId, subThemeId) => {
    const caption = { enabled: true, text: 'Same every time', position: 'bottom' as const };
    const first = framed(themeId, subThemeId, caption);
    const second = framed(themeId, subThemeId, caption);
    expect(JSON.stringify(second.frame)).toBe(JSON.stringify(first.frame));
    expect(planToSvg(second)).toBe(planToSvg(first));
    expect(first.frame.length).toBeGreaterThan(50);
  });
});

describe('captions', () => {
  const box = { x: 40, y: 400, width: 600, height: 60 };
  const look = { family: 'Bricolage Grotesque', weight: 800, color: '#111111' };

  it('limits captions to 40 characters, counting emoji as one', () => {
    expect(graphemes(limitCaption('x'.repeat(60)))).toHaveLength(40);
    const emoji = '👩🏽‍💻'.repeat(45);
    expect(graphemes(limitCaption(emoji))).toHaveLength(40);
    expect(limitCaption('short')).toBe('short');
  });

  it('shrinks long captions to fit inside the frame', () => {
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

  it('puts the frame and caption into the SVG as well', () => {
    const plan = framed('bollywood', 'marquee', {
      enabled: true,
      text: 'Tom & Jerry <3',
      position: 'top',
    });
    const svg = planToSvg(plan, '@font-face{font-family:"Yatra One"}');
    expect(svg).toContain(`viewBox="0 0 ${plan.width} ${plan.height}"`);
    expect(svg).toContain('Tom &#38; Jerry &#60;3');
    expect(svg).toContain('font-family="&quot;Yatra One&quot;');
    expect(svg).toContain('<style>@font-face{font-family:"Yatra One"}</style>');
    expect(svg).toContain('fill-rule="evenodd"');
  });
});
