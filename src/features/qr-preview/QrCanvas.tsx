import { useEffect, useRef } from 'react';
import { drawToCanvas } from '../../lib/render/outputs';
import type { DrawPlan } from '../../lib/render/plan';

interface QrCanvasProps {
  plan: DrawPlan;
  altText: string;
}

export function QrCanvas({ plan, altText }: QrCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const context = canvasRef.current?.getContext('2d');
    if (context) drawToCanvas(context, plan);
  }, [plan]);

  return (
    // Canvas counts as interactive to assistive tech, so the image role sits on a wrapper.
    <div role="img" aria-label={altText} className="preview__frame">
      <canvas
        ref={canvasRef}
        className="preview__canvas"
        width={plan.size}
        height={plan.size}
        aria-hidden="true"
        data-testid="qr-canvas"
      />
    </div>
  );
}
