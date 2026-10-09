export type ErrorCorrection = 'L' | 'M' | 'Q' | 'H';

export const MIN_VERSION = 1;
export const MAX_VERSION = 40;

// Error-correction codewords per block and number of blocks, indexed by version (index 0 unused).
// Values from the QR code specification (ISO/IEC 18004, table 9).
const EC_CODEWORDS_PER_BLOCK: Record<ErrorCorrection, readonly number[]> = {
  L: [
    0, 7, 10, 15, 20, 26, 18, 20, 24, 30, 18, 20, 24, 26, 30, 22, 24, 28, 30, 28, 28, 28, 28, 30,
    30, 26, 28, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30,
  ],
  M: [
    0, 10, 16, 26, 18, 24, 16, 18, 22, 22, 26, 30, 22, 22, 24, 24, 28, 28, 26, 26, 26, 26, 28, 28,
    28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28,
  ],
  Q: [
    0, 13, 22, 18, 26, 18, 24, 18, 22, 20, 24, 28, 26, 24, 20, 30, 24, 28, 28, 26, 30, 28, 30, 30,
    30, 30, 28, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30,
  ],
  H: [
    0, 17, 28, 22, 16, 22, 28, 26, 26, 24, 28, 24, 28, 22, 24, 24, 30, 28, 28, 26, 28, 30, 24, 30,
    30, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30,
  ],
};

const EC_BLOCKS: Record<ErrorCorrection, readonly number[]> = {
  L: [
    0, 1, 1, 1, 1, 1, 2, 2, 2, 2, 4, 4, 4, 4, 4, 6, 6, 6, 6, 7, 8, 8, 9, 9, 10, 12, 12, 12, 13, 14,
    15, 16, 17, 18, 19, 19, 20, 21, 22, 24, 25,
  ],
  M: [
    0, 1, 1, 1, 2, 2, 4, 4, 4, 5, 5, 5, 8, 9, 9, 10, 10, 11, 13, 14, 16, 17, 17, 18, 20, 21, 23, 25,
    26, 28, 29, 31, 33, 35, 37, 38, 40, 43, 45, 47, 49,
  ],
  Q: [
    0, 1, 1, 2, 2, 4, 4, 6, 6, 8, 8, 8, 10, 12, 16, 12, 17, 16, 18, 21, 20, 23, 23, 25, 27, 29, 34,
    34, 35, 38, 40, 43, 45, 48, 51, 53, 56, 59, 62, 65, 68,
  ],
  H: [
    0, 1, 1, 2, 4, 4, 4, 5, 6, 8, 8, 11, 11, 16, 16, 18, 16, 19, 21, 25, 25, 25, 34, 30, 32, 35, 37,
    40, 42, 45, 48, 51, 54, 57, 60, 63, 66, 70, 74, 77, 81,
  ],
};

const MODE_INDICATOR_BITS = 4;

export function gridSize(version: number): number {
  return 17 + 4 * version;
}

// Modules left for data and error correction once finder, timing, alignment,
// format and version patterns are placed.
function rawDataModules(version: number): number {
  let modules = (16 * version + 128) * version + 64;
  if (version >= 2) {
    const alignmentPerSide = Math.floor(version / 7) + 2;
    modules -= (25 * alignmentPerSide - 10) * alignmentPerSide - 55;
    if (version >= 7) modules -= 36;
  }
  return modules;
}

function tableValue(
  table: Record<ErrorCorrection, readonly number[]>,
  version: number,
  ec: ErrorCorrection,
): number {
  const value = table[ec][version];
  if (value === undefined) throw new RangeError(`QR version ${version} is out of range`);
  return value;
}

export function dataCapacityBits(version: number, ec: ErrorCorrection): number {
  const totalCodewords = Math.floor(rawDataModules(version) / 8);
  const ecCodewords =
    tableValue(EC_CODEWORDS_PER_BLOCK, version, ec) * tableValue(EC_BLOCKS, version, ec);
  return (totalCodewords - ecCodewords) * 8;
}

// We always encode in byte mode, so the cost of content is easy to state exactly.
export function byteModeBits(byteLength: number, version: number): number {
  const lengthFieldBits = version <= 9 ? 8 : 16;
  return MODE_INDICATOR_BITS + lengthFieldBits + 8 * byteLength;
}

export function maxBytes(version: number, ec: ErrorCorrection): number {
  const lengthFieldBits = version <= 9 ? 8 : 16;
  return Math.floor((dataCapacityBits(version, ec) - MODE_INDICATOR_BITS - lengthFieldBits) / 8);
}

export function smallestVersion(byteLength: number, ec: ErrorCorrection): number | null {
  for (let version = MIN_VERSION; version <= MAX_VERSION; version++) {
    if (byteLength <= maxBytes(version, ec)) return version;
  }
  return null;
}

export type CapacityReport =
  | {
      fits: true;
      version: number;
      gridSize: number;
      usedBits: number;
      capacityBits: number;
      fillRatio: number;
      byteLength: number;
    }
  | { fits: false; byteLength: number; maxByteLength: number };

export function analyseCapacity(byteLength: number, ec: ErrorCorrection): CapacityReport {
  const version = smallestVersion(byteLength, ec);
  if (version === null) {
    return { fits: false, byteLength, maxByteLength: maxBytes(MAX_VERSION, ec) };
  }
  const usedBits = byteModeBits(byteLength, version);
  const capacityBits = dataCapacityBits(version, ec);
  return {
    fits: true,
    version,
    gridSize: gridSize(version),
    usedBits,
    capacityBits,
    fillRatio: usedBits / capacityBits,
    byteLength,
  };
}

// Versions above this are dense enough that small prints and older phone cameras struggle.
export const DENSE_VERSION = 10;

const LOWER_LEVELS: Record<ErrorCorrection, ErrorCorrection | null> = {
  H: 'Q',
  Q: 'M',
  M: 'L',
  L: null,
};

export function capacityAdvice(byteLength: number, ec: ErrorCorrection): string[] {
  const report = analyseCapacity(byteLength, ec);
  if (!report.fits) {
    const lower = LOWER_LEVELS[ec];
    const advice = [
      `This content is ${report.byteLength} bytes, but a QR code at level ${ec} holds at most ${report.maxByteLength}. Shorten it.`,
    ];
    if (lower && analyseCapacity(byteLength, 'L').fits) {
      advice.push(
        'A lower error-correction level would make it fit, at the cost of damage tolerance.',
      );
    }
    return advice;
  }

  if (report.version <= DENSE_VERSION) return [];

  const advice = [
    `The content needs version ${report.version} (${report.gridSize}×${report.gridSize} modules), which is dense. Shorter content gives a simpler, easier-to-scan code.`,
  ];
  const lower = LOWER_LEVELS[ec];
  if (lower) {
    const lowerReport = analyseCapacity(byteLength, lower);
    if (lowerReport.fits && lowerReport.version < report.version) {
      advice.push(
        `Error correction ${lower} would bring it down to version ${lowerReport.version}, but tolerates less damage.`,
      );
    }
  }
  return advice;
}
