import { buildEmail, parseEmail, validateEmailAddress } from './email';

function payloadOf(result: ReturnType<typeof buildEmail>): string {
  if (!result.ok) throw new Error(`Expected success, got ${JSON.stringify(result.errors)}`);
  return result.payload;
}

describe('validateEmailAddress', () => {
  it.each(['name@example.com', 'first.last+tag@sub.example.co.in', "o'neil@example.org"])(
    'accepts %s',
    (address) => {
      expect(validateEmailAddress(address)).toBeNull();
    },
  );

  it.each(['', 'plainaddress', 'a@b', 'a b@example.com', 'a@exa mple.com', '@example.com'])(
    'rejects "%s"',
    (address) => {
      expect(validateEmailAddress(address)).not.toBeNull();
    },
  );
});

describe('buildEmail', () => {
  it('builds a bare mailto: link when subject and body are empty', () => {
    expect(payloadOf(buildEmail({ address: ' hi@example.com ', subject: '', body: '' }))).toBe(
      'mailto:hi@example.com',
    );
  });

  it('encodes spaces, &, ?, # and newlines in subject and body', () => {
    const payload = payloadOf(
      buildEmail({ address: 'hi@example.com', subject: 'Q&A? #1 now', body: 'Line 1\nLine 2' }),
    );
    expect(payload).toBe(
      'mailto:hi@example.com?subject=Q%26A%3F%20%231%20now&body=Line%201%0D%0ALine%202',
    );
  });

  it('encodes non-ASCII characters as UTF-8', () => {
    const payload = payloadOf(
      buildEmail({ address: 'hi@example.com', subject: 'नमस्ते 👋', body: '' }),
    );
    expect(payload).toBe(`mailto:hi@example.com?subject=${encodeURIComponent('नमस्ते 👋')}`);
  });

  it('reports an invalid address against the address field', () => {
    expect(buildEmail({ address: 'nope', subject: 'x', body: '' })).toEqual({
      ok: false,
      errors: { address: 'Enter an address like name@example.com.' },
    });
  });
});

describe('parseEmail', () => {
  it('round-trips special characters', () => {
    const input = { address: 'hi@example.com', subject: 'a & b = c? #yes', body: 'one\ntwo 🎉' };
    expect(parseEmail(payloadOf(buildEmail(input)))).toEqual(input);
  });

  it('reads a mailto: link without parameters', () => {
    expect(parseEmail('mailto:hi@example.com')).toEqual({
      address: 'hi@example.com',
      subject: '',
      body: '',
    });
  });

  it('returns null for other content or broken escapes', () => {
    expect(parseEmail('https://example.com')).toBeNull();
    expect(parseEmail('mailto:hi@example.com?subject=%E0%A4')).toBeNull();
  });
});
