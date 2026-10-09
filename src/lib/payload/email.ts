import type { BuildResult, EmailInput, FieldErrors } from './types';

const MAX_ADDRESS_LENGTH = 254;
const ADDRESS_PATTERN = /^[^\s@()<>,;:"[\]\\]+@[a-z0-9-]+(\.[a-z0-9-]+)+$/i;

export function validateEmailAddress(address: string): string | null {
  const trimmed = address.trim();
  if (trimmed === '') return 'Enter an email address.';
  if (trimmed.length > MAX_ADDRESS_LENGTH) return 'That email address is too long.';
  if (!ADDRESS_PATTERN.test(trimmed)) return 'Enter an address like name@example.com.';
  return null;
}

// RFC 6068 asks for CRLF line breaks inside mailto: bodies.
function encodeMailtoValue(value: string): string {
  return encodeURIComponent(value.replace(/\r?\n/g, '\r\n'));
}

function decodeMailtoValue(value: string): string {
  return decodeURIComponent(value).replace(/\r\n/g, '\n');
}

export function buildEmail(input: EmailInput): BuildResult<EmailInput> {
  const addressError = validateEmailAddress(input.address);
  if (addressError) {
    const errors: FieldErrors<EmailInput> = { address: addressError };
    return { ok: false, errors };
  }

  const address = input.address.trim();
  const at = address.lastIndexOf('@');
  const encodedAddress = encodeURIComponent(address.slice(0, at)) + address.slice(at);

  const params: string[] = [];
  if (input.subject !== '') params.push(`subject=${encodeMailtoValue(input.subject)}`);
  if (input.body !== '') params.push(`body=${encodeMailtoValue(input.body)}`);

  const query = params.length > 0 ? `?${params.join('&')}` : '';
  return { ok: true, payload: `mailto:${encodedAddress}${query}`, warnings: [] };
}

export function parseEmail(payload: string): EmailInput | null {
  if (!/^mailto:/i.test(payload)) return null;

  const rest = payload.slice('mailto:'.length);
  const queryStart = rest.indexOf('?');
  const addressPart = queryStart === -1 ? rest : rest.slice(0, queryStart);
  const queryPart = queryStart === -1 ? '' : rest.slice(queryStart + 1);

  try {
    const result: EmailInput = { address: decodeURIComponent(addressPart), subject: '', body: '' };
    for (const pair of queryPart.split('&')) {
      const eq = pair.indexOf('=');
      if (eq === -1) continue;
      const key = pair.slice(0, eq).toLowerCase();
      const value = decodeMailtoValue(pair.slice(eq + 1));
      if (key === 'subject') result.subject = value;
      if (key === 'body') result.body = value;
    }
    return result;
  } catch {
    // Malformed percent-escapes: not something we can restore faithfully.
    return null;
  }
}
