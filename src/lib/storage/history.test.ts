import { DEFAULT_STYLE } from '../render/style';
import {
  addEntry,
  createEntry,
  HISTORY_KEY,
  HISTORY_LIMIT,
  loadHistory,
  removeEntry,
  saveHistory,
  type HistoryEntry,
} from './history';

const wifi = { ssid: 'Home', password: 'hunter2hunter2', security: 'WPA' as const, hidden: false };

function textEntry(text: string, now: number): HistoryEntry {
  return createEntry('text', { text }, DEFAULT_STYLE, {
    rememberWifiPassword: false,
    now,
    id: `id-${now}`,
  });
}

function memoryStorage(): Storage {
  const data = new Map<string, string>();
  return {
    get length() {
      return data.size;
    },
    clear: () => data.clear(),
    getItem: (key) => data.get(key) ?? null,
    key: (index) => Array.from(data.keys())[index] ?? null,
    removeItem: (key) => void data.delete(key),
    setItem: (key, value) => void data.set(key, value),
  };
}

function throwingStorage(error: Error): Storage {
  const storage = memoryStorage();
  storage.getItem = () => {
    throw error;
  };
  storage.setItem = () => {
    throw error;
  };
  return storage;
}

describe('history entries', () => {
  it('adds newest first and removes duplicates', () => {
    let entries = addEntry([], textEntry('a', 1));
    entries = addEntry(entries, textEntry('b', 2));
    entries = addEntry(entries, textEntry('a', 3));
    expect(entries.map((entry) => entry.type === 'text' && entry.input.text)).toEqual(['a', 'b']);
    expect(entries[0]?.createdAt).toBe(3);
  });

  it(`keeps at most ${HISTORY_LIMIT} entries`, () => {
    let entries: HistoryEntry[] = [];
    for (let i = 0; i < 25; i++) entries = addEntry(entries, textEntry(`code ${i}`, i));
    expect(entries).toHaveLength(HISTORY_LIMIT);
    expect(entries[0]?.type === 'text' && entries[0].input.text).toBe('code 24');
  });

  it('removes a single entry by id', () => {
    const entries = [textEntry('a', 1), textEntry('b', 2)];
    expect(removeEntry(entries, 'id-1').map((entry) => entry.id)).toEqual(['id-2']);
  });

  it('does not store Wi-Fi passwords by default', () => {
    const entry = createEntry('wifi', wifi, DEFAULT_STYLE, { rememberWifiPassword: false });
    expect(entry).toMatchObject({ passwordOmitted: true, input: { password: '' } });
    expect(JSON.stringify(entry)).not.toContain('hunter2');
  });

  it('stores the Wi-Fi password only when asked to', () => {
    const entry = createEntry('wifi', wifi, DEFAULT_STYLE, { rememberWifiPassword: true });
    expect(entry).toMatchObject({ passwordOmitted: false, input: { password: 'hunter2hunter2' } });
  });

  it('does not mark open networks as missing a password', () => {
    const entry = createEntry('wifi', { ...wifi, security: 'nopass' }, DEFAULT_STYLE, {
      rememberWifiPassword: false,
    });
    expect(entry).toMatchObject({ passwordOmitted: false, input: { password: '' } });
  });
});

describe('persistence', () => {
  it('saves and loads entries', () => {
    const storage = memoryStorage();
    const entries = [
      textEntry('नमस्ते 🎉', 5),
      createEntry('wifi', wifi, DEFAULT_STYLE, { rememberWifiPassword: false }),
    ];
    expect(saveHistory(storage, entries)).toBeNull();
    expect(loadHistory(storage)).toEqual({ entries, problem: null });
  });

  it('starts empty when nothing is stored', () => {
    expect(loadHistory(memoryStorage())).toEqual({ entries: [], problem: null });
  });

  it('recovers from data that is not JSON', () => {
    const storage = memoryStorage();
    storage.setItem(HISTORY_KEY, '{not json');
    expect(loadHistory(storage)).toEqual({ entries: [], problem: 'corrupt' });
  });

  it('drops invalid entries but keeps valid ones', () => {
    const storage = memoryStorage();
    const good = textEntry('good', 1);
    const badStyle = { ...textEntry('bad', 2), style: { ...DEFAULT_STYLE, foreground: 'red' } };
    const badType = { ...textEntry('bad', 3), type: 'sms' };
    const badSize = { ...textEntry('bad', 4), style: { ...DEFAULT_STYLE, size: 99999 } };
    storage.setItem(HISTORY_KEY, JSON.stringify([good, badStyle, badType, badSize, null, 'x']));
    expect(loadHistory(storage)).toEqual({ entries: [good], problem: 'corrupt' });
  });

  it('treats a non-array value as corrupt', () => {
    const storage = memoryStorage();
    storage.setItem(HISTORY_KEY, '{"entries":[]}');
    expect(loadHistory(storage).problem).toBe('corrupt');
  });

  it('reports blocked storage without throwing', () => {
    const storage = throwingStorage(new DOMException('denied', 'SecurityError'));
    expect(loadHistory(storage)).toEqual({ entries: [], problem: 'blocked' });
    expect(saveHistory(storage, [textEntry('a', 1)])).toBe('blocked');
    expect(loadHistory(null).problem).toBe('blocked');
  });

  it('reports full storage', () => {
    const storage = throwingStorage(new DOMException('full', 'QuotaExceededError'));
    expect(saveHistory(storage, [textEntry('a', 1)])).toBe('full');
  });
});
