import { describe, it, expect, beforeAll } from 'vitest';

let tool: typeof import('../binary-text').default;

beforeAll(async () => {
  tool = (await import('../binary-text')).default;
});

describe('binary-text', () => {
  it('encodes "Hi" to binary', async () => {
    const result = await tool.run({ input: 'Hi' }, { direction: 'encode', encoding: 'ascii' });
    // H = 72 = 01001000, i = 105 = 01101001
    expect(result.data).toBe('01001000 01101001');
  });

  it('decodes binary to "Hi"', async () => {
    const result = await tool.run(
      { input: '01001000 01101001' },
      { direction: 'decode', encoding: 'ascii' }
    );
    expect(result.data).toBe('Hi');
  });

  it('roundtrips text through encode then decode', async () => {
    const original = 'Hello, World!';
    const encoded = await tool.run({ input: original }, { direction: 'encode', encoding: 'ascii' });
    const decoded = await tool.run({ input: encoded.data as string }, { direction: 'decode', encoding: 'ascii' });
    expect(decoded.data).toBe(original);
  });

  it('encodes space correctly', async () => {
    const result = await tool.run({ input: ' ' }, { direction: 'encode', encoding: 'ascii' });
    // space = 32 = 00100000
    expect(result.data).toBe('00100000');
  });

  it('handles invalid bytes in decode with ?', async () => {
    const result = await tool.run({ input: 'not-binary' }, { direction: 'decode', encoding: 'ascii' });
    expect(result.data as string).toContain('?');
  });
});
