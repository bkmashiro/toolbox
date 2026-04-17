import { describe, it, expect, beforeAll } from 'vitest';

let tool: typeof import('../json-to-ts').default;

beforeAll(async () => {
  tool = (await import('../json-to-ts')).default;
});

describe('json-to-ts', () => {
  it('generates interface for simple object', async () => {
    const result = await tool.run(
      { json: '{"name":"Alice","age":30}' },
      { rootName: 'Person', exportKeyword: false }
    );
    expect(result.data as string).toContain('interface Person');
    expect(result.data as string).toContain('name: string');
    expect(result.data as string).toContain('age: number');
  });

  it('exports interfaces when exportKeyword is true', async () => {
    const result = await tool.run(
      { json: '{"x":1}' },
      { rootName: 'Root', exportKeyword: true }
    );
    expect(result.data as string).toContain('export interface Root');
  });

  it('handles boolean fields', async () => {
    const result = await tool.run(
      { json: '{"active":true}' },
      { rootName: 'Root', exportKeyword: false }
    );
    expect(result.data as string).toContain('active: boolean');
  });

  it('handles array fields', async () => {
    const result = await tool.run(
      { json: '{"tags":["a","b"]}' },
      { rootName: 'Root', exportKeyword: false }
    );
    expect(result.data as string).toContain('string[]');
  });

  it('handles nested objects', async () => {
    const result = await tool.run(
      { json: '{"address":{"street":"Main St","city":"NY"}}' },
      { rootName: 'Root', exportKeyword: false }
    );
    expect(result.data as string).toContain('interface');
    expect(result.data as string).toContain('street: string');
  });

  it('returns error for invalid JSON', async () => {
    const result = await tool.run({ json: 'invalid' }, { rootName: 'Root', exportKeyword: false });
    expect(result.data as string).toMatch(/parse error/i);
  });
});
