import type { ErrorCorrection } from '../../lib/capacity/capacity';
import {
  ERROR_CORRECTION_LEVELS,
  MARGIN_RANGE,
  SIZE_RANGE,
  type QrStyle,
} from '../../lib/render/style';
import { ColorField } from './ColorField';
import { PRESETS, matchesPreset } from './presets';

interface StylePanelProps {
  style: QrStyle;
  onChange: (patch: Partial<QrStyle>) => void;
}

const EC_DESCRIPTIONS: Record<ErrorCorrection, string> = {
  L: 'Low · survives about 7% damage',
  M: 'Medium · about 15%',
  Q: 'Quartile · about 25%',
  H: 'High · about 30%',
};

export function StylePanel({ style, onChange }: StylePanelProps) {
  return (
    <section className="panel" aria-labelledby="style-heading">
      <h2 id="style-heading" className="panel__title">
        Style
      </h2>

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
