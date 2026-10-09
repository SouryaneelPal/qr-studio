import { QR_TYPES, type QrInputs, type QrType, type WifiSecurity } from '../payload/types';
import { CAPTION_MAX_LENGTH, graphemes, type CaptionSettings } from '../render/caption';
import { isHexColor } from '../render/color';
import { MAX_BLEND } from '../render/plan';
import { DEFAULT_DESIGN, type QrDesign } from '../render/renderQr';
import { ERROR_CORRECTION_LEVELS, MARGIN_RANGE, SIZE_RANGE, type QrStyle } from '../render/style';
import { isThemeChoice } from '../render/themes';

export const HISTORY_KEY = 'qr-studio:history:v1';
export const HISTORY_LIMIT = 20;

export type HistoryEntry = {
  [K in QrType]: {
    id: string;
    createdAt: number;
    type: K;
    input: QrInputs[K];
    style: QrStyle;
    design: QrDesign;
    // Set when a Wi-Fi password was deliberately left out of storage.
    passwordOmitted: boolean;
  };
}[QrType];

export type StorageProblem = 'blocked' | 'full' | 'corrupt';

export function createEntry<K extends QrType>(
  type: K,
  input: QrInputs[K],
  style: QrStyle,
  options: { rememberWifiPassword: boolean; design?: QrDesign; now?: number; id?: string },
): HistoryEntry {
  const now = options.now ?? Date.now();
  const source = options.design ?? DEFAULT_DESIGN;
  const design = {
    theme: { ...source.theme },
    caption: { ...source.caption },
    blend: source.blend,
  };
  const id = options.id ?? `${now.toString(36)}-${Math.random().toString(36).slice(2, 8)}`;

  if (type === 'wifi') {
    const wifi = input as QrInputs['wifi'];
    const omit = wifi.security !== 'nopass' && !options.rememberWifiPassword;
    return {
      id,
      createdAt: now,
      type: 'wifi',
      input: { ...wifi, password: omit || wifi.security === 'nopass' ? '' : wifi.password },
      style: { ...style },
      design,
      passwordOmitted: omit,
    };
  }
  return {
    id,
    createdAt: now,
    type,
    input: { ...input },
    style: { ...style },
    design,
    passwordOmitted: false,
  } as HistoryEntry;
}

function sameContent(a: HistoryEntry, b: HistoryEntry): boolean {
  return (
    a.type === b.type &&
    a.passwordOmitted === b.passwordOmitted &&
    JSON.stringify(a.input) === JSON.stringify(b.input) &&
    JSON.stringify(a.style) === JSON.stringify(b.style) &&
    JSON.stringify(a.design) === JSON.stringify(b.design)
  );
}

export function addEntry(entries: readonly HistoryEntry[], entry: HistoryEntry): HistoryEntry[] {
  const others = entries.filter((existing) => !sameContent(existing, entry));
  return [entry, ...others].slice(0, HISTORY_LIMIT);
}

export function removeEntry(entries: readonly HistoryEntry[], id: string): HistoryEntry[] {
  return entries.filter((entry) => entry.id !== id);
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function isString(value: unknown): value is string {
  return typeof value === 'string';
}

function isIntegerInRange(value: unknown, min: number, max: number): value is number {
  return typeof value === 'number' && Number.isInteger(value) && value >= min && value <= max;
}

function parseStyle(value: unknown): QrStyle | null {
  if (!isRecord(value)) return null;
  const { size, foreground, background, errorCorrection, margin } = value;
  if (!isIntegerInRange(size, SIZE_RANGE.min, SIZE_RANGE.max)) return null;
  if (!isIntegerInRange(margin, MARGIN_RANGE.min, MARGIN_RANGE.max)) return null;
  if (!isString(foreground) || !isHexColor(foreground)) return null;
  if (!isString(background) || !isHexColor(background)) return null;
  const level = ERROR_CORRECTION_LEVELS.find((candidate) => candidate === errorCorrection);
  if (!level) return null;
  return { size, foreground, background, errorCorrection: level, margin };
}

const WIFI_SECURITIES: readonly WifiSecurity[] = ['WPA', 'WEP', 'nopass'];

function parseInput(type: QrType, value: unknown): QrInputs[QrType] | null {
  if (!isRecord(value)) return null;
  switch (type) {
    case 'url':
      return isString(value.url) ? { url: value.url } : null;
    case 'text':
      return isString(value.text) ? { text: value.text } : null;
    case 'email':
      return isString(value.address) && isString(value.subject) && isString(value.body)
        ? { address: value.address, subject: value.subject, body: value.body }
        : null;
    case 'phone':
      return isString(value.phone) ? { phone: value.phone } : null;
    case 'wifi': {
      const security = WIFI_SECURITIES.find((candidate) => candidate === value.security);
      if (!isString(value.ssid) || !isString(value.password) || typeof value.hidden !== 'boolean') {
        return null;
      }
      return security
        ? { ssid: value.ssid, password: value.password, security, hidden: value.hidden }
        : null;
    }
  }
}

function parseCaption(value: unknown): CaptionSettings | null {
  if (!isRecord(value)) return null;
  const { enabled, text, position } = value;
  if (typeof enabled !== 'boolean' || !isString(text)) return null;
  if (position !== 'top' && position !== 'bottom') return null;
  if (graphemes(text).length > CAPTION_MAX_LENGTH) return null;
  return { enabled, text, position };
}

// Entries saved before themes existed have no design; they show as Classic / Plain.
function parseDesign(value: unknown): QrDesign | null {
  if (value === undefined) return DEFAULT_DESIGN;
  if (!isRecord(value) || !isThemeChoice(value.theme)) return null;
  const caption = parseCaption(value.caption);
  // Entries saved before the Blend slider existed have no blend: they used none.
  const blend = value.blend === undefined ? 0 : value.blend;
  if (!caption || typeof blend !== 'number' || !(blend >= 0 && blend <= MAX_BLEND)) return null;
  return {
    theme: { themeId: value.theme.themeId, subThemeId: value.theme.subThemeId },
    caption,
    blend,
  };
}

export function parseEntry(value: unknown): HistoryEntry | null {
  if (!isRecord(value)) return null;
  const type = QR_TYPES.find((candidate) => candidate === value.type);
  if (!type || !isString(value.id) || typeof value.createdAt !== 'number') return null;
  const input = parseInput(type, value.input);
  const style = parseStyle(value.style);
  const design = parseDesign(value.design);
  if (!input || !style || !design) return null;
  return {
    id: value.id,
    createdAt: value.createdAt,
    type,
    input,
    style,
    design,
    passwordOmitted: value.passwordOmitted === true,
  } as HistoryEntry;
}

export interface LoadResult {
  entries: HistoryEntry[];
  problem: StorageProblem | null;
}

export function loadHistory(storage: Storage | null): LoadResult {
  if (!storage) return { entries: [], problem: 'blocked' };

  let raw: string | null;
  try {
    raw = storage.getItem(HISTORY_KEY);
  } catch {
    return { entries: [], problem: 'blocked' };
  }
  if (raw === null) return { entries: [], problem: null };

  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    return { entries: [], problem: 'corrupt' };
  }
  if (!Array.isArray(parsed)) return { entries: [], problem: 'corrupt' };

  const entries = parsed.map(parseEntry).filter((entry) => entry !== null);
  const droppedSome = entries.length !== parsed.length;
  return { entries: entries.slice(0, HISTORY_LIMIT), problem: droppedSome ? 'corrupt' : null };
}

function isQuotaError(error: unknown): boolean {
  return (
    error instanceof DOMException && (error.name === 'QuotaExceededError' || error.code === 22)
  );
}

export function saveHistory(
  storage: Storage | null,
  entries: readonly HistoryEntry[],
): StorageProblem | null {
  if (!storage) return 'blocked';
  try {
    storage.setItem(HISTORY_KEY, JSON.stringify(entries));
    return null;
  } catch (error) {
    return isQuotaError(error) ? 'full' : 'blocked';
  }
}

// Reading `window.localStorage` itself throws in some privacy modes, so guard the access.
export function getBrowserStorage(): Storage | null {
  try {
    return typeof window === 'undefined' ? null : window.localStorage;
  } catch {
    return null;
  }
}

export const STORAGE_NOTICES: Record<StorageProblem, string> = {
  blocked:
    'Your browser is blocking storage, so recent codes will be kept only until you close this tab.',
  full: 'Browser storage is full, so the latest change to recent codes wasn’t saved.',
  corrupt: 'Some saved codes were unreadable and have been removed.',
};
