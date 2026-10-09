import type { ErrorCorrection } from '../../capacity/capacity';
import type { CaptionPosition } from '../caption';
import type { Rect } from '../plan';
import type { Paint, Shape } from '../shapes';
import type { QrStyle } from '../style';

export type ThemeId = 'classic' | 'superhero' | 'pookie' | 'noir' | 'retro' | 'bollywood';

export const CAPTION_FAMILIES = {
  grotesque: 'Bricolage Grotesque',
  display: 'Playfair Display',
  arcade: 'Bungee',
  filmy: 'Yatra One',
} as const;

export type CaptionFamily = (typeof CAPTION_FAMILIES)[keyof typeof CAPTION_FAMILIES];

export interface FrameContext {
  width: number;
  height: number;
  // The light QR area, quiet zone included. Nothing may be drawn over it.
  tile: Rect;
  caption: Rect | null;
  captionPosition: CaptionPosition;
  // The free space on each side of the code, excluding the caption strip.
  edges: { top: Rect; bottom: Rect; left: Rect; right: Rect };
  style: QrStyle;
  random: () => number;
}

export interface SubTheme {
  id: string;
  name: string;
  // Two colours for the little preview dot on the chip: frame, then accent.
  swatch: [string, string];
  qr: { foreground: string; background: string; errorCorrection: ErrorCorrection };
  // Frame thickness on each side, as a fraction of the image width.
  insets: { top: number; right: number; bottom: number; left: number };
  captionBand: number;
  caption: {
    family: CaptionFamily;
    weight: number;
    // Left out by Classic / Plain, which follows the user's own colours.
    color?: string;
    stroke?: string;
    band?: Paint;
  };
  suggestion: string;
  decorate(context: FrameContext): Shape[];
}

export interface Theme {
  id: ThemeId;
  name: string;
  subThemes: readonly SubTheme[];
  // The sub-theme shown on the picker card's thumbnail.
  showcase: string;
}
