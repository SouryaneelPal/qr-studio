import { useEffect, useEffectEvent, useState } from 'react';
import { rasterize } from '../../lib/render/raster';
import type { StressReport, StressRequest } from '../../lib/scan/stress';
import { createStressRunner } from './stressRunner';

const RERUN_DELAY_MS = 400;

interface Finished {
  request: StressRequest;
  report: StressReport;
}

// Runs once the user asks, then re-runs automatically (debounced) whenever the code changes.
export function useStressTest(request: StressRequest | null) {
  const [runner] = useState(createStressRunner);
  const [enabled, setEnabled] = useState(false);
  const [running, setRunning] = useState<StressRequest | null>(null);
  const [finished, setFinished] = useState<Finished | null>(null);

  useEffect(() => () => runner.dispose(), [runner]);

  function start(target: StressRequest) {
    setRunning(target);
    // Rendered here, where the caption fonts are loaded, then handed to the worker.
    void runner.run({ ...target, pixels: rasterize(target.plan) }).then((report) => {
      // Only the newest request may update the panel; older runs finish silently.
      setRunning((current) => (current === target ? null : current));
      setFinished((previous) =>
        previous && previous.request === target ? previous : { request: target, report },
      );
    });
  }

  const startLater = useEffectEvent((target: StressRequest) => start(target));

  useEffect(() => {
    if (!enabled || !request || finished?.request === request || running === request) return;
    const timer = setTimeout(() => startLater(request), RERUN_DELAY_MS);
    return () => clearTimeout(timer);
  }, [enabled, request, finished, running]);

  return {
    report: finished?.report ?? null,
    upToDate: finished !== null && finished.request === request,
    running: running !== null,
    run() {
      if (!request) return;
      setEnabled(true);
      start(request);
    },
  };
}
