import { renderQr } from '../render/renderQr';
import { DEFAULT_STYLE, type QrStyle } from '../render/style';
import { readabilityWarnings } from './readability';
import { selfCheck } from './selfCheck';

const style: QrStyle = { ...DEFAULT_STYLE, size: 256 };

function ids(overrides: Partial<QrStyle>, version = 2, moduleSize = 8): string[] {
  return readabilityWarnings({ style: { ...style, ...overrides }, version, moduleSize }).map(
    (w) => w.id,
  );
}

describe('selfCheck', () => {
  it('confirms a code that reads back exactly', () => {
    const result = renderQr('नमस्ते 🎉', style);
    if (!result.ok) throw new Error(result.error);
    expect(selfCheck(result.plan, 'नमस्ते 🎉')).toEqual({ status: 'ok' });
  });

  it('flags content that reads back differently', () => {
    const result = renderQr('first', style);
    if (!result.ok) throw new Error(result.error);
    expect(selfCheck(result.plan, 'second')).toMatchObject({ status: 'fail' });
  });

  it('fails when the colours are identical', () => {
    const result = renderQr('same colours', {
      ...style,
      foreground: '#888888',
      background: '#888888',
    });
    if (!result.ok) throw new Error(result.error);
    expect(selfCheck(result.plan, 'same colours')).toMatchObject({
      status: 'fail',
      reason: expect.stringContaining('couldn’t find'),
    });
  });
});

describe('readabilityWarnings', () => {
  it('has no warnings for the default style', () => {
    expect(ids({})).toEqual([]);
  });

  it('warns below 4.5:1 contrast', () => {
    expect(ids({ foreground: '#777777' })).toContain('low-contrast');
    expect(ids({ foreground: '#757575' })).not.toContain('low-contrast');
  });

  it('warns about inverted colours', () => {
    expect(ids({ foreground: '#ffffff', background: '#000000' })).toEqual(['inverted']);
  });

  it('warns about margins under 4 modules', () => {
    expect(ids({ margin: 3 })).toContain('small-margin');
    expect(ids({ margin: 4 })).not.toContain('small-margin');
  });

  it('warns when modules are under 3 px', () => {
    expect(ids({}, 2, 2)).toContain('tiny-modules');
    expect(ids({}, 2, 3)).not.toContain('tiny-modules');
  });

  it('warns about dense codes with low error correction', () => {
    expect(ids({ errorCorrection: 'L' }, 15)).toContain('dense-low-ec');
    expect(ids({ errorCorrection: 'M' }, 15)).not.toContain('dense-low-ec');
    expect(ids({ errorCorrection: 'L' }, 5)).not.toContain('dense-low-ec');
  });
});
