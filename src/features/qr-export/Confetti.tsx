import type { CSSProperties } from 'react';
import { seededRandom } from '../../lib/render/shapes';

export interface Burst {
  id: number;
  x: number;
  y: number;
}

const COLOURS = ['#ff6b4a', '#b8f0d2', '#ffe58a', '#d9ccff', '#ffd3c2', '#1b1b1b'];
const PIECES = 18;

// A fixed, clipped overlay: pieces can fly anywhere without ever widening the page.
export function ConfettiLayer({ bursts }: { bursts: Burst[] }) {
  if (bursts.length === 0) return null;
  return (
    <div className="confetti" aria-hidden="true">
      {bursts.map((burst) => {
        const random = seededRandom(burst.id);
        return Array.from({ length: PIECES }, (_, i) => {
          const angle = (i / PIECES) * Math.PI * 2 + random() * 0.4;
          const distance = 60 + random() * 70;
          const style = {
            left: burst.x,
            top: burst.y,
            background: COLOURS[i % COLOURS.length],
            '--dx': `${Math.cos(angle) * distance}px`,
            '--dy': `${Math.sin(angle) * distance - 40}px`,
            '--spin': `${Math.round(random() * 540 - 270)}deg`,
          } as CSSProperties;
          return <span key={`${burst.id}-${i}`} className="confetti__piece" style={style} />;
        });
      })}
    </div>
  );
}
