import { describe, it, expect, beforeAll } from 'vitest';

let tool: typeof import('../json-schema').default;

beforeAll(async () => {
  tool = (await import('../json-schema')).default;
});

describe('json-schema', () => {
  it('infers string type', async () => {
    const result = await tool.run({ json: '"hello"' }, {});
    const schema = JSON.parse(result.data as string);
    expect(schema.type).toBe('string');
  });

  it('infers number type', async () => {
    const result = await tool.run({ json: '42' }, {});
    const schema = JSON.parse(result.data as string);
    expect(schema.type).toBe('number');
  });

  it('infers boolean type', async () => {
    const result = await tool.run({ json: 'true' }, {});
    const schema = JSON.parse(result.data as string);
    expect(schema.type).toBe('boolean');
  });

  it('infers null type', async () => {
    const result = await tool.run({ json: 'null' }, {});
    const schema = JSON.parse(result.data as string);
    expect(schema.type).toBe('null');
  });

  it('infers object type with properties and required', async () => {
    const obj = { name: 'Alice', age: 30, active: true };
    const result = await tool.run({ json: JSON.stringify(obj) }, {});
    const schema = JSON.parse(result.data as string);
    expect(schema.type).toBe('object');
    expect(schema.properties.name.type).toBe('string');
    expect(schema.properties.age.type).toBe('number');
    expect(schema.properties.active.type).toBe('boolean');
    expect(schema.required).toContain('name');
  });

  it('infers array type with items', async () => {
    const result = await tool.run({ json: '[1, 2, 3]' }, {});
    const schema = JSON.parse(result.data as string);
    expect(schema.type).toBe('array');
    expect(schema.items.type).toBe('number');
  });

  it('includes $schema draft-07', async () => {
    const result = await tool.run({ json: '{}' }, {});
    const schema = JSON.parse(result.data as string);
    expect(schema.$schema).toContain('draft-07');
  });

  it('returns error for invalid JSON', async () => {
    const result = await tool.run({ json: 'not json' }, {});
    expect(result.data as string).toMatch(/parse error/i);
  });
});
