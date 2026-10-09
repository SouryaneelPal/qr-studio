import { buildPayload, parsePayload } from '.';
import { describeForScreenReader, describeInput } from './describe';

describe('parsePayload', () => {
  it.each([
    ['WIFI:T:WPA;S:Home;P:secret12;;', 'wifi'],
    ['mailto:a@example.com', 'email'],
    ['tel:+15551234567', 'phone'],
    ['https://example.com', 'url'],
    ['just words', 'text'],
  ])('detects %s as %s', (payload, type) => {
    expect(parsePayload(payload).type).toBe(type);
  });
});

describe('buildPayload', () => {
  it('dispatches to the builder for each type', () => {
    expect(buildPayload('text', { text: 'hi' })).toMatchObject({ ok: true, payload: 'hi' });
    expect(buildPayload('phone', { phone: '+15551234567' })).toMatchObject({
      payload: 'tel:+15551234567',
    });
  });
});

describe('describeInput', () => {
  it('never includes the Wi-Fi password', () => {
    const input = {
      ssid: 'Home',
      password: 'super-secret',
      security: 'WPA' as const,
      hidden: true,
    };
    expect(describeInput('wifi', input)).toBe('Home (WPA secured, hidden)');
    expect(describeForScreenReader('wifi', input)).not.toContain('super-secret');
  });

  it('shortens long text', () => {
    expect(Array.from(describeInput('text', { text: 'x'.repeat(200) }))).toHaveLength(80);
  });
});
