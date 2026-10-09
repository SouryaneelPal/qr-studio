import jsQR from 'jsqr';
import type { Pixels } from '../render/outputs';

// jsQR guesses a text encoding for `data`; decoding the raw bytes as UTF-8 matches how we encode.
export function decodePixels(pixels: Pixels): string | null {
  const result = jsQR(pixels.data, pixels.width, pixels.height);
  if (!result) return null;
  return new TextDecoder().decode(Uint8Array.from(result.binaryData));
}
