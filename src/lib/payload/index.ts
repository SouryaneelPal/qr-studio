import { buildEmail, parseEmail } from './email';
import { buildPhone, parsePhone } from './phone';
import { buildText, parseText } from './text';
import { buildUrl, parseUrl } from './url';
import { buildWifi, parseWifi } from './wifi';
import type { BuildResult, ParsedPayload, QrInputs, QrType } from './types';

export function buildPayload<K extends QrType>(
  type: K,
  input: QrInputs[K],
): BuildResult<QrInputs[K]>;
export function buildPayload(type: QrType, input: QrInputs[QrType]): BuildResult<unknown> {
  switch (type) {
    case 'url':
      return buildUrl(input as QrInputs['url']);
    case 'text':
      return buildText(input as QrInputs['text']);
    case 'email':
      return buildEmail(input as QrInputs['email']);
    case 'phone':
      return buildPhone(input as QrInputs['phone']);
    case 'wifi':
      return buildWifi(input as QrInputs['wifi']);
  }
}

// Detects the type from the payload's prefix; anything unrecognised is plain text.
export function parsePayload(payload: string): ParsedPayload {
  const wifi = parseWifi(payload);
  if (wifi) return { type: 'wifi', input: wifi };
  const email = parseEmail(payload);
  if (email) return { type: 'email', input: email };
  const phone = parsePhone(payload);
  if (phone) return { type: 'phone', input: phone };
  const url = parseUrl(payload);
  if (url) return { type: 'url', input: url };
  return { type: 'text', input: parseText(payload) };
}
