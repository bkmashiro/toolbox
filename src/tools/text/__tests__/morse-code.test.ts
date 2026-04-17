import { describe, it, expect, beforeAll } from 'vitest';

let tool: typeof import('../morse-code').default;

beforeAll(async () => {
  tool = (await import('../morse-code')).default;
});

describe('morse-code', () => {
  it('encodes SOS correctly', async () => {
    const result = await tool.run({ input: 'SOS' }, { direction: 'encode' });
    expect(result.data).toBe('... --- ...');
  });

  it('decodes SOS correctly', async () => {
    const result = await tool.run({ input: '... --- ...' }, { direction: 'decode' });
    expect(result.data).toBe('SOS');
  });

  it('encodes hello', async () => {
    const result = await tool.run({ input: 'hello' }, { direction: 'encode' });
    // H=.... E=. L=.-.. L=.-.. O=---
    expect(result.data).toBe('.... . .-.. .-.. ---');
  });

  it('decodes hello', async () => {
    const result = await tool.run({ input: '.... . .-.. .-.. ---' }, { direction: 'decode' });
    expect(result.data).toBe('HELLO');
  });

  it('encodes space as / separator', async () => {
    const result = await tool.run({ input: 'A B' }, { direction: 'encode' });
    expect(result.data).toContain('/');
  });

  it('roundtrips text through encode then decode', async () => {
    const original = 'MORSE TEST';
    const encoded = await tool.run({ input: original }, { direction: 'encode' });
    const decoded = await tool.run({ input: encoded.data as string }, { direction: 'decode' });
    expect((decoded.data as string).toUpperCase()).toBe(original);
  });
});
