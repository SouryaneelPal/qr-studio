import { useStoredFlag } from './useStoredFlag';

export const GUIDE_OPEN_KEY = 'qr-studio:guide-open';

const STEPS = [
  {
    title: 'Pick what to share',
    body: 'A link, some text, an email, a phone number or your Wi-Fi.',
  },
  {
    title: 'Make it yours',
    body: 'Choose a theme, add a caption and tweak the colours.',
  },
  {
    title: 'Check & download',
    body: 'The self-check and stress test make sure it scans. Then download a PNG or SVG.',
  },
];

export function HowItWorks() {
  const [open, setOpen] = useStoredFlag(GUIDE_OPEN_KEY, true);
  return (
    <section className="guide" aria-labelledby="guide-heading">
      <div className="guide__header">
        <h2 id="guide-heading" className="guide__title">
          How it works
        </h2>
        <button
          type="button"
          className="button button--small"
          aria-expanded={open}
          aria-controls="guide-steps"
          onClick={() => setOpen(!open)}
        >
          {open ? 'Hide guide' : 'Show guide'}
        </button>
      </div>
      <ol id="guide-steps" className="guide__steps" hidden={!open}>
        {STEPS.map((step, index) => (
          <li key={step.title} className="guide__step">
            <span className="guide__number" aria-hidden="true">
              {index + 1}
            </span>
            <span className="guide__text">
              <strong>{step.title}</strong>
              <span>{step.body}</span>
            </span>
          </li>
        ))}
      </ol>
    </section>
  );
}
