import { bollywood } from './bollywood';
import { classic, plain } from './classic';
import { noirTheme } from './noir';
import { pookie } from './pookie';
import { retro } from './retro';
import { superhero } from './superhero';
import type { SubTheme, Theme, ThemeId } from './types';

export const THEMES: readonly Theme[] = [classic, superhero, pookie, noirTheme, retro, bollywood];

export interface ThemeChoice {
  themeId: ThemeId;
  subThemeId: string;
}

export const PLAIN_THEME: ThemeChoice = { themeId: 'classic', subThemeId: 'plain' };

export function findTheme(themeId: ThemeId): Theme {
  return THEMES.find((theme) => theme.id === themeId) ?? classic;
}

export function findSubTheme(choice: ThemeChoice): SubTheme {
  const theme = findTheme(choice.themeId);
  return theme.subThemes.find((sub) => sub.id === choice.subThemeId) ?? theme.subThemes[0] ?? plain;
}

export function isThemeChoice(value: unknown): value is ThemeChoice {
  if (typeof value !== 'object' || value === null) return false;
  const { themeId, subThemeId } = value as Record<string, unknown>;
  const theme = THEMES.find((candidate) => candidate.id === themeId);
  return Boolean(theme?.subThemes.some((sub) => sub.id === subThemeId));
}

export type { SubTheme, Theme, ThemeId } from './types';
