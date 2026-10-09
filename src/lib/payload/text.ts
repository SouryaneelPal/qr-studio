import type { BuildResult, TextInput } from './types';

export function buildText(input: TextInput): BuildResult<TextInput> {
  if (input.text.trim() === '') {
    return { ok: false, errors: { text: 'Enter some text.' } };
  }
  return { ok: true, payload: input.text, warnings: [] };
}

export function parseText(payload: string): TextInput {
  return { text: payload };
}
