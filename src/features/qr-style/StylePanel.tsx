import type { CSSProperties } from 'react';
import type { ErrorCorrection } from '../../lib/capacity/capacity';
import {
  ERROR_CORRECTION_LEVELS,
  MARGIN_RANGE,
  SIZE_RANGE,
  type QrStyle,
} from '../../lib/render/style';
import type { CaptionSettings } from '../../lib/render/caption';
import type { QrDesign } from '../../lib/render/renderQr';
import { findSubTheme, type ThemeChoice, type ThemeId } from '../../lib/render/themes';
import { SectionHint } from '../guide/SectionHint';
import { CaptionControls } from './CaptionControls';
import { ColorField } from './ColorField';
import { ThemePicker } from './ThemePicker';
import { PRESETS, matchesPreset } from './presets';

interface StylePanelProps {
  style: QrStyle;
  onChange: (patch: Partial<QrStyle>) => void;
  design: QrDesign;
  payload: string | null;
  onSelectTheme: (themeId: ThemeId) => void;
  onSelectSubTheme: (choice: ThemeChoice) => void;
  onCaptionChange: (patch: Partial<CaptionSettings>) => void;
}

const EC_DESCRIPTIONS: Record<ErrorCorrection, string> = {
  L: 'Low · survives about 7% damage',
  M: 'Medium · about 15%',
  Q: 'Quartile · about 25%',
  H: 'High · about 30%',
};

// WebKit has no pseudo-element for the filled part of a range track, so the CSS paints it from this.
function sliderFill(value: number, min: number, max: number): CSSProperties {
  return { '--fill': `${((value - min) / (max - min)) * 100}%` } as CSSProperties;
}

export function StylePanel({
  style,
  onChange,
  design,
  payload,
  onSelectTheme,
  onSelectSubTheme,
  onCaptionChange,
}: StylePanelProps) {
  return (
    <section className="panel panel--butter panel--style" aria-labelledby="style-heading">
      <div className="panel__header">
        <div className="panel__heading">
          <h2 id="style-heading" className="panel__title">
            Style
          </h2>
          <SectionHint section="Style">
            Pick a themed frame, add a caption, then fine-tune colours, size and error correction.
          </SectionHint>
        </div>
      </div>

      <ThemePicker
        value={design.theme}
        payload={payload}
        onSelectTheme={onSelectTheme}
        onSelectSubTheme={onSelectSubTheme}
      />
      <CaptionControls
        caption={design.caption}
        suggestion={findSubTheme(design.theme).suggestion}
        onChange={onCaptionChange}
      />

      <fieldset className="presets">
        <legend>Presets</legend>
        <div className="presets__list">
          {PRESETS.map((preset) => (
            <button
              key={preset.id}
              type="button"
              className="preset"
              aria-pressed={matchesPreset(style, preset)}
              onClick={() => onChange(preset.style)}
            >
              <span
                className="preset__swatch"
                aria-hidden="true"
                style={{
                  background: preset.style.background,
                  borderColor: preset.style.foreground,
                  color: preset.style.foreground,
                }}
              >
                ▚
              </span>
              {preset.name}
            </button>
          ))}
        </div>
      </fieldset>

      <div className="style-grid">
        <div className="range-field">
          <label htmlFor="style-size">
            Size{' '}
            <output htmlFor="style-size" className="mono">
              {style.size} px
            </output>
          </label>
          <input
            id="style-size"
            type="range"
            min={SIZE_RANGE.min}
            max={SIZE_RANGE.max}
            step={16}
            value={style.size}
            style={sliderFill(style.size, SIZE_RANGE.min, SIZE_RANGE.max)}
            onChange={(event) => onChange({ size: Number(event.target.value) })}
          />
        </div>

        <div className="range-field">
          <label htmlFor="style-margin">
            Margin{' '}
            <output htmlFor="style-margin" className="mono">
              {style.margin} modules
            </output>
          </label>
          <input
            id="style-margin"
            type="range"
            min={MARGIN_RANGE.min}
            max={MARGIN_RANGE.max}
            step={1}
            value={style.margin}
            style={sliderFill(style.margin, MARGIN_RANGE.min, MARGIN_RANGE.max)}
            onChange={(event) => onChange({ margin: Number(event.target.value) })}
          />
        </div>

        <ColorField
          id="style-foreground"
          label="Code colour"
          value={style.foreground}
          onChange={(foreground) => onChange({ foreground })}
        />
        <ColorField
          id="style-background"
          label="Background colour"
          value={style.background}
          onChange={(background) => onChange({ background })}
        />
      </div>

      <fieldset className="ec-options">
        <legend>Error correction</legend>
        {ERROR_CORRECTION_LEVELS.map((level) => (
          <label key={level} className="ec-option">
            <input
              type="radio"
              name="error-correction"
              value={level}
              checked={style.errorCorrection === level}
              onChange={() => onChange({ errorCorrection: level })}
            />
            <span className="ec-option__level mono">{level}</span>
            <span className="ec-option__text">{EC_DESCRIPTIONS[level]}</span>
          </label>
        ))}
      </fieldset>
    </section>
  );
}
