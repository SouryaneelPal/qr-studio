import { buildPhone, parsePhone } from './phone';

describe('buildPhone', () => {
  it.each([
    ['+91 98765 43210', 'tel:+919876543210'],
    ['+1 (555) 123-4567', 'tel:+15551234567'],
    ['+44.20.7946.0958', 'tel:+442079460958'],
    ['0044 20 7946 0958', 'tel:+442079460958'],
  ])('normalises %s with a country code', (phone, payload) => {
    expect(buildPhone({ phone })).toEqual({ ok: true, payload, warnings: [] });
  });

  it('accepts a number without a country code but warns', () => {
    const result = buildPhone({ phone: '98765 43210' });
    expect(result.ok && result.payload).toBe('tel:9876543210');
    expect(result.ok && result.warnings.map((w) => w.id)).toEqual(['phone-no-country-code']);
  });

  it.each(['', '+91 98765 4321O', 'call me', '12-34'])('rejects "%s"', (phone) => {
    expect(buildPhone({ phone }).ok).toBe(false);
  });

  it('enforces 7 to 15 digits', () => {
    expect(buildPhone({ phone: '+123456' }).ok).toBe(false);
    expect(buildPhone({ phone: '+1234567' }).ok).toBe(true);
    expect(buildPhone({ phone: '+123456789012345' }).ok).toBe(true);
    expect(buildPhone({ phone: '+1234567890123456' }).ok).toBe(false);
  });
});

describe('parsePhone', () => {
  it('reads tel: links', () => {
    expect(parsePhone('tel:+919876543210')).toEqual({ phone: '+919876543210' });
    expect(parsePhone('TEL:5551234')).toEqual({ phone: '5551234' });
  });

  it('ignores other content', () => {
    expect(parsePhone('tel:+91 98')).toBeNull();
    expect(parsePhone('+919876543210')).toBeNull();
  });
});
