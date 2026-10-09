import type { ErrorCorrection } from '../../capacity/capacity';
import type { CaptionPosition } from '../caption';
import type { Rect } from '../plan';
import type { Shape } from '../shapes';
import type { QrStyle } from '../style';

export type ThemeId = 'classic' | 'superhero' | 'pookie' | 'noir' | 'retro' | 'bollywood';

export const CAPTION_FAMILIES = {
  grotesque: 'Bricolage Grotesque',
  display: 'Playfair Display',
  arcade: 'Bungee',
  filmy: 'Yatra One',
} as const;

export type CaptionFamily = (typeof CAPTION_FAMILIES)[keyof typeof CAPTION_FAMILIES];

export interface SceneContext {
  // The image is square: `size` by `size`.
  size: number;
  // The solid light area behind the code, quiet zone included. Nothing may be drawn over it.
  tile: Rect;
  // The light colour of the code's surface (the code background, after any blend).
  surface: string;
  // Where the caption text sits; the scene draws its banner or sign around it. Null when off.
  caption: Rect | null;
  captionPosition: CaptionPosition;
  style: QrStyle;
  random: () => number;
}

export interface SubTheme {
  id: string;
  name: string;
  // Two colours for the little preview dot on the chip: scene, then accent.
  swatch: [string, string];
  qr: { foreground: string; background: string; errorCorrection: ErrorCorrection };
  // The scene colour the Blend slider mixes into the code's surface.
  tint: string;
  // The code tile's width as a fraction of the image.
  codeScale: number;
  caption: {
    family: CaptionFamily;
    weight: number;
    // Left out by Classic / Plain, which follows the user's own colours.
    color?: string;
    stroke?: string;
  };
  suggestion: string;
  paint(scene: SceneContext): Shape[];
}

export interface Theme {
  id: ThemeId;
  name: string;
  subThemes: readonly SubTheme[];
  // The sub-theme shown on the picker card's thumbnail.
  showcase: string;
}
