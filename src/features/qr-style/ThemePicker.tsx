import { useMemo } from 'react';
import { planToSvg } from '../../lib/render/outputs';
import { DEFAULT_CAPTION } from '../../lib/render/caption';
import { renderQr } from '../../lib/render/renderQr';
import { DEFAULT_STYLE } from '../../lib/render/style';
import { THEMES, findTheme, type ThemeChoice, type ThemeId } from '../../lib/render/themes';

interface ThemePickerProps {
  value: ThemeChoice;
  // The current code's content, so thumbnails show the real thing; a sample is used until it's valid.
  payload: string | null;
  onSelectTheme: (themeId: ThemeId) => void;
  onSelectSubTheme: (choice: ThemeChoice) => void;
}

const SAMPLE = 'QR Studio';
const THUMBNAIL_SIZE = 160;

function thumbnail(choice: ThemeChoice, payload: string | null): string {
  const sub = findTheme(choice.themeId).subThemes.find(
    (candidate) => candidate.id === choice.subThemeId,
  );
  if (!sub) return '';
  const style = {
    ...DEFAULT_STYLE,
    size: THUMBNAIL_SIZE,
    foreground: sub.qr.foreground,
    background: sub.qr.background,
    errorCorrection: 'L' as const,
  };
  const design = { theme: choice, caption: DEFAULT_CAPTION, blend: 0 };
  const attempt = payload ? renderQr(payload, style, design) : null;
  const rendered = attempt?.ok ? attempt : renderQr(SAMPLE, style, design);
  return rendered.ok
    ? `data:image/svg+xml;charset=utf-8,${encodeURIComponent(planToSvg(rendered.plan))}`
    : '';
}

export function ThemePicker({ value, payload, onSelectTheme, onSelectSubTheme }: ThemePickerProps) {
  const selected = findTheme(value.themeId);
  const thumbnails = useMemo(
    () =>
      Object.fromEntries(
        THEMES.map((theme) => {
          const subThemeId = theme.id === value.themeId ? value.subThemeId : theme.showcase;
          return [theme.id, thumbnail({ themeId: theme.id, subThemeId }, payload)];
        }),
      ),
    [payload, value.themeId, value.subThemeId],
  );

  return (
    <div className="theme-picker">
      <fieldset>
        <legend>Theme</legend>
        <div className="theme-picker__themes">
          {THEMES.map((theme) => (
            <label key={theme.id} className="theme-card">
              <input
                type="radio"
                name="qr-theme"
                className="theme-card__radio"
                value={theme.id}
                checked={theme.id === value.themeId}
                onChange={() => onSelectTheme(theme.id)}
              />
              <img
                className="theme-card__thumb"
                src={thumbnails[theme.id]}
                alt=""
                width={64}
                height={64}
              />
              <span className="theme-card__name">{theme.name}</span>
            </label>
          ))}
        </div>
      </fieldset>

      <fieldset>
        <legend>{selected.name} styles</legend>
        <div className="theme-picker__subs">
          {selected.subThemes.map((sub) => (
            <label key={sub.id} className="sub-chip">
              <input
                type="radio"
                name="qr-sub-theme"
                className="sub-chip__radio"
                value={sub.id}
                checked={sub.id === value.subThemeId}
                onChange={() => onSelectSubTheme({ themeId: selected.id, subThemeId: sub.id })}
              />
              <span
                className="sub-chip__swatch"
                aria-hidden="true"
                style={{
                  background: sub.swatch[0],
                  borderColor: sub.swatch[1],
                  color: sub.swatch[1],
                }}
              >
                ●
              </span>
              {sub.name}
            </label>
          ))}
        </div>
      </fieldset>
    </div>
  );
}
