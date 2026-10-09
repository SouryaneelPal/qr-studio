import { useEffect, useState } from 'react';

// Bumps whenever web fonts finish loading, so captions measured with a fallback font get
// re-measured with the real one.
export function useFontsVersion(): number {
  const [version, setVersion] = useState(0);
  useEffect(() => {
    if (typeof document === 'undefined' || !('fonts' in document)) return;
    const bump = () => setVersion((current) => current + 1);
    document.fonts.addEventListener('loadingdone', bump);
    return () => document.fonts.removeEventListener('loadingdone', bump);
  }, []);
  return version;
}
