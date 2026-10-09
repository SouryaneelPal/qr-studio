import type { Warning } from '../payload/types';

export type UrlSafety = { ok: true; warnings: Warning[] } | { ok: false; reason: string };

const LINK_SHORTENERS = new Set([
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
]);

const BLOCKED_SCHEME_REASONS: Record<string, string> = {
  'javascript:': 'Links starting with “javascript:” run code when opened, so they are blocked.',
  'data:': 'Links starting with “data:” can disguise harmful pages, so they are blocked.',
  'vbscript:': 'Links starting with “vbscript:” run code when opened, so they are blocked.',
  'file:': 'Links to files on a computer won’t work on someone else’s phone, so they are blocked.',
};

const IPV4_HOST = /^\d{1,3}(\.\d{1,3}){3}$/;
const LATIN = /[a-z]/i;
const LOOKALIKE_SCRIPTS = /[\p{Script=Cyrillic}\p{Script=Greek}]/u;

// The URL API converts hostnames to punycode, so read the host as typed to inspect its letters.
function hostAsTyped(url: string): string {
  const match = /^[a-z][a-z0-9+.-]*:\/\/(?:[^@/?#]*@)?([^/?#:]+)/i.exec(url);
  return match?.[1] ?? '';
}

function stripWww(hostname: string): string {
  return hostname.replace(/^www\./, '');
}

export function checkUrlSafety(raw: string): UrlSafety {
  let url: URL;
  try {
    url = new URL(raw);
  } catch {
    return { ok: false, reason: 'That doesn’t look like a valid web address.' };
  }

  const protocol = url.protocol.toLowerCase();
  if (protocol !== 'http:' && protocol !== 'https:') {
    return {
      ok: false,
      reason:
        BLOCKED_SCHEME_REASONS[protocol] ??
        `Only web links (http or https) are allowed, not “${protocol}”.`,
    };
  }
  if (url.hostname === '') {
    return { ok: false, reason: 'The link is missing a website name.' };
  }

  const warnings: Warning[] = [];
  const hostname = url.hostname.toLowerCase();

  if (protocol === 'http:') {
    warnings.push({
      id: 'url-http',
      message: 'This link isn’t encrypted (http). Use https if the site supports it.',
    });
  }
  if (url.username !== '' || url.password !== '') {
    warnings.push({
      id: 'url-credentials',
      message: `Everything before the “@” is ignored by browsers. This link really opens ${hostname}.`,
    });
  }
  if (IPV4_HOST.test(hostname) || hostname.startsWith('[')) {
    warnings.push({
      id: 'url-ip-host',
      message:
        'This link uses a raw IP address instead of a website name, which is hard to verify.',
    });
  }
  if (hostname.split('.').some((label) => label.startsWith('xn--'))) {
    warnings.push({
      id: 'url-punycode',
      message: `This website name uses special characters. Phones may show it as ${hostname}. Check it is the site you expect.`,
    });
  }

  const typedHost = hostAsTyped(raw);
  const mixesScripts = typedHost
    .split('.')
    .some((label) => LATIN.test(label) && LOOKALIKE_SCRIPTS.test(label));
  if (mixesScripts) {
    warnings.push({
      id: 'url-mixed-scripts',
      message:
        'This website name mixes Latin letters with Cyrillic or Greek letters that look the same. It may imitate another site.',
    });
  }

  if (LINK_SHORTENERS.has(stripWww(hostname))) {
    warnings.push({
      id: 'url-shortener',
      message: 'Link shorteners hide the real destination. Consider using the full link.',
    });
  }

  return { ok: true, warnings };
}
