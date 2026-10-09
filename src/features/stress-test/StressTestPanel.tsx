import type { StressRequest } from '../../lib/scan/stress';
import { useStressTest } from './useStressTest';

interface StressTestPanelProps {
  request: StressRequest | null;
}

export function StressTestPanel({ request }: StressTestPanelProps) {
  const { report, upToDate, running, run } = useStressTest(request);
  const failed = report?.results.filter((result) => !result.passed) ?? [];

  let summary = 'Not run yet.';
  if (!request) summary = 'Create a valid code to test it.';
  else if (running && !report) summary = 'Testing…';
  else if (report) {
    summary = `Survives ${report.passedCount}/${report.total} real-world conditions`;
    if (!upToDate) summary += ' (updating for your latest changes…)';
  }

  return (
    <section className="panel stress" aria-labelledby="stress-heading">
      <div className="panel__header">
        <h2 id="stress-heading" className="panel__title">
          Stress test
        </h2>
        <button type="button" className="button" disabled={!request} onClick={run}>
          {report ? 'Run again' : 'Run stress test'}
        </button>
      </div>
      <p className="muted">
        Simulates five things that go wrong when people scan for real, then checks whether the code
        still reads back exactly. After the first run it re-tests as you edit.
      </p>

      <div role="status" aria-live="polite" aria-busy={running} data-testid="stress-summary">
        <p className={`stress__summary${report && upToDate ? '' : ' stress__summary--stale'}`}>
          {summary}
        </p>
        {report && upToDate && failed.length > 0 && (
          <p className="visually-hidden">
            Failed: {failed.map((result) => result.label).join(', ')}.
          </p>
        )}
      </div>

      {report && (
        <>
          <ul className="stress__results" aria-label="Stress test results">
            {report.results.map((result) => (
              <li key={result.id} className="stress__row" data-condition={result.id}>
                <span className={`stress__badge stress__badge--${result.passed ? 'pass' : 'fail'}`}>
                  <span aria-hidden="true">{result.passed ? '✓' : '✗'}</span>
                  {result.passed ? 'Passed' : 'Failed'}
                </span>
                <span className="stress__text">
                  <strong>{result.label}</strong>
                  <span className="stress__description">{result.description}</span>
                </span>
              </li>
            ))}
          </ul>

          {report.suggestions.length > 0 && (
            <div className="stress__fixes">
              <h3 className="warnings__title">How to make it sturdier</h3>
              <ul className="advice">
                {report.suggestions.map((suggestion) => (
                  <li key={suggestion}>{suggestion}</li>
                ))}
              </ul>
            </div>
          )}

          <p className="stress__timing">
            Checked in {Math.round(report.durationMs)} ms, without leaving this device.
          </p>
        </>
      )}
    </section>
  );
}
