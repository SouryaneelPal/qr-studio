import { drawToCanvas } from './outputs';
import type { DrawPlan } from './plan';

export function planToPngBlob(plan: DrawPlan): Promise<Blob> {
  const canvas = document.createElement('canvas');
  canvas.width = plan.size;
  canvas.height = plan.size;
  const context = canvas.getContext('2d');
  if (!context)
    return Promise.reject(new Error('Canvas drawing is not available in this browser.'));
  drawToCanvas(context, plan);

  return new Promise((resolve, reject) => {
    canvas.toBlob((blob) => {
      if (blob) resolve(blob);
      else reject(new Error('The browser could not create a PNG.'));
    }, 'image/png');
  });
}
