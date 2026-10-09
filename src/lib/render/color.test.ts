import { contrastRatio, isHexColor, parseHexColor, relativeLuminance } from './color';

describe('colour helpers', () => {
  it('parses hex colours', () => {
    expect(parseHexColor('#0a80FF')).toEqual({ r: 10, g: 128, b: 255 });
    expect(isHexColor('#fff')).toBe(false);
    expect(() => parseHexColor('red')).toThrow();
  });

  it('computes WCAG relative luminance', () => {
    expect(relativeLuminance('#000000')).toBe(0);
    expect(relativeLuminance('#ffffff')).toBe(1);
    expect(relativeLuminance('#808080')).toBeCloseTo(0.2159, 4);
  });

  it('computes contrast ratios symmetrically', () => {
    expect(contrastRatio('#000000', '#ffffff')).toBeCloseTo(21);
    expect(contrastRatio('#ffffff', '#000000')).toBeCloseTo(21);
    expect(contrastRatio('#777777', '#ffffff')).toBeCloseTo(4.48, 2);
    expect(contrastRatio('#123456', '#123456')).toBe(1);
  });
});
