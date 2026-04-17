import { describe, it, expect, beforeAll } from 'vitest';

let tool: typeof import('../json-to-csv').default;

beforeAll(async () => {
  tool = (await import('../json-to-csv')).default;
});

describe('json-to-csv', () => {
  const input = [
    { name: 'Alice', age: 30, city: 'NY' },
    { name: 'Bob', age: 25, city: 'LA' },
  ];

  it('converts array of objects to CSV with headers', async () => {
    const result = await tool.run({ json: JSON.stringify(input) }, { delimiter: ',', headers: true });
    expect(result.type).toBe('text');
    const lines = (result.data as string).split('\n');
    expect(lines[0]).toContain('name');
    expect(lines[0]).toContain('age');
    expect(lines[1]).toContain('Alice');
  });

  it('converts without headers', async () => {
    const result = await tool.run({ json: JSON.stringify(input) }, { delimiter: ',', headers: false });
    const lines = (result.data as string).split('\n');
    // First line should be data, not header names
    expect(lines[0]).not.toContain('name');
    expect(lines[0]).toContain('Alice');
  });

  it('supports semicolon delimiter', async () => {
    const result = await tool.run({ json: JSON.stringify(input) }, { delimiter: ';', headers: true });
    expect(result.data as string).toContain(';');
  });

  it('returns error for non-array input', async () => {
    const result = await tool.run({ json: '{"a":1}' }, { delimiter: ',', headers: true });
    expect(result.data as string).toMatch(/must be a json array/i);
  });

  it('returns parse error for invalid JSON', async () => {
    const result = await tool.run({ json: 'not json' }, { delimiter: ',', headers: true });
    expect(result.data as string).toMatch(/parse error/i);
  });
});
