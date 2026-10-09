import { buildText, parseText } from './text';

describe('buildText', () => {
  it.each([
    ['plain ASCII', 'Hello, GDG!'],
    ['Hindi', 'नमस्ते दुनिया'],
    ['emoji', 'QR 🎉👩🏽‍💻'],
    ['multi-line', 'line one\nline two'],
  ])('keeps %s text exactly', (_label, text) => {
    expect(buildText({ text })).toEqual({ ok: true, payload: text, warnings: [] });
  });

  it('rejects empty or whitespace-only text', () => {
    expect(buildText({ text: '' }).ok).toBe(false);
    expect(buildText({ text: ' \n\t' })).toEqual({
      ok: false,
      errors: { text: 'Enter some text.' },
    });
  });

  it('parses any payload as text', () => {
    expect(parseText('anything at all')).toEqual({ text: 'anything at all' });
  });
});
