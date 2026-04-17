import { describe, it, expect, beforeAll } from 'vitest';

let tool: typeof import('../json-format').default;

beforeAll(async () => {
  tool = (await import('../json-format')).default;
});

describe('json-format', () => {
  it('pretty-prints valid JSON with 2-space indent', async () => {
    const result = await tool.run({ json: '{"a":1,"b":2}' }, { mode: 'pretty', indent: '2' });
    expect(result.type).toBe('text');
    expect(result.data).toBe(JSON.stringify({ a: 1, b: 2 }, null, 2));
  });

  it('pretty-prints valid JSON with 4-space indent', async () => {
    const result = await tool.run({ json: '{"a":1}' }, { mode: 'pretty', indent: '4' });
    expect(result.data).toBe(JSON.stringify({ a: 1 }, null, 4));
  });

  it('pretty-prints valid JSON with tab indent', async () => {
    const result = await tool.run({ json: '{"a":1}' }, { mode: 'pretty', indent: 'tab' });
    expect(result.data).toBe(JSON.stringify({ a: 1 }, null, '\t'));
  });

  it('minifies JSON', async () => {
    const input = '{\n  "a": 1,\n  "b": 2\n}';
    const result = await tool.run({ json: input }, { mode: 'minify', indent: '2' });
    expect(result.data).toBe('{"a":1,"b":2}');
  });

  it('returns parse error inline for invalid JSON', async () => {
    const result = await tool.run({ json: '{invalid}' }, { mode: 'pretty', indent: '2' });
    expect(result.type).toBe('text');
    expect(result.data as string).toMatch(/parse error/i);
  });

  it('handles arrays', async () => {
    const result = await tool.run({ json: '[1,2,3]' }, { mode: 'pretty', indent: '2' });
    expect(result.data).toBe(JSON.stringify([1, 2, 3], null, 2));
  });
});
