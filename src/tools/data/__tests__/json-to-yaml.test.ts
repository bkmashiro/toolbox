import { describe, it, expect, beforeAll } from 'vitest';
import yaml from 'js-yaml';

let tool: typeof import('../json-to-yaml').default;

beforeAll(async () => {
  tool = (await import('../json-to-yaml')).default;
});

describe('json-to-yaml', () => {
  it('converts simple JSON to YAML', async () => {
    const result = await tool.run({ json: '{"name":"Alice","age":30}' }, { indent: 2 });
    expect(result.type).toBe('text');
    const parsed = yaml.load(result.data as string);
    expect(parsed).toEqual({ name: 'Alice', age: 30 });
  });

  it('roundtrips JSON → YAML → JSON', async () => {
    const original = { foo: 'bar', nested: { x: 1, y: [2, 3] } };
    const result = await tool.run({ json: JSON.stringify(original) }, { indent: 2 });
    const backToObj = yaml.load(result.data as string);
    expect(backToObj).toEqual(original);
  });

  it('handles arrays', async () => {
    const result = await tool.run({ json: '[1,2,3]' }, { indent: 2 });
    expect(result.data as string).toMatch(/- 1/);
  });

  it('returns error on invalid JSON', async () => {
    const result = await tool.run({ json: 'not json' }, { indent: 2 });
    expect(result.data as string).toMatch(/parse error/i);
  });
});
