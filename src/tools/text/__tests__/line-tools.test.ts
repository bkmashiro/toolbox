import { describe, it, expect, beforeAll } from 'vitest';

let tool: typeof import('../line-tools').default;

beforeAll(async () => {
  tool = (await import('../line-tools')).default;
});

const defaultOptions = {
  sort: 'none',
  deduplicate: false,
  reverse: false,
  trim: false,
  removeEmpty: false,
  prefix: '',
  suffix: '',
  removePrefix: '',
  removeSuffix: '',
};

describe('line-tools', () => {
  it('sorts lines alphabetically ascending', async () => {
    const text = 'banana\napple\ncherry';
    const result = await tool.run({ text }, { ...defaultOptions, sort: 'alpha-asc' });
    expect(result.data).toBe('apple\nbanana\ncherry');
  });

  it('sorts lines alphabetically descending', async () => {
    const text = 'banana\napple\ncherry';
    const result = await tool.run({ text }, { ...defaultOptions, sort: 'alpha-desc' });
    expect(result.data).toBe('cherry\nbanana\napple');
  });

  it('sorts by length ascending', async () => {
    const text = 'cat\nelephant\nox';
    const result = await tool.run({ text }, { ...defaultOptions, sort: 'len-asc' });
    const lines = (result.data as string).split('\n');
    expect(lines[0]).toBe('ox');
    expect(lines[lines.length - 1]).toBe('elephant');
  });

  it('deduplicates lines', async () => {
    const text = 'a\nb\na\nc\nb';
    const result = await tool.run({ text }, { ...defaultOptions, deduplicate: true });
    const lines = (result.data as string).split('\n');
    expect(lines).toHaveLength(3);
    expect(new Set(lines).size).toBe(3);
  });

  it('reverses line order', async () => {
    const text = 'a\nb\nc';
    const result = await tool.run({ text }, { ...defaultOptions, reverse: true });
    expect(result.data).toBe('c\nb\na');
  });

  it('trims whitespace from each line', async () => {
    const text = '  hello  \n  world  ';
    const result = await tool.run({ text }, { ...defaultOptions, trim: true });
    expect(result.data).toBe('hello\nworld');
  });

  it('removes empty lines', async () => {
    const text = 'a\n\nb\n\nc';
    const result = await tool.run({ text }, { ...defaultOptions, removeEmpty: true });
    expect(result.data).toBe('a\nb\nc');
  });

  it('adds prefix to each line', async () => {
    const text = 'foo\nbar';
    const result = await tool.run({ text }, { ...defaultOptions, prefix: '>> ' });
    expect(result.data).toBe('>> foo\n>> bar');
  });

  it('adds suffix to each line', async () => {
    const text = 'foo\nbar';
    const result = await tool.run({ text }, { ...defaultOptions, suffix: ';' });
    expect(result.data).toBe('foo;\nbar;');
  });

  it('removes prefix from lines', async () => {
    const text = '// foo\n// bar\nbaz';
    const result = await tool.run({ text }, { ...defaultOptions, removePrefix: '// ' });
    expect(result.data).toBe('foo\nbar\nbaz');
  });
});
