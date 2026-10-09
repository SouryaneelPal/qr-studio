import { useId, useState } from 'react';

interface SectionHintProps {
  section: string;
  children: string;
}

// A small "?" toggletip beside a section title. It sits outside the heading so the
// heading's accessible name stays the section name.
export function SectionHint({ section, children }: SectionHintProps) {
  const [open, setOpen] = useState(false);
  const id = useId();
  return (
    <span className="hint">
      <button
        type="button"
        className="hint__button"
        aria-label={`What is ${section}?`}
        aria-expanded={open}
        aria-controls={id}
        onClick={() => setOpen((shown) => !shown)}
      >
        ?
      </button>
      <span id={id} className="hint__bubble" role="note" hidden={!open}>
        {children}
      </span>
    </span>
  );
}
