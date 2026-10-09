import { useStoredFlag } from './useStoredFlag';

const TIPS = [
  'Keep it dark on light. Most scanners expect a dark code on a pale background.',
  'Keep the margin. The empty border (4 modules or more) helps cameras find the code.',
  'Use error correction Q or H for printed or framed codes, so smudges and stickers don’t stop it.',
  'Keep captions short, so they stay big enough to read.',
  'Print it at least 2 cm wide for close-up scanning, and bigger for posters across a room.',
  'Test it with your own phone before you print a batch.',
];

export function ScanTips() {
  const [open, setOpen] = useStoredFlag('qr-studio:tips-open', false);
  return (
    <section className="panel panel--white panel--tips" aria-labelledby="tips-heading">
      <div className="panel__header">
        <h2 id="tips-heading" className="panel__title">
          Tips for codes that scan
        </h2>
        <button
          type="button"
          className="button button--small"
          aria-expanded={open}
          aria-controls="tips-list"
          onClick={() => setOpen(!open)}
        >
          {open ? 'Hide tips' : 'Show tips'}
        </button>
      </div>
      <ul id="tips-list" className="tips" hidden={!open}>
        {TIPS.map((tip) => (
          <li key={tip}>{tip}</li>
        ))}
      </ul>
    </section>
  );
}
