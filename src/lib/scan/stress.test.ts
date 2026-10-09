import { renderQr } from '../render/renderQr';
import { DEFAULT_STYLE, type QrStyle } from '../render/style';
import { PRESETS } from '../../features/qr-style/presets';
import { decodePixels } from './decode';
import {
  alignmentPatternRect,
  captureScene,
  runStressTest,
  smudgeRect,
  suggestFixes,
  type ConditionId,
} from './stress';

const classic: QrStyle = {
  ...DEFAULT_STYLE,
  ...PRESETS.find((preset) => preset.id === 'classic')?.style,
};

function stress(payload: string, overrides: Partial<QrStyle> = {}) {
  const style = { ...classic, ...overrides };
  const rendered = renderQr(payload, style);
  if (!rendered.ok) throw new Error(rendered.error);
  return runStressTest({
    plan: rendered.plan,
    payload,
    errorCorrection: style.errorCorrection,
    margin: style.margin,
  });
}

function outcome(report: ReturnType<typeof stress>, id: ConditionId): boolean | undefined {
  return report.results.find((result) => result.id === id)?.passed;
}

function sceneFor(payload: string, overrides: Partial<QrStyle> = {}) {
  const rendered = renderQr(payload, { ...classic, ...overrides });
  if (!rendered.ok) throw new Error(rendered.error);
  return { scene: captureScene(rendered.plan), version: rendered.matrix.version };
}

describe('runStressTest', () => {
  it.each([128, 512, 1024])(
    'Classic settings with short text survive all 5 conditions at %i px',
    (size) => {
      const report = stress('Hello GDG', { size });
      expect(report.results.filter((result) => !result.passed)).toEqual([]);
      expect(report.passedCount).toBe(5);
      expect(report.total).toBe(5);
      expect(report.suggestions).toEqual([]);
    },
  );

  it('low contrast with error correction L fails in low light', () => {
    const report = stress('Hello GDG', { foreground: '#8a8a8a', errorCorrection: 'L' });
    expect(outcome(report, 'low-light')).toBe(false);
    expect(report.passedCount).toBeLessThan(5);
    expect(report.suggestions.join(' ')).toMatch(/Increase contrast/);
  });

  it('error correction H survives the smudge where L fails', () => {
    const low = stress('Hello GDG', { errorCorrection: 'L' });
    const high = stress('Hello GDG', { errorCorrection: 'H' });
    expect(outcome(low, 'smudge')).toBe(false);
    expect(outcome(high, 'smudge')).toBe(true);
    expect(low.suggestions[0]).toMatch(/Raise error correction to Q or H/);
  });

  it('reports every condition with a label and explanation', () => {
    const report = stress('Hello GDG');
    expect(report.results.map((result) => result.id)).toEqual([
      'blur',
      'small-print',
      'low-light',
      'tilt',
      'smudge',
    ]);
    for (const result of report.results) {
      expect(result.label).not.toBe('');
      expect(result.description.length).toBeGreaterThan(20);
    }
  });
});

describe('captureScene', () => {
  it('views codes at about 6 px per module whatever the export size', () => {
    for (const size of [256, 512, 1024]) {
      const { scene } = sceneFor('Hello GDG', { size });
      expect(scene.modulePx).toBeGreaterThanOrEqual(4.5);
      expect(scene.modulePx).toBeLessThanOrEqual(8);
    }
  });

  it('keeps undamaged codes readable, including when the quiet zone is an odd width', () => {
    const payload = 'Ab3-'.repeat(65);
    const { scene, version } = sceneFor(payload, { size: 768, errorCorrection: 'M' });
    expect(version).toBe(12);
    expect(decodePixels(scene.pixels)).toBe(payload);
  });
});

describe('smudge geometry', () => {
  it('covers the bottom-right quarter-width square of the code', () => {
    const rect = smudgeRect({ codeBounds: { x: 10, y: 10, width: 100, height: 100 } });
    expect(rect).toEqual({ x: 85, y: 85, width: 25, height: 25 });
  });

  it('keeps the alignment pattern visible from version 2', () => {
    expect(
      alignmentPatternRect({
        codeBounds: { x: 0, y: 0, width: 126, height: 126 },
        modules: 21,
        modulePx: 6,
      }),
    ).toBeNull();
    expect(
      alignmentPatternRect({
        codeBounds: { x: 0, y: 0, width: 150, height: 150 },
        modules: 25,
        modulePx: 6,
      }),
    ).toEqual({
      x: 96,
      y: 96,
      width: 31,
      height: 31,
    });
  });
});

describe('suggestFixes', () => {
  const rendered = renderQr('x', classic);
  if (!rendered.ok) throw new Error(rendered.error);
  const base = { plan: rendered.plan, errorCorrection: 'M' as const, margin: 4 };

  it('has nothing to say when everything passes', () => {
    expect(suggestFixes(new Set(), base)).toEqual([]);
  });

  it('suggests H once Q is already in use', () => {
    expect(suggestFixes(new Set(['smudge']), { ...base, errorCorrection: 'Q' })).toEqual([
      'Raise error correction to H for the most damage tolerance.',
    ]);
  });

  it('suggests a wider margin for tilt failures with a thin margin', () => {
    expect(suggestFixes(new Set(['tilt']), { ...base, margin: 1 }).join(' ')).toMatch(
      /margin to at least 4/,
    );
  });

  it('suggests dark-on-light for inverted codes that fail in low light', () => {
    const inverted = {
      ...base,
      plan: { ...base.plan, foreground: '#ffffff', background: '#111111' },
    };
    expect(suggestFixes(new Set(['low-light']), inverted).join(' ')).toMatch(
      /dark code on a light background/,
    );
  });

  it('suggests a bigger or simpler code for small-print failures', () => {
    expect(suggestFixes(new Set(['small-print']), base)).toEqual([
      'Make the code bigger when you print or display it, or shorten the content so it has fewer, larger squares.',
    ]);
  });
});
