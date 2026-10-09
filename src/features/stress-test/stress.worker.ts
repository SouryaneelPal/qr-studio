import { runStressTest, type StressRequest } from '../../lib/scan/stress';
import type { StressJob, StressJobResult } from './stressRunner';

// The app compiles against DOM types, where `self` is a Window; this is the worker side of it.
const scope = self as unknown as {
  onmessage: ((event: MessageEvent<StressJob>) => void) | null;
  postMessage: (message: StressJobResult) => void;
};

scope.onmessage = (event) => {
  const { id, request }: { id: number; request: StressRequest } = event.data;
  scope.postMessage({ id, report: runStressTest(request) });
};
