import type { ReactNode } from 'react';
import { useRevealAfterPause } from './useRevealAfterPause';

interface FieldProps {
  id: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
  error?: string;
  hint?: ReactNode;
  multiline?: boolean;
  inputType?: 'text' | 'url' | 'email' | 'tel' | 'password';
  inputMode?: 'text' | 'url' | 'email' | 'tel';
  autoComplete?: string;
  required?: boolean;
  revealError?: boolean;
  trailing?: ReactNode;
}

export function Field({
  id,
  label,
  value,
  onChange,
  error,
  hint,
  multiline = false,
  inputType = 'text',
  inputMode,
  autoComplete = 'off',
  required = false,
  revealError = false,
  trailing,
}: FieldProps) {
  const reveal = useRevealAfterPause();
  const visibleError = reveal.revealed || revealError ? error : undefined;
  const hintId = hint ? `${id}-hint` : undefined;
  const errorId = visibleError ? `${id}-error` : undefined;
  const describedBy = [errorId, hintId].filter(Boolean).join(' ') || undefined;

  const shared = {
    id,
    value,
    required,
    autoComplete,
    'aria-invalid': visibleError ? true : undefined,
    'aria-describedby': describedBy,
    onBlur: reveal.onBlur,
  };

  return (
    <div className="field">
      <label htmlFor={id}>
        {label}
        {!required && <span className="field__optional"> (optional)</span>}
      </label>
      <div className="field__control">
        {multiline ? (
          <textarea
            {...shared}
            rows={4}
            onChange={(event) => {
              onChange(event.target.value);
              reveal.onEdit();
            }}
          />
        ) : (
          <input
            {...shared}
            type={inputType}
            inputMode={inputMode}
            spellCheck={false}
            onChange={(event) => {
              onChange(event.target.value);
              reveal.onEdit();
            }}
          />
        )}
        {trailing}
      </div>
      {visibleError && (
        <p id={errorId} className="field__error">
          {visibleError}
        </p>
      )}
      {hint && (
        <p id={hintId} className="field__hint">
          {hint}
        </p>
      )}
    </div>
  );
}
