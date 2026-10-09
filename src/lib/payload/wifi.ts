import type { BuildResult, FieldErrors, WifiInput, WifiSecurity } from './types';

const MAX_SSID_BYTES = 32;
const HEX = /^[0-9a-f]+$/i;

export function utf8Length(value: string): number {
  return new TextEncoder().encode(value).length;
}

function characterCount(value: string): number {
  return Array.from(value).length;
}

export function escapeWifiValue(value: string): string {
  return value.replace(/[\\;,:"]/g, (char) => `\\${char}`);
}

function validateSsid(ssid: string): string | null {
  if (ssid === '') return 'Enter the network name.';
  if (utf8Length(ssid) > MAX_SSID_BYTES) {
    return `Network names can be at most ${MAX_SSID_BYTES} bytes long (emoji and non-Latin letters take several).`;
  }
  return null;
}

function validatePassword(password: string, security: WifiSecurity): string | null {
  if (security === 'nopass') return null;
  if (password === '') return 'Enter the Wi-Fi password.';

  const length = characterCount(password);
  if (security === 'WPA') {
    if (length === 64 && HEX.test(password)) return null;
    if (length >= 8 && length <= 63) return null;
    return 'WPA passwords are 8 to 63 characters, or exactly 64 hex digits.';
  }

  if ((length === 10 || length === 26) && HEX.test(password)) return null;
  if (length === 5 || length === 13) return null;
  return 'WEP keys are 5 or 13 characters, or 10 or 26 hex digits.';
}

export function buildWifi(input: WifiInput): BuildResult<WifiInput> {
  const errors: FieldErrors<WifiInput> = {};
  const ssidError = validateSsid(input.ssid);
  const passwordError = validatePassword(input.password, input.security);
  if (ssidError) errors.ssid = ssidError;
  if (passwordError) errors.password = passwordError;
  if (ssidError || passwordError) return { ok: false, errors };

  const fields = [`T:${input.security}`, `S:${escapeWifiValue(input.ssid)}`];
  if (input.security !== 'nopass') fields.push(`P:${escapeWifiValue(input.password)}`);
  if (input.hidden) fields.push('H:true');

  const warnings =
    input.security === 'WEP'
      ? [
          {
            id: 'wifi-wep',
            message:
              'WEP is outdated and easy to break. Use WPA2 or WPA3 if your router supports it.',
          },
        ]
      : [];
  return { ok: true, payload: `WIFI:${fields.map((field) => `${field};`).join('')};`, warnings };
}

function splitWifiFields(body: string): Map<string, string> {
  const fields = new Map<string, string>();
  let key = '';
  let value = '';
  let readingKey = true;

  for (let i = 0; i < body.length; i++) {
    const char = body[i];
    if (char === '\\' && i + 1 < body.length) {
      i++;
      if (readingKey) key += body[i];
      else value += body[i];
    } else if (readingKey && char === ':') {
      readingKey = false;
    } else if (!readingKey && char === ';') {
      fields.set(key.toUpperCase(), value);
      key = '';
      value = '';
      readingKey = true;
    } else if (readingKey) {
      key += char;
    } else {
      value += char;
    }
  }
  return fields;
}

function parseSecurity(type: string | undefined): WifiSecurity {
  const upper = (type ?? '').toUpperCase();
  if (upper === 'WEP') return 'WEP';
  if (upper === '' || upper === 'NOPASS') return 'nopass';
  return 'WPA';
}

export function parseWifi(payload: string): WifiInput | null {
  if (!/^WIFI:/i.test(payload)) return null;

  const fields = splitWifiFields(payload.slice('WIFI:'.length));
  const ssid = fields.get('S');
  if (ssid === undefined) return null;

  const security = parseSecurity(fields.get('T'));
  return {
    ssid,
    password: security === 'nopass' ? '' : (fields.get('P') ?? ''),
    security,
    hidden: (fields.get('H') ?? '').toLowerCase() === 'true',
  };
}
