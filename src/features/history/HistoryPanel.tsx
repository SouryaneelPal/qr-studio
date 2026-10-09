import { describeInput, typeLabel } from '../../lib/payload/describe';
import { STORAGE_NOTICES, type HistoryEntry, type StorageProblem } from '../../lib/storage/history';

interface HistoryPanelProps {
  entries: HistoryEntry[];
  problem: StorageProblem | null;
  onUse: (entry: HistoryEntry) => void;
  onDelete: (id: string) => void;
  onClear: () => void;
}

const timeFormat = new Intl.DateTimeFormat(undefined, { dateStyle: 'medium', timeStyle: 'short' });

export function HistoryPanel({ entries, problem, onUse, onDelete, onClear }: HistoryPanelProps) {
  return (
    <section className="panel panel--white panel--history" aria-labelledby="history-heading">
      <div className="panel__header">
        <h2 id="history-heading" className="panel__title">
          Recent codes
        </h2>
        {entries.length > 0 && (
          <button type="button" className="button button--small" onClick={onClear}>
            Clear all
          </button>
        )}
      </div>

      {problem && (
        <p className="notice" role="status">
          {STORAGE_NOTICES[problem]}
        </p>
      )}

      {entries.length === 0 ? (
        <p className="muted">
          Codes you download, copy or save appear here. Nothing leaves this device.
        </p>
      ) : (
        <ul className="history" aria-label="Recent codes">
          {entries.map((entry) => {
            const summary = describeInput(entry.type, entry.input);
            return (
              <li key={entry.id} className="history__item">
                <button type="button" className="history__use" onClick={() => onUse(entry)}>
                  <span
                    className="history__swatch"
                    aria-hidden="true"
                    style={{ background: entry.style.background, color: entry.style.foreground }}
                  >
                    ▚
                  </span>
                  <span className="history__text">
                    <span className="history__type">{typeLabel(entry.type)}</span>
                    <span className="history__summary break">{summary}</span>
                    <span className="history__time">
                      {timeFormat.format(entry.createdAt)}
                      {entry.passwordOmitted && ' · password not saved'}
                    </span>
                  </span>
                  <span className="visually-hidden">Use this code</span>
                </button>
                <button
                  type="button"
                  className="button button--small history__delete"
                  aria-label={`Delete ${typeLabel(entry.type)} ${summary}`}
                  onClick={() => onDelete(entry.id)}
                >
                  ✕
                </button>
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}
