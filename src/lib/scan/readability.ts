import { DENSE_VERSION } from '../capacity/capacity';
import { contrastRatio, relativeLuminance } from '../render/color';
import type { QrStyle } from '../render/style';
import type { Warning } from '../payload/types';

export const MIN_CONTRAST = 4.5;
export const MIN_MARGIN = 4;
export const MIN_MODULE_PX = 3;

interface ReadabilityInput {
  style: QrStyle;
  version: number;
  moduleSize: number;
}

export function readabilityWarnings({ style, version, moduleSize }: ReadabilityInput): Warning[] {
  const warnings: Warning[] = [];
  const contrast = contrastRatio(style.foreground, style.background);

  if (contrast < MIN_CONTRAST) {
    warnings.push({
      id: 'low-contrast',
      message: `Colour contrast is ${contrast.toFixed(1)}:1. Aim for at least ${MIN_CONTRAST}:1 so cameras can tell the colours apart.`,
    });
  }
  if (relativeLuminance(style.foreground) > relativeLuminance(style.background)) {
    warnings.push({
      id: 'inverted',
      message: 'The code is lighter than its background. Some scanners can’t read inverted codes.',
    });
  }
  if (style.margin < MIN_MARGIN) {
    warnings.push({
      id: 'small-margin',
      message: `The margin is ${style.margin} modules. Scanners expect at least ${MIN_MARGIN} to find the code.`,
    });
  }
  if (moduleSize < MIN_MODULE_PX) {
    warnings.push({
      id: 'tiny-modules',
      message: `Each square is only ${moduleSize} px wide. Increase the size so every square is at least ${MIN_MODULE_PX} px.`,
    });
  }
  if (style.errorCorrection === 'L' && version > DENSE_VERSION) {
    warnings.push({
      id: 'dense-low-ec',
      message:
        'This dense code uses the lowest error correction, so a small smudge can stop it scanning.',
    });
  }
  return warnings;
}
