import { CAPTION_MAX_LENGTH, graphemes, type CaptionSettings } from '../../lib/render/caption';

interface CaptionControlsProps {
  caption: CaptionSettings;
  suggestion: string;
  onChange: (patch: Partial<CaptionSettings>) => void;
}

export function CaptionControls({ caption, suggestion, onChange }: CaptionControlsProps) {
  const count = graphemes(caption.text).length;
  return (
    <fieldset className="caption-controls">
      <legend>Caption</legend>
      <label className="switch">
        <input
          type="checkbox"
          role="switch"
          className="switch__input"
          checked={caption.enabled}
          onChange={(event) => onChange({ enabled: event.target.checked })}
        />
        <span className="switch__track" aria-hidden="true" />
        Show caption
      </label>

      <div className="field">
        <label htmlFor="caption-text">Caption text</label>
        <div className="field__control">
          <input
            id="caption-text"
            value={caption.text}
            placeholder={suggestion}
            autoComplete="off"
            aria-describedby="caption-count"
            // Typing a caption is a clear sign the user wants to see it.
            onChange={(event) =>
              onChange({
                text: event.target.value,
                enabled: event.target.value.trim() !== '' || caption.enabled,
              })
            }
          />
          <button
            type="button"
            className="button button--small"
            onClick={() => onChange({ text: suggestion, enabled: true })}
          >
            Use suggestion
          </button>
        </div>
        <p id="caption-count" className="field__hint">
          <span className="mono">
            {count}/{CAPTION_MAX_LENGTH}
          </span>{' '}
          characters. Long captions shrink to fit, then end with “…”.
        </p>
      </div>

      <fieldset className="caption-controls__position">
        <legend>Caption position</legend>
        {(['top', 'bottom'] as const).map((position) => (
          <label key={position} className="sub-chip">
            <input
              type="radio"
              name="caption-position"
              className="sub-chip__radio"
              value={position}
              checked={caption.position === position}
              onChange={() => onChange({ position })}
            />
            {position === 'top' ? 'Top' : 'Bottom'}
          </label>
        ))}
      </fieldset>
    </fieldset>
  );
}
