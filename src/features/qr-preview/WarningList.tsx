import type { Warning } from '../../lib/payload/types';

interface WarningListProps {
  title: string;
  warnings: Warning[];
}

export function WarningList({ title, warnings }: WarningListProps) {
  if (warnings.length === 0) return null;
  return (
    <div className="warnings">
      <h3 className="warnings__title">{title}</h3>
      <ul>
        {warnings.map((warning) => (
          <li key={warning.id} data-warning={warning.id}>
            {warning.message}
          </li>
        ))}
      </ul>
    </div>
  );
}
