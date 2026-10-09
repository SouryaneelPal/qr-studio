import type { QrStyle } from '../../lib/render/style';

export interface Preset {
  id: string;
  name: string;
  style: Partial<QrStyle>;
}

// Presets only set what defines their look; anything left out keeps the user's current choice.
export const PRESETS: readonly Preset[] = [
  {
    id: 'classic',
    name: 'Classic',
    style: { foreground: '#111111', background: '#ffffff', errorCorrection: 'M', margin: 4 },
  },
  {
    id: 'midnight',
    name: 'Midnight',
    style: { foreground: '#1b1f4b', background: '#eef0ff', errorCorrection: 'M', margin: 4 },
  },
  {
    id: 'ocean',
    name: 'Ocean',
    style: { foreground: '#0b4f6c', background: '#e6f6fb', errorCorrection: 'M', margin: 4 },
  },
  {
    id: 'forest',
    name: 'Forest',
    style: { foreground: '#1f3d2b', background: '#f3f7ef', errorCorrection: 'M', margin: 4 },
  },
  {
    id: 'print-safe',
    name: 'Print-safe',
    style: {
      foreground: '#000000',
      background: '#ffffff',
      errorCorrection: 'Q',
      margin: 4,
      size: 1024,
    },
  },
  {
    id: 'high-contrast',
    name: 'High contrast',
    style: { foreground: '#000000', background: '#ffffff', errorCorrection: 'H', margin: 6 },
  },
];

export function matchesPreset(style: QrStyle, preset: Preset): boolean {
  return (Object.keys(preset.style) as (keyof QrStyle)[]).every(
    (key) => style[key] === preset.style[key],
  );
}
