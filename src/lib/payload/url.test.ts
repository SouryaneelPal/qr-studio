import { buildUrl, normaliseUrl, parseUrl } from './url';

describe('normaliseUrl', () => {
  it('trims and adds https:// when there is no scheme', () => {
    expect(normaliseUrl('  example.com/path  ')).toBe('https://example.com/path');
  });

  it('treats host:port as a host, not a scheme', () => {
    expect(normaliseUrl('example.com:8080/a')).toBe('https://example.com:8080/a');
  });

  it('keeps an existing scheme', () => {
    expect(normaliseUrl('http://example.com')).toBe('http://example.com');
    expect(normaliseUrl('javascript:alert(1)')).toBe('javascript:alert(1)');
  });
});

describe('buildUrl', () => {
  it('builds the normalised URL as the payload', () => {
    expect(buildUrl({ url: 'gdg.community.dev' })).toEqual({
      ok: true,
      payload: 'https://gdg.community.dev',
      warnings: [],
    });
  });

  it('rejects empty input', () => {
    expect(buildUrl({ url: '   ' })).toEqual({
      ok: false,
      errors: { url: 'Enter a web address.' },
    });
  });

  it('rejects addresses containing spaces', () => {
    expect(buildUrl({ url: 'https://exa mple.com' }).ok).toBe(false);
  });

  it.each(['javascript:alert(1)', 'data:text/html,hi', 'ftp://example.com', 'mailto:a@b.co'])(
    'rejects the non-web scheme in %s',
    (url) => {
      const result = buildUrl({ url });
      expect(result.ok).toBe(false);
    },
  );

  it('passes security warnings through without blocking', () => {
    const result = buildUrl({ url: 'http://bit.ly/x' });
    expect(result.ok && result.warnings.map((w) => w.id)).toEqual(['url-http', 'url-shortener']);
  });
});

describe('parseUrl', () => {
  it('recognises http and https links', () => {
    expect(parseUrl('https://example.com')).toEqual({ url: 'https://example.com' });
    expect(parseUrl('HTTP://example.com')).toEqual({ url: 'HTTP://example.com' });
  });

  it('ignores other content', () => {
    expect(parseUrl('example.com')).toBeNull();
    expect(parseUrl('mailto:a@b.co')).toBeNull();
  });
});
