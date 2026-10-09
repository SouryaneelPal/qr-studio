import { useState } from 'react';
import { getBrowserStorage } from '../../lib/storage/history';

// A small remembered on/off preference. Storage failures only mean it isn't remembered.
export function useStoredFlag(key: string, initial: boolean) {
  const [value, setValue] = useState(() => {
    try {
      const stored = getBrowserStorage()?.getItem(key);
      return stored === null || stored === undefined ? initial : stored === 'true';
    } catch {
      return initial;
    }
  });

  function update(next: boolean) {
    setValue(next);
    try {
      getBrowserStorage()?.setItem(key, String(next));
    } catch {
      // Still works for this visit.
    }
  }

  return [value, update] as const;
}
