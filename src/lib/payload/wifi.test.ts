import type { WifiInput } from './types';
import { buildWifi, escapeWifiValue, parseWifi } from './wifi';

const base: WifiInput = { ssid: 'Home', password: 'correct horse', security: 'WPA', hidden: false };

function payloadOf(input: WifiInput): string {
  const result = buildWifi(input);
  if (!result.ok) throw new Error(`Expected success, got ${JSON.stringify(result.errors)}`);
  return result.payload;
}

describe('escapeWifiValue', () => {
  it('backslash-escapes \\ ; , : and "', () => {
    expect(escapeWifiValue(String.raw`a\b;c,d:e"f`)).toBe(String.raw`a\\b\;c\,d\:e\"f`);
  });
});

describe('buildWifi', () => {
  it('builds a WPA network', () => {
    expect(payloadOf(base)).toBe('WIFI:T:WPA;S:Home;P:correct horse;;');
  });

  it('escapes special characters in the SSID and password', () => {
    expect(payloadOf({ ...base, ssid: 'Café;"Net"', password: String.raw`p@ss:w,rd\;` })).toBe(
      String.raw`WIFI:T:WPA;S:Café\;\"Net\";P:p@ss\:w\,rd\\\;;;`,
    );
  });

  it('omits the password for open networks', () => {
    expect(payloadOf({ ...base, security: 'nopass', password: 'ignored' })).toBe(
      'WIFI:T:nopass;S:Home;;',
    );
  });

  it('adds H:true only for hidden networks', () => {
    expect(payloadOf({ ...base, hidden: true })).toBe('WIFI:T:WPA;S:Home;P:correct horse;H:true;;');
    expect(payloadOf(base)).not.toContain('H:');
  });

  it('accepts emoji SSIDs within 32 UTF-8 bytes', () => {
    expect(buildWifi({ ...base, ssid: '☕ Café 🍰' }).ok).toBe(true);
    // Each of these emoji is 4 bytes: 9 of them is 36 bytes.
    expect(buildWifi({ ...base, ssid: '🎉'.repeat(9) })).toMatchObject({
      ok: false,
      errors: { ssid: expect.any(String) },
    });
  });

  it('requires an SSID', () => {
    expect(buildWifi({ ...base, ssid: '' })).toMatchObject({
      ok: false,
      errors: { ssid: 'Enter the network name.' },
    });
  });

  describe('WPA passwords', () => {
    it.each([
      ['8 characters', '12345678', true],
      ['63 characters', 'x'.repeat(63), true],
      ['64 hex digits', 'aB'.repeat(32), true],
      ['7 characters', '1234567', false],
      ['64 non-hex characters', 'z'.repeat(64), false],
      ['empty', '', false],
    ])('%s → valid: %s', (_label, password, valid) => {
      expect(buildWifi({ ...base, password }).ok).toBe(valid);
    });
  });

  describe('WEP keys', () => {
    it.each([
      ['5 characters', 'abcde', true],
      ['13 characters', 'abcdefghijklm', true],
      ['10 hex digits', '0123456789', true],
      ['26 hex digits', 'a'.repeat(26), true],
      ['10 non-hex characters', 'zzzzzzzzzz', false],
      ['8 characters', '12345678', false],
    ])('%s → valid: %s', (_label, password, valid) => {
      expect(buildWifi({ ...base, security: 'WEP', password }).ok).toBe(valid);
    });

    it('warns that WEP is outdated', () => {
      const result = buildWifi({ ...base, security: 'WEP', password: 'abcde' });
      expect(result.ok && result.warnings.map((w) => w.id)).toEqual(['wifi-wep']);
    });
  });
});

describe('parseWifi', () => {
  it.each<WifiInput>([
    base,
    { ...base, hidden: true },
    { ssid: 'Open Café', password: '', security: 'nopass', hidden: false },
    { ssid: 'a;b,c:d\\e"f', password: '"quoted";\\,:', security: 'WPA', hidden: true },
    { ssid: 'नेटवर्क 📶', password: 'पासवर्ड123', security: 'WPA', hidden: false },
    { ssid: 'Legacy', password: '0123456789', security: 'WEP', hidden: false },
  ])('round-trips %j', (input) => {
    expect(parseWifi(payloadOf(input))).toEqual(input);
  });

  it('reads fields in any order and maps WPA2/WPA3 to WPA', () => {
    expect(parseWifi('WIFI:S:Net;P:secret12;T:WPA2;;')).toEqual({
      ssid: 'Net',
      password: 'secret12',
      security: 'WPA',
      hidden: false,
    });
  });

  it('returns null without an SSID or prefix', () => {
    expect(parseWifi('WIFI:T:WPA;P:x;;')).toBeNull();
    expect(parseWifi('hello')).toBeNull();
  });
});
