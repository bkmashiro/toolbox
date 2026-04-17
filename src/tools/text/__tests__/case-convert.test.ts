import { describe, it, expect, beforeAll } from 'vitest';

let tool: typeof import('../case-convert').default;

beforeAll(async () => {
  tool = (await import('../case-convert')).default;
});

describe('case-convert', () => {
  const base = 'hello world foo bar';

  it('converts to camelCase', async () => {
    const result = await tool.run({ text: base }, { targetCase: 'camelCase', perLine: false });
    expect(result.data).toBe('helloWorldFooBar');
  });

  it('converts to snake_case', async () => {
    const result = await tool.run({ text: base }, { targetCase: 'snake_case', perLine: false });
    expect(result.data).toBe('hello_world_foo_bar');
  });

  it('converts to kebab-case', async () => {
    const result = await tool.run({ text: base }, { targetCase: 'kebab-case', perLine: false });
    expect(result.data).toBe('hello-world-foo-bar');
  });

  it('converts to PascalCase', async () => {
    const result = await tool.run({ text: base }, { targetCase: 'PascalCase', perLine: false });
    expect(result.data).toBe('HelloWorldFooBar');
  });

  it('converts to UPPER_SNAKE_CASE', async () => {
    const result = await tool.run({ text: base }, { targetCase: 'UPPER_SNAKE_CASE', perLine: false });
    expect(result.data).toBe('HELLO_WORLD_FOO_BAR');
  });

  it('converts to Title Case', async () => {
    const result = await tool.run({ text: base }, { targetCase: 'Title Case', perLine: false });
    expect(result.data).toBe('Hello World Foo Bar');
  });

  it('converts to sentence case', async () => {
    const result = await tool.run({ text: base }, { targetCase: 'sentence case', perLine: false });
    expect(result.data).toBe('Hello world foo bar');
  });

  it('converts camelCase input correctly', async () => {
    const result = await tool.run({ text: 'helloWorldFoo' }, { targetCase: 'snake_case', perLine: false });
    expect(result.data).toBe('hello_world_foo');
  });

  it('converts per-line when perLine is true', async () => {
    const text = 'hello world\nfoo bar';
    const result = await tool.run({ text }, { targetCase: 'camelCase', perLine: true });
    const lines = (result.data as string).split('\n');
    expect(lines[0]).toBe('helloWorld');
    expect(lines[1]).toBe('fooBar');
  });
});
