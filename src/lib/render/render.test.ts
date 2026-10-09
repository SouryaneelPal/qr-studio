import { decodePixels } from '../scan/decode';
import { createMatrix } from './matrix';
import { planToPixels, planToSvg } from './outputs';
import { planDrawing } from './plan';
import { renderQr } from './renderQr';
import { DEFAULT_STYLE, type QrStyle } from './style';

const style: QrStyle = { ...DEFAULT_STYLE, size: 256, margin: 4 };

function readyPlan(payload: string, overrides: Partial<QrStyle> = {}) {
  const result = renderQr(payload, { ...style, ...overrides });
  if (!result.ok) throw new Error(result.error);
  return result.plan;
}

describe('planDrawing', () => {
  it('uses whole-pixel modules and centres the code', () => {
    const matrix = createMatrix('hello', 'M');
    const planned = planDrawing(matrix, style);
    expect(planned.ok).toBe(true);
    if (!planned.ok) return;

    const across = matrix.size + 2 * style.margin;
    expect(planned.plan.moduleSize).toBe(Math.floor(256 / across));
    const xs = planned.plan.darkRects.map((rect) => rect.x);
    const left = Math.min(...xs);
    const right = Math.max(...planned.plan.darkRects.map((rect) => rect.x + rect.width));
    expect(left).toBe(256 - right);
  });

  it('merges horizontal runs of dark modules', () => {
    const matrix = createMatrix('hello', 'M');
    const planned = planDrawing(matrix, style);
    if (!planned.ok) throw new Error(planned.error);
    // The top row starts with a 7-module finder pattern.
    expect(planned.plan.darkRects[0]?.width).toBe(7 * planned.plan.moduleSize);
  });

  it('refuses sizes too small for one pixel per module', () => {
    const matrix = createMatrix('x'.repeat(1500), 'L');
    const planned = planDrawing(matrix, { ...style, size: 128, margin: 10 });
    expect(planned).toMatchObject({ ok: false, error: expect.stringContaining('px') });
  });
});

describe('outputs', () => {
  it('renders pixels that decode back to the payload', () => {
    expect(decodePixels(planToPixels(readyPlan('https://example.com/ü?q=1')))).toBe(
      'https://example.com/ü?q=1',
    );
  });

  it('produces pixels at exactly the chosen size with the chosen colours', () => {
    const plan = readyPlan('size check', { size: 200, background: '#ff0000' });
    const pixels = planToPixels(plan);
    expect(pixels.width).toBe(200);
    expect(pixels.data.length).toBe(200 * 200 * 4);
    expect(Array.from(pixels.data.slice(0, 4))).toEqual([255, 0, 0, 255]);
  });

  it('builds an SVG from the same plan', () => {
    const plan = readyPlan('svg check', { foreground: '#123456' });
    const svg = planToSvg(plan);
    expect(svg).toContain(`viewBox="0 0 ${plan.size} ${plan.size}"`);
    expect(svg).toContain('fill="#123456"');
    expect(svg.match(/M\d+ \d+h\d+v\d+h-\d+z/g)).toHaveLength(plan.darkRects.length);
  });
});

describe('renderQr', () => {
  it('returns a clear error when content exceeds QR capacity', () => {
    const result = renderQr('x'.repeat(3000), style);
    expect(result).toMatchObject({ ok: false, error: expect.stringContaining('Too much content') });
  });

  it('reports a version consistent with the capacity analysis', () => {
    const result = renderQr('x'.repeat(300), { ...style, size: 1024 });
    expect(result.ok && result.matrix.version).toBe(
      result.capacity.fits && result.capacity.version,
    );
  });
});
