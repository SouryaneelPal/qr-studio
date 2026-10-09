import fc from 'fast-check';
import { buildPayload, parsePayload } from './payload';
import type { ParsedPayload, QrInputs, QrType, WifiInput } from './payload/types';
import { utf8Length } from './payload/wifi';
import { planToPixels } from './render/outputs';
import { renderQr } from './render/renderQr';
import { DEFAULT_STYLE } from './render/style';
import { decodePixels } from './scan/decode';

const RUNS = { numRuns: 100 };
const style = { ...DEFAULT_STYLE, size: 512, errorCorrection: 'M' as const };

// Build → render → rasterise → decode with jsQR → parse. Returns what a phone would understand.
function scanBack<K extends QrType>(
  type: K,
  input: QrInputs[K],
): { payload: string; parsed: ParsedPayload } {
  const built = buildPayload(type, input);
  if (!built.ok) throw new Error(`Generated invalid input: ${JSON.stringify(built.errors)}`);
  const rendered = renderQr(built.payload, style);
  if (!rendered.ok) throw new Error(rendered.error);
  const decoded = decodePixels(planToPixels(rendered.plan));
  expect(decoded).toBe(built.payload);
  return { payload: built.payload, parsed: parsePayload(decoded ?? '') };
}

const anyText = fc.string({ unit: 'binary', minLength: 1, maxLength: 120 });

describe('every generated code decodes back to its input', () => {
  it('plain text, including emoji and non-Latin scripts', () => {
    const text = fc.oneof(
      anyText,
      fc.string({ unit: 'grapheme', minLength: 1, maxLength: 60 }),
      fc.constantFrom('नमस्ते दुनिया', 'こんにちは', '👩🏽‍💻🎉', 'مرحبا'),
    );
    fc.assert(
      fc.property(
        text.filter((value) => value.trim() !== ''),
        (value) => {
          const built = buildPayload('text', { text: value });
          if (!built.ok) throw new Error('unexpected');
          const rendered = renderQr(built.payload, style);
          if (!rendered.ok) throw new Error(rendered.error);
          // Text that happens to look like another type is still restored verbatim.
          expect(decodePixels(planToPixels(rendered.plan))).toBe(value);
        },
      ),
      RUNS,
    );
  });

  it('URLs', () => {
    fc.assert(
      fc.property(fc.webUrl({ withQueryParameters: true, withFragments: true }), (url) => {
        const { parsed } = scanBack('url', { url });
        expect(parsed).toEqual({ type: 'url', input: { url } });
      }),
      RUNS,
    );
  });

  it('emails with special characters in subject and body', () => {
    const lineText = fc
      .string({ unit: 'binary', maxLength: 60 })
      .map((value) => value.replace(/\r/g, ''));
    const email = fc.record({
      address: fc.emailAddress().filter((address) => address.length <= 120),
      subject: fc.oneof(lineText, fc.constantFrom('Q&A? #1', 'a=b&c=d', '100% ✓')),
      body: lineText,
    });
    fc.assert(
      fc.property(email, (input) => {
        const { parsed } = scanBack('email', input);
        expect(parsed).toEqual({ type: 'email', input });
      }),
      RUNS,
    );
  });

  it('phone numbers with any separators', () => {
    const separator = fc.constantFrom('', ' ', '-', '.', '(', ')');
    const phone = fc
      .record({
        international: fc.boolean(),
        digits: fc.array(fc.integer({ min: 0, max: 9 }), { minLength: 7, maxLength: 15 }),
        separators: fc.array(separator, { minLength: 15, maxLength: 15 }),
      })
      // A leading 00 is read as an international prefix, which changes the digits on purpose.
      .filter(
        ({ international, digits }) => international || !(digits[0] === 0 && digits[1] === 0),
      );

    fc.assert(
      fc.property(phone, ({ international, digits, separators }) => {
        const formatted = digits.map((digit, i) => `${digit}${separators[i] ?? ''}`).join('');
        const { parsed } = scanBack('phone', { phone: `${international ? '+' : ''}${formatted}` });
        expect(parsed).toEqual({
          type: 'phone',
          input: { phone: `${international ? '+' : ''}${digits.join('')}` },
        });
      }),
      RUNS,
    );
  });

  it('Wi-Fi networks with escaped characters, open and hidden networks', () => {
    const tricky = fc.constantFrom(';', ',', ':', '\\', '"', '📶', 'ü', ' ');
    const withTricky = (minLength: number, maxLength: number) =>
      fc.string({
        unit: fc.oneof(tricky, fc.string({ unit: 'binary', minLength: 1, maxLength: 1 })),
        minLength,
        maxLength,
      });

    const ssid = withTricky(1, 32).filter((value) => utf8Length(value) <= 32);
    const wpaPassword = fc.oneof(
      withTricky(8, 63).filter(
        (value) => Array.from(value).length >= 8 && Array.from(value).length <= 63,
      ),
      fc.string({
        unit: fc.constantFrom(...'0123456789abcdefABCDEF'),
        minLength: 64,
        maxLength: 64,
      }),
    );
    const wepPassword = fc.oneof(
      withTricky(5, 5).filter((value) => Array.from(value).length === 5),
      fc.string({ unit: fc.constantFrom(...'0123456789abcdef'), minLength: 26, maxLength: 26 }),
    );

    const network: fc.Arbitrary<WifiInput> = fc.oneof(
      fc.record({
        ssid,
        password: wpaPassword,
        security: fc.constant('WPA' as const),
        hidden: fc.boolean(),
      }),
      fc.record({
        ssid,
        password: wepPassword,
        security: fc.constant('WEP' as const),
        hidden: fc.boolean(),
      }),
      fc.record({
        ssid,
        password: fc.constant(''),
        security: fc.constant('nopass' as const),
        hidden: fc.boolean(),
      }),
    );

    fc.assert(
      fc.property(network, (input) => {
        const { parsed } = scanBack('wifi', input);
        expect(parsed).toEqual({ type: 'wifi', input });
      }),
      RUNS,
    );
  });
});
