import { useRef, type KeyboardEvent } from 'react';
import { typeLabel } from '../../lib/payload/describe';
import { QR_TYPES, type QrType } from '../../lib/payload/types';
import { tabId } from './ids';

interface TypeSelectorProps {
  value: QrType;
  onChange: (type: QrType) => void;
  panelId: string;
}

export function TypeSelector({ value, onChange, panelId }: TypeSelectorProps) {
  const tabRefs = useRef(new Map<QrType, HTMLButtonElement>());

  function select(type: QrType) {
    onChange(type);
    tabRefs.current.get(type)?.focus();
  }

  function handleKeyDown(event: KeyboardEvent<HTMLButtonElement>) {
    const index = QR_TYPES.indexOf(value);
    const last = QR_TYPES.length - 1;
    const targets: Record<string, number> = {
      ArrowRight: index === last ? 0 : index + 1,
      ArrowDown: index === last ? 0 : index + 1,
      ArrowLeft: index === 0 ? last : index - 1,
      ArrowUp: index === 0 ? last : index - 1,
      Home: 0,
      End: last,
    };
    const target = targets[event.key];
    const next = target === undefined ? undefined : QR_TYPES[target];
    if (next) {
      event.preventDefault();
      select(next);
    }
  }

  return (
    <div className="type-tabs" role="tablist" aria-label="QR code type">
      {QR_TYPES.map((type) => {
        const selected = type === value;
        return (
          <button
            key={type}
            ref={(element) => {
              if (element) tabRefs.current.set(type, element);
              else tabRefs.current.delete(type);
            }}
            id={tabId(type)}
            type="button"
            role="tab"
            className="type-tabs__tab"
            aria-selected={selected}
            aria-controls={panelId}
            tabIndex={selected ? 0 : -1}
            onClick={() => onChange(type)}
            onKeyDown={handleKeyDown}
          >
            {typeLabel(type)}
          </button>
        );
      })}
    </div>
  );
}
