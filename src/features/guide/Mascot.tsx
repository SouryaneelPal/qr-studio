export type MascotMood = 'wave' | 'happy' | 'worried' | 'idle';

interface MascotProps {
  mood: MascotMood;
  className?: string;
}

// An original little character: a chunky QR-ish block with eyes. Purely decorative.
export function Mascot({ mood, className = '' }: MascotProps) {
  const mouth =
    mood === 'worried'
      ? 'M17 31 Q24 26 31 31'
      : mood === 'idle'
        ? 'M18 29 H30'
        : 'M17 28 Q24 35 31 28';
  return (
    <svg
      className={`mascot mascot--${mood} ${className}`}
      viewBox="0 0 48 48"
      width="48"
      height="48"
      aria-hidden="true"
      focusable="false"
    >
      <g className="mascot__arm">
        <rect x="38" y="20" width="9" height="5" rx="2.5" className="mascot__ink" />
      </g>
      <rect x="6" y="6" width="34" height="34" rx="7" className="mascot__body" />
      <rect x="9" y="9" width="7" height="7" rx="1.5" className="mascot__ink" />
      <rect x="30" y="9" width="7" height="7" rx="1.5" className="mascot__ink" />
      <rect x="9" y="30" width="7" height="7" rx="1.5" className="mascot__ink" />
      <circle cx="18.5" cy="21" r="3" className="mascot__ink" />
      <circle cx="29.5" cy="21" r="3" className="mascot__ink" />
      <circle cx="19.5" cy="20" r="1" className="mascot__shine" />
      <circle cx="30.5" cy="20" r="1" className="mascot__shine" />
      {mood === 'worried' && <path d="M14 15 L21 17 M34 15 L27 17" className="mascot__line" />}
      <path d={mouth} className="mascot__line" />
      {mood !== 'worried' && (
        <>
          <circle cx="14" cy="26" r="2" className="mascot__blush" />
          <circle cx="34" cy="26" r="2" className="mascot__blush" />
        </>
      )}
    </svg>
  );
}
