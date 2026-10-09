import { useState } from 'react';
import { isHexColor } from '../../lib/render/color';

interface ColorFieldProps {
  id: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
}

function HexInput({ id, label, value, onChange }: ColorFieldProps) {
  const [draft, setDraft] = useState(value);
  const invalid = !isHexColor(draft);
  const errorId = `${id}-hex-error`;

  return (
    <>
      <label className="visually-hidden" htmlFor={`${id}-hex`}>
        {label} hex code
      </label>
      <input
        id={`${id}-hex`}
        className="color-field__hex mono"
        value={draft}
        maxLength={7}
        spellCheck={false}
        autoComplete="off"
        aria-invalid={invalid || undefined}
        aria-describedby={invalid ? errorId : undefined}
        onChange={(event) => {
          const next = event.target.value.trim();
          setDraft(next);
          if (isHexColor(next)) onChange(next.toLowerCase());
        }}
        onBlur={() => setDraft(value)}
      />
      {invalid && (
        <span id={errorId} className="field__error">
          Use a hex code like #1a2b3c.
        </span>
      )}
    </>
  );
}

export function ColorField({ id, label, value, onChange }: ColorFieldProps) {
  return (
    <div className="color-field">
      <label htmlFor={id}>{label}</label>
      <div className="color-field__row">
        <input
          id={id}
          type="color"
          className="color-field__swatch"
          value={value}
          onChange={(event) => onChange(event.target.value.toLowerCase())}
        />
        {/* Remount when the colour changes elsewhere (picker, preset, history) so the draft resets. */}
        <HexInput key={value} id={id} label={label} value={value} onChange={onChange} />
      </div>
    </div>
  );
}
