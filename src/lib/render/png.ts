import { drawToCanvas } from './outputs';
import type { DrawPlan } from './plan';
import { fontsReadyFor } from './raster';

export async function planToPngBlob(plan: DrawPlan): Promise<Blob> {
  await fontsReadyFor(plan);
  const canvas = document.createElement('canvas');
  canvas.width = plan.width;
  canvas.height = plan.height;
  const context = canvas.getContext('2d');
  if (!context) throw new Error('Canvas drawing is not available in this browser.');
  drawToCanvas(context, plan);

  return new Promise((resolve, reject) => {
    canvas.toBlob((blob) => {
      if (blob) resolve(blob);
      else reject(new Error('The browser could not create a PNG.'));
    }, 'image/png');
  });
}
