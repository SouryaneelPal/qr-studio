import { create } from 'qrcode';
import type { ErrorCorrection } from '../capacity/capacity';

export interface QrMatrix {
  version: number;
  size: number;
  isDark(row: number, col: number): boolean;
}

// Encoding everything as one UTF-8 byte segment keeps capacity maths exact and lets
// any decoder recover the original text from the raw bytes.
export function createMatrix(payload: string, errorCorrection: ErrorCorrection): QrMatrix {
  const bytes = new TextEncoder().encode(payload);
  const qr = create([{ mode: 'byte', data: bytes }], { errorCorrectionLevel: errorCorrection });
  const modules = qr.modules;
  return {
    version: qr.version,
    size: modules.size,
    isDark: (row, col) => modules.get(row, col) === 1,
  };
}
