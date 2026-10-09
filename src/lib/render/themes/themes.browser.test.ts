import '../../../styles/fonts';
import { graphemes, cssFont } from '../caption';
import { MAX_BLEND } from '../plan';
import { rasterize } from '../raster';
import { renderQr, type QrDesign } from '../renderQr';
import { DEFAULT_STYLE, type QrStyle } from '../style';
import { decodePixels } from '../../scan/decode';
import { runStressTest } from '../../scan/stress';
import { THEMES } from '.';
import { CAPTION_FAMILIES } from './types';

const PAYLOAD = 'GDG on Campus SRM';
const LONG_CAPTION = 'Scan me for the GDG on Campus SRM party!';

const VARIANTS = [
  { label: 'caption off', caption: false, blend: 0 },
  { label: '40-character caption', caption: true, blend: 0 },
  { label: `maximum blend (${MAX_BLEND * 100}%) with caption`, caption: true, blend: MAX_BLEND },
];

const cases = THEMES.flatMap((theme) =>
  theme.subThemes.flatMap((sub) =>
    VARIANTS.map((variant) => ({
      theme,
      sub,
      variant,
      name: `${theme.name} / ${sub.name} / ${variant.label}`,
    })),
  ),
);

beforeAll(async () => {
  await Promise.all(
    Object.values(CAPTION_FAMILIES).flatMap((family) =>
      [400, 700, 800].map((weight) =>
        document.fonts.load(cssFont({ family, weight, size: 32 }), 'Aa शुभ'),
      ),
    ),
  );
});

describe('every scene', () => {
  it('uses a 40-character caption for the captioned cases', () => {
    expect(graphemes(LONG_CAPTION)).toHaveLength(40);
  });

  it.each(cases)('$name decodes and survives the stress test', ({ theme, sub, variant }) => {
    const style: QrStyle = {
      ...DEFAULT_STYLE,
      foreground: sub.qr.foreground,
      background: sub.qr.background,
      errorCorrection: sub.qr.errorCorrection,
    };
    const design: QrDesign = {
      theme: { themeId: theme.id, subThemeId: sub.id },
      caption: { enabled: variant.caption, text: LONG_CAPTION, position: 'bottom' },
      blend: variant.blend,
    };
    const rendered = renderQr(PAYLOAD, style, design);
    if (!rendered.ok) throw new Error(rendered.error);
    const { plan } = rendered;

    expect(plan.height).toBe(plan.width);
    if (variant.caption) {
      expect(plan.caption).not.toBeNull();
      expect(plan.caption?.width ?? Infinity).toBeLessThanOrEqual(plan.width);
    } else {
      expect(plan.caption).toBeNull();
    }

    const pixels = rasterize(plan);
    expect(decodePixels(pixels)).toBe(PAYLOAD);
    const report = runStressTest({
      plan,
      payload: PAYLOAD,
      errorCorrection: style.errorCorrection,
      margin: style.margin,
      pixels: rasterize(plan),
    });
    const failed = report.results.filter((result) => !result.passed).map((result) => result.id);
    expect(failed.length, `failed: ${failed.join(', ')}`).toBeLessThanOrEqual(1);
  });
});

describe('captions on a real canvas', () => {
  function captionPixels(text: string) {
    const style = { ...DEFAULT_STYLE, foreground: '#111111', background: '#ffffff' };
    const rendered = renderQr(PAYLOAD, style, {
      theme: { themeId: 'classic', subThemeId: 'rounded' },
      caption: { enabled: true, text, position: 'bottom' },
      blend: 0,
    });
    if (!rendered.ok) throw new Error(rendered.error);
    const { plan } = rendered;
    const pixels = rasterize(plan);
    const caption = plan.caption;
    if (!caption) throw new Error('caption missing');
    const colours: [number, number, number][] = [];
    const top = Math.round(caption.y - caption.font.size);
    for (let y = Math.max(0, top); y < Math.min(plan.height, top + caption.font.size * 2); y++) {
      for (let x = 0; x < plan.width; x++) {
        const i = (y * plan.width + x) * 4;
        colours.push([pixels.data[i] ?? 0, pixels.data[i + 1] ?? 0, pixels.data[i + 2] ?? 0]);
      }
    }
    return { plan, colours };
  }

  it('draws emoji in colour alongside the text', () => {
    const { colours } = captionPixels('Berry sweet 🍓');
    const reddish = colours.filter(([r, g, b]) => r > 170 && g < 110 && b < 110);
    expect(reddish.length).toBeGreaterThan(20);
  });

  it('draws Devanagari captions with Yatra One', () => {
    const style = { ...DEFAULT_STYLE, foreground: '#2b0a3d', background: '#ffffff' };
    const rendered = renderQr(PAYLOAD, style, {
      theme: { themeId: 'bollywood', subThemeId: 'rangoli' },
      caption: { enabled: true, text: 'शुभ आरंभ', position: 'bottom' },
      blend: 0,
    });
    if (!rendered.ok) throw new Error(rendered.error);
    expect(rendered.plan.caption?.font.family).toBe('Yatra One');
    expect(
      document.fonts.check(cssFont({ family: 'Yatra One', weight: 400, size: 32 }), 'शुभ'),
    ).toBe(true);
    expect(decodePixels(rasterize(rendered.plan))).toBe(PAYLOAD);
  });
});
