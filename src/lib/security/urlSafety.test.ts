import { checkUrlSafety } from './urlSafety';

function warningIds(url: string): string[] {
  const result = checkUrlSafety(url);
  if (!result.ok) throw new Error(`Unexpectedly blocked: ${result.reason}`);
  return result.warnings.map((warning) => warning.id);
}

describe('checkUrlSafety', () => {
  describe('blocked schemes', () => {
    it.each([
      ['javascript:alert(1)', 'javascript'],
      ['JavaScript:alert(1)', 'javascript'],
      ['data:text/html;base64,PHNjcmlwdD4=', 'data'],
      ['vbscript:msgbox(1)', 'vbscript'],
      ['file:///etc/passwd', 'file'],
      ['ftp://example.com', 'ftp'],
      ['chrome://settings', 'chrome'],
    ])('blocks %s', (url, scheme) => {
      const result = checkUrlSafety(url);
      expect(result.ok).toBe(false);
      expect(!result.ok && result.reason.toLowerCase()).toContain(scheme);
    });

    it('rejects text that is not a URL', () => {
      expect(checkUrlSafety('https://').ok).toBe(false);
    });

    it('allows https with no warnings', () => {
      expect(warningIds('https://developers.google.com/community/gdg')).toEqual([]);
    });
  });

  it('warns about plain http only', () => {
    expect(warningIds('http://example.com')).toEqual(['url-http']);
    expect(warningIds('https://example.com')).not.toContain('url-http');
  });

  describe('credentials', () => {
    it('warns when the URL hides its host behind user info', () => {
      const result = checkUrlSafety('https://google.com@evil.com');
      expect(result.ok && result.warnings[0]).toMatchObject({ id: 'url-credentials' });
      expect(result.ok && result.warnings[0]?.message).toContain('evil.com');
    });

    it('does not warn for an @ in the path', () => {
      expect(warningIds('https://example.com/@user')).not.toContain('url-credentials');
    });
  });

  describe('IP hosts', () => {
    it.each(['https://192.168.1.10/login', 'https://[::1]/'])('warns for %s', (url) => {
      expect(warningIds(url)).toContain('url-ip-host');
    });

    it('does not warn for names with digits', () => {
      expect(warningIds('https://web3.example.com')).not.toContain('url-ip-host');
    });
  });

  describe('punycode and non-ASCII hosts', () => {
    it('warns and shows the xn-- form of a non-ASCII host', () => {
      const result = checkUrlSafety('https://аррӏе.com');
      const warning = result.ok ? result.warnings.find((w) => w.id === 'url-punycode') : undefined;
      expect(warning?.message).toMatch(/xn--/);
    });

    it('warns for hosts typed in punycode', () => {
      expect(warningIds('https://xn--80ak6aa92e.com')).toContain('url-punycode');
    });

    it('does not warn for ASCII hosts', () => {
      expect(warningIds('https://apple.com')).not.toContain('url-punycode');
    });
  });

  describe('mixed scripts', () => {
    it('warns for Latin mixed with Cyrillic', () => {
      // The second "a" is Cyrillic U+0430.
      expect(warningIds('https://pаypal.com')).toContain('url-mixed-scripts');
    });

    it('warns for Latin mixed with Greek', () => {
      // "ο" is Greek omicron.
      expect(warningIds('https://gοogle.com')).toContain('url-mixed-scripts');
    });

    it('does not flag a single-script non-Latin host as mixed', () => {
      expect(warningIds('https://пример.рф')).not.toContain('url-mixed-scripts');
    });
  });

  describe('link shorteners', () => {
    it.each([
      'bit.ly',
      'tinyurl.com',
      't.co',
      'goo.gl',
      'ow.ly',
      'is.gd',
      'buff.ly',
      'rebrand.ly',
      'cutt.ly',
      'shorturl.at',
      'tiny.cc',
    ])('warns for %s', (host) => {
      expect(warningIds(`https://${host}/abc`)).toContain('url-shortener');
    });

    it('also matches the www. form', () => {
      expect(warningIds('https://www.bit.ly/abc')).toContain('url-shortener');
    });

    it('does not match lookalike suffixes', () => {
      expect(warningIds('https://notbit.ly/abc')).not.toContain('url-shortener');
      expect(warningIds('https://bit.ly.example.com')).not.toContain('url-shortener');
    });
  });
});
