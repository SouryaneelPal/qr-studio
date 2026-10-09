import { planToPixels } from '../render/outputs';
import type { DrawPlan } from '../render/plan';
import { decodePixels } from './decode';

export type ScanCheck = { status: 'ok' } | { status: 'fail'; reason: string };

export function selfCheck(plan: DrawPlan, expected: string): ScanCheck {
  const decoded = decodePixels(planToPixels(plan));
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
