import type { Pixels } from '../render/outputs';
import { decodePixels } from './decode';

export type ScanCheck = { status: 'ok' } | { status: 'fail'; reason: string };

// Takes the final image (frame and caption included), exactly as it will be shared.
export function selfCheck(pixels: Pixels, expected: string): ScanCheck {
  const decoded = decodePixels(pixels);
  if (decoded === null) {
    return { status: 'fail', reason: 'A scanner couldn’t find a readable code in the image.' };
  }
  if (decoded !== expected) {
    return {
      status: 'fail',
      reason: 'The code reads back different content from what you entered.',
    };
  }
  return { status: 'ok' };
}
