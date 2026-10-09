import { useCallback, useState } from 'react';
import {
  addEntry,
  getBrowserStorage,
  loadHistory,
  removeEntry,
  saveHistory,
  type HistoryEntry,
  type StorageProblem,
} from '../../lib/storage/history';

export function useHistory(storage: Storage | null = getBrowserStorage()) {
  const [initial] = useState(() => loadHistory(storage));
  const [entries, setEntries] = useState(initial.entries);
  const [problem, setProblem] = useState<StorageProblem | null>(initial.problem);

  const commit = useCallback(
    (next: HistoryEntry[]) => {
      setEntries(next);
      setProblem(saveHistory(storage, next));
    },
    [storage],
  );

  return {
    entries,
    problem,
    add: (entry: HistoryEntry) => commit(addEntry(entries, entry)),
    remove: (id: string) => commit(removeEntry(entries, id)),
    clear: () => commit([]),
  };
}
