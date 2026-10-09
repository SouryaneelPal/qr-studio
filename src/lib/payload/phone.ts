import type { BuildResult, PhoneInput } from './types';

const ALLOWED_CHARACTERS = /^\+?[\d\s().-]+$/;
const MIN_DIGITS = 7;
const MAX_DIGITS = 15;

export function buildPhone(input: PhoneInput): BuildResult<PhoneInput> {
  const trimmed = input.phone.trim();
  if (trimmed === '') {
    return { ok: false, errors: { phone: 'Enter a phone number.' } };
  }
  if (!ALLOWED_CHARACTERS.test(trimmed)) {
    return {
      ok: false,
      errors: { phone: 'Use only digits, spaces, dashes, dots, brackets and a leading +.' },
    };
  }

  let digits = trimmed.replace(/\D/g, '');
  let international = trimmed.startsWith('+');
  // "00" is the international dialling prefix in most countries, so treat it like "+".
  if (!international && digits.startsWith('00')) {
    digits = digits.slice(2);
    international = true;
  }

  if (digits.length < MIN_DIGITS || digits.length > MAX_DIGITS) {
    return {
      ok: false,
      errors: { phone: `Phone numbers have ${MIN_DIGITS} to ${MAX_DIGITS} digits.` },
    };
  }

  const warnings = international
    ? []
    : [
        {
          id: 'phone-no-country-code',
          message:
            'No country code. Add one (for example +91) so the number works from any country.',
        },
      ];
  return { ok: true, payload: `tel:${international ? '+' : ''}${digits}`, warnings };
}

export function parsePhone(payload: string): PhoneInput | null {
  const match = /^tel:(\+?\d+)$/i.exec(payload);
  return match?.[1] ? { phone: match[1] } : null;
}
