import { runStressTest, type StressReport, type StressRequest } from '../../lib/scan/stress';
// Inlined as a blob: URL, so starting the worker never fetches anything and works offline.
import StressWorker from './stress.worker?worker&inline';

export interface StressJob {
  id: number;
  request: StressRequest;
}

export interface StressJobResult {
  id: number;
  report: StressReport;
}

export interface StressRunner {
  run(request: StressRequest): Promise<StressReport>;
  dispose(): void;
}

// Runs on the calling thread, after yielding once so the click that started it can paint.
function runSoon(request: StressRequest): Promise<StressReport> {
  // Pixels already transferred to a worker are detached here; fall back to the plan.
  const usable =
    request.pixels && request.pixels.data.byteLength > 0
      ? request
      : { ...request, pixels: undefined };
  return new Promise((resolve) => setTimeout(() => resolve(runStressTest(usable)), 0));
}

// A run takes 10–40 ms for typical codes but over a second for a version-40 code at 1024 px,
// and the cost can't be predicted cheaply, so every run goes to a worker when one is available.
export function createStressRunner(): StressRunner {
  if (typeof Worker === 'undefined') {
    return { run: runSoon, dispose: () => undefined };
  }

  let worker: Worker | null = null;
  let nextId = 0;
  const pending = new Map<
    number,
    { request: StressRequest; resolve: (report: StressReport) => void }
  >();

  // A broken worker shouldn't leave the panel spinning: finish the waiting runs here instead.
  function finishOnMainThread() {
    worker?.terminate();
    worker = null;
    for (const [id, job] of pending) {
      pending.delete(id);
      void runSoon(job.request).then(job.resolve);
    }
  }

  function ensureWorker(): Worker {
    if (worker) return worker;
    const created = new StressWorker();
    created.onmessage = (event: MessageEvent<StressJobResult>) => {
      const job = pending.get(event.data.id);
      pending.delete(event.data.id);
      job?.resolve(event.data.report);
    };
    created.onerror = finishOnMainThread;
    worker = created;
    return created;
  }

  return {
    run(request) {
      const id = nextId++;
      return new Promise((resolve) => {
        pending.set(id, { request, resolve });
        try {
          // Transfer the pixel buffer rather than copying megabytes of image data.
          const transfer = request.pixels ? [request.pixels.data.buffer] : [];
          ensureWorker().postMessage({ id, request } satisfies StressJob, transfer);
        } catch {
          finishOnMainThread();
        }
      });
    },
    dispose() {
      worker?.terminate();
      worker = null;
      pending.clear();
    },
  };
}
