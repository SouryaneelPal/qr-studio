import type { ScanCheck } from '../../lib/scan/selfCheck';

interface ScanStatusProps {
  check: ScanCheck | null;
  pending: boolean;
}

// The live region is always rendered so screen readers pick up changes to its text.
export function ScanStatus({ check, pending }: ScanStatusProps) {
  let tone = 'idle';
  let text = 'No code yet. Fill in the form to create one.';
  if (check?.status === 'ok') {
    tone = 'ok';
    text = 'Scans correctly. Self-check read back exactly what you entered.';
  } else if (check?.status === 'fail') {
    tone = 'fail';
    text = `Won’t scan: ${check.reason}`;
  }

  return (
    <p
      className={`scan-status scan-status--${tone}`}
      role="status"
      aria-busy={pending}
      data-testid="scan-status"
    >
      <span className="scan-status__dot" aria-hidden="true" />
      {text}
    </p>
  );
}
