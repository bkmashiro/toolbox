import { describe, it, expect, beforeAll } from 'vitest';

let tool: typeof import('../find-replace').default;

beforeAll(async () => {
  tool = (await import('../find-replace')).default;
});

const defaultOptions = {
  mode: 'result',
  useRegex: false,
  caseSensitive: true,
  wholeWord: false,
};

describe('find-replace', () => {
  it('performs a simple find and replace', async () => {
    const result = await tool.run(
      { text: 'hello world', rules: 'hello → goodbye' },
      defaultOptions
    );
    expect(result.data).toBe('goodbye world');
  });

  it('performs multiple replacements from rules', async () => {
    const rules = 'foo → bar\nbaz → qux';
    const result = await tool.run(
      { text: 'foo and baz', rules },
      defaultOptions
    );
    expect(result.data).toBe('bar and qux');
  });

  it('supports -> separator as well as →', async () => {
    const result = await tool.run(
      { text: 'hello', rules: 'hello -> world' },
      defaultOptions
    );
    expect(result.data).toBe('world');
  });

  it('ignores comment lines starting with #', async () => {
    const rules = '# this is a comment\nhello → world';
    const result = await tool.run({ text: 'hello', rules }, defaultOptions);
    expect(result.data).toBe('world');
  });

  it('uses regex patterns when useRegex is true', async () => {
    const result = await tool.run(
      { text: 'abc123def456', rules: '\\d+ → NUM' },
      { ...defaultOptions, useRegex: true }
    );
    expect(result.data).toBe('abcNUMdefNUM');
  });

  it('is case-sensitive by default', async () => {
    const result = await tool.run(
      { text: 'Hello hello HELLO', rules: 'hello → world' },
      defaultOptions
    );
    expect(result.data).toBe('Hello world HELLO');
  });

  it('is case-insensitive when caseSensitive is false', async () => {
    const result = await tool.run(
      { text: 'Hello hello HELLO', rules: 'hello → world' },
      { ...defaultOptions, caseSensitive: false }
    );
    expect(result.data).toBe('world world world');
  });

  it('shows preview when mode is preview', async () => {
    const result = await tool.run(
      { text: 'foo bar', rules: 'foo → baz' },
      { ...defaultOptions, mode: 'preview' }
    );
    expect(result.data as string).toContain('Preview');
    expect(result.data as string).toContain('baz');
  });

  it('returns original text when no rules defined', async () => {
    const result = await tool.run({ text: 'hello', rules: '' }, defaultOptions);
    expect(result.data).toBe('hello');
  });
});
