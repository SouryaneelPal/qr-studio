import type { ErrorCorrection } from '../capacity/capacity';

export interface QrStyle {
  size: number;
  foreground: string;
  background: string;
  errorCorrection: ErrorCorrection;
  margin: number;
}

export const SIZE_RANGE = { min: 128, max: 1024 } as const;
export const MARGIN_RANGE = { min: 0, max: 10 } as const;
export const ERROR_CORRECTION_LEVELS: readonly ErrorCorrection[] = ['L', 'M', 'Q', 'H'];

export const DEFAULT_STYLE: QrStyle = {
  size: 512,
  foreground: '#111111',
  background: '#ffffff',
  errorCorrection: 'M',
  margin: 4,
};

export function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}
