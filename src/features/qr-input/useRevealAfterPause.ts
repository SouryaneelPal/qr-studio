import { useEffect, useState } from 'react';

const TYPING_PAUSE_MS = 800;

// Errors appear once the user leaves a field or stops typing for a moment, not on the first keystroke.
export function useRevealAfterPause() {
  const [revealed, setRevealed] = useState(false);
  const [editCount, setEditCount] = useState(0);

  useEffect(() => {
    if (editCount === 0) return;
    const timer = setTimeout(() => setRevealed(true), TYPING_PAUSE_MS);
    return () => clearTimeout(timer);
  }, [editCount]);

  return {
    revealed,
    onEdit: () => setEditCount((count) => count + 1),
    onBlur: () => setRevealed(true),
  };
}
