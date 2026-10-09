import { create } from 'qrcode';
import {
  analyseCapacity,
  capacityAdvice,
  dataCapacityBits,
  gridSize,
  MAX_VERSION,
  maxBytes,
  smallestVersion,
  type ErrorCorrection,
} from './capacity';

const LEVELS: ErrorCorrection[] = ['L', 'M', 'Q', 'H'];

function libraryVersionFor(byteLength: number, ec: ErrorCorrection): number {
  const bytes = new Uint8Array(byteLength).fill(0x61);
  return create([{ mode: 'byte', data: bytes }], { errorCorrectionLevel: ec }).version;
}

describe('capacity tables', () => {
  it('match well-known byte capacities from the specification', () => {
    expect(maxBytes(1, 'L')).toBe(17);
    expect(maxBytes(1, 'H')).toBe(7);
    expect(maxBytes(10, 'M')).toBe(213);
    expect(maxBytes(40, 'L')).toBe(2953);
    expect(maxBytes(40, 'H')).toBe(1273);
  });

  it('agree with the qrcode library at every version and level', () => {
    for (const ec of LEVELS) {
      for (let version = 1; version <= MAX_VERSION; version++) {
        const limit = maxBytes(version, ec);
        expect(libraryVersionFor(limit, ec), `${limit} bytes at ${ec}`).toBe(version);
        if (version < MAX_VERSION) {
          expect(libraryVersionFor(limit + 1, ec), `${limit + 1} bytes at ${ec}`).toBe(version + 1);
        }
      }
    }
  });

  it('computes grid size from the version', () => {
    expect(gridSize(1)).toBe(21);
    expect(gridSize(40)).toBe(177);
  });
});

describe('analyseCapacity', () => {
  it('picks the smallest version and reports how full it is', () => {
    const report = analyseCapacity(17, 'L');
    expect(report).toMatchObject({ fits: true, version: 1, gridSize: 21 });
    expect(report.fits && report.fillRatio).toBeCloseTo(
      (4 + 8 + 17 * 8) / dataCapacityBits(1, 'L'),
    );
  });

  it('moves to a denser version as content grows', () => {
    expect(smallestVersion(18, 'L')).toBe(2);
    expect(smallestVersion(100, 'H')).toBeGreaterThan(smallestVersion(100, 'L') ?? 0);
  });

  it('reports content that cannot fit instead of throwing', () => {
    expect(analyseCapacity(3000, 'L')).toEqual({
      fits: false,
      byteLength: 3000,
      maxByteLength: 2953,
    });
    expect(smallestVersion(1274, 'H')).toBeNull();
  });
});

describe('capacityAdvice', () => {
  it('stays quiet for small codes', () => {
    expect(capacityAdvice(50, 'M')).toEqual([]);
  });

  it('explains dense versions and suggests a lower level when it helps', () => {
    const advice = capacityAdvice(400, 'H');
    expect(advice[0]).toMatch(/version \d+/);
    expect(advice[1]).toMatch(/Error correction Q/);
  });

  it('explains content that is too long', () => {
    const advice = capacityAdvice(2000, 'H');
    expect(advice[0]).toContain('Shorten it');
    expect(advice[1]).toContain('lower error-correction');
  });
});
