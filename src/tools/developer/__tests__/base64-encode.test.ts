import { describe, it, expect } from 'vitest';
import tool from '../base64-encode';

describe('base64-encode', () => {
  it('encodes text to base64 correctly', async () => {
    const result = await tool.run({ text: 'hello' }, { mode: 'encode', variant: 'standard', inputType: 'text' });
    expect((result.data as string).trim()).toBe('aGVsbG8=');
  });

  it('decodes base64 to text correctly', async () => {
    const result = await tool.run({ text: 'aGVsbG8=' }, { mode: 'decode', variant: 'standard', inputType: 'text' });
    expect((result.data as string).trim()).toBe('hello');
  });

  it('encode/decode roundtrip', async () => {
    const original = 'Hello, World! This is a test string with some unicode: 日本語';
    const encoded = await tool.run({ text: original }, { mode: 'encode', variant: 'standard', inputType: 'text' });
    const decoded = await tool.run({ text: encoded.data as string }, { mode: 'decode', variant: 'standard', inputType: 'text' });
    expect((decoded.data as string).trim()).toBe(original);
  });

  it('produces url-safe base64', async () => {
    // Use text that produces + and / in standard base64
    const result = await tool.run({ text: '>>>?' }, { mode: 'encode', variant: 'url-safe', inputType: 'text' });
    const encoded = result.data as string;
    expect(encoded).not.toContain('+');
    expect(encoded).not.toContain('/');
  });

  it('decodes url-safe base64', async () => {
    const original = '>>>?';
    const encoded = await tool.run({ text: original }, { mode: 'encode', variant: 'url-safe', inputType: 'text' });
    const decoded = await tool.run({ text: encoded.data as string }, { mode: 'decode', variant: 'url-safe', inputType: 'text' });
    expect((decoded.data as string).trim()).toBe(original);
  });

  it('encodes empty string', async () => {
    const result = await tool.run({ text: '' }, { mode: 'encode', variant: 'standard', inputType: 'text' });
    expect(result.data as string).toBe('');
  });

  it('handles invalid base64 decode', async () => {
    await expect(
      tool.run({ text: 'not valid base64!!!' }, { mode: 'decode', variant: 'standard', inputType: 'text' })
    ).rejects.toThrow();
  });
});
