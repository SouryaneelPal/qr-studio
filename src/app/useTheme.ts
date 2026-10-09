import { useEffect, useState } from 'react';
import { getBrowserStorage } from '../lib/storage/history';

export type Theme = 'light' | 'dark';

const THEME_KEY = 'qr-studio:theme';

function storedTheme(): Theme | null {
  try {
    const value = getBrowserStorage()?.getItem(THEME_KEY);
    return value === 'light' || value === 'dark' ? value : null;
  } catch {
    return null;
  }
}

function systemTheme(): Theme {
  return typeof window.matchMedia === 'function' &&
    window.matchMedia('(prefers-color-scheme: dark)').matches
    ? 'dark'
    : 'light';
}

// Until the user picks a theme we follow the system; CSS handles that case on its own.
export function useTheme() {
  const [chosen, setChosen] = useState<Theme | null>(storedTheme);
  const theme = chosen ?? systemTheme();

  useEffect(() => {
    if (chosen) document.documentElement.dataset.theme = chosen;
    else delete document.documentElement.dataset.theme;
  }, [chosen]);

  function toggle() {
    const next: Theme = theme === 'dark' ? 'light' : 'dark';
    setChosen(next);
    try {
      getBrowserStorage()?.setItem(THEME_KEY, next);
    } catch {
      // The choice still applies for this visit.
    }
  }

  return { theme, toggle };
}
