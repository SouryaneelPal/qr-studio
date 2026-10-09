import { useEffect, useRef } from 'react';
import { drawToCanvas } from '../../lib/render/outputs';
import type { DrawPlan } from '../../lib/render/plan';
import { fontsReadyFor } from '../../lib/render/raster';

interface QrCanvasProps {
  plan: DrawPlan;
  altText: string;
}

export function QrCanvas({ plan, altText }: QrCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    let current = true;
    // Draw once the caption font is ready, so the preview never flashes a fallback font.
    void fontsReadyFor(plan).then(() => {
      const context = canvasRef.current?.getContext('2d');
      if (current && context) drawToCanvas(context, plan);
    });
    return () => {
      current = false;
    };
  }, [plan]);

  return (
    // Canvas counts as interactive to assistive tech, so the image role sits on a wrapper.
    <div role="img" aria-label={altText} className="preview__frame">
      <canvas
        ref={canvasRef}
        className="preview__canvas"
        width={plan.width}
        height={plan.height}
        aria-hidden="true"
        data-testid="qr-canvas"
      />
    </div>
  );
}
