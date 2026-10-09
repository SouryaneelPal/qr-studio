import { checkUrlSafety } from '../security/urlSafety';
import type { BuildResult, UrlInput } from './types';

// A scheme is "letters followed by a colon", except when digits follow the colon:
// "example.com:8080" is a host with a port, not a scheme called "example.com".
const SCHEME_PATTERN = /^[a-z][a-z0-9+.-]*:(?!\d)/i;

export function normaliseUrl(raw: string): string {
  const trimmed = raw.trim();
  if (trimmed === '' || SCHEME_PATTERN.test(trimmed)) {
    return trimmed;
  }
  return `https://${trimmed}`;
}

export function buildUrl(input: UrlInput): BuildResult<UrlInput> {
  const url = normaliseUrl(input.url);
  if (url === '') {
    return { ok: false, errors: { url: 'Enter a web address.' } };
  }
  if (/\s/.test(url)) {
    return { ok: false, errors: { url: 'Web addresses can’t contain spaces.' } };
  }

  const safety = checkUrlSafety(url);
  if (!safety.ok) {
    return { ok: false, errors: { url: safety.reason } };
  }
  return { ok: true, payload: url, warnings: safety.warnings };
}

export function parseUrl(payload: string): UrlInput | null {
  return /^https?:\/\//i.test(payload) ? { url: payload } : null;
}
