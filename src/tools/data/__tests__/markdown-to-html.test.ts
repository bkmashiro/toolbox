import { describe, it, expect, beforeAll } from 'vitest';

let tool: typeof import('../markdown-to-html').default;

beforeAll(async () => {
  tool = (await import('../markdown-to-html')).default;
});

describe('markdown-to-html', () => {
  it('converts heading to h1 tag in source mode', async () => {
    const result = await tool.run({ markdown: '# Hello' }, { output: 'source', gfm: true, breaks: false });
    expect(result.data as string).toContain('<h1>');
    expect(result.data as string).toContain('Hello');
  });

  it('converts bold text', async () => {
    const result = await tool.run({ markdown: '**bold**' }, { output: 'source', gfm: true, breaks: false });
    expect(result.data as string).toContain('<strong>');
  });

  it('converts italic text', async () => {
    const result = await tool.run({ markdown: '_italic_' }, { output: 'source', gfm: true, breaks: false });
    expect(result.data as string).toContain('<em>');
  });

  it('converts links', async () => {
    const result = await tool.run(
      { markdown: '[click here](https://example.com)' },
      { output: 'source', gfm: true, breaks: false }
    );
    expect(result.data as string).toContain('<a');
    expect(result.data as string).toContain('href');
  });

  it('returns rendered preview HTML page', async () => {
    const result = await tool.run({ markdown: '# Test' }, { output: 'preview', gfm: true, breaks: false });
    expect(result.type).toBe('html');
    expect(result.data as string).toContain('<!DOCTYPE html>');
    expect(result.data as string).toContain('<h1>');
  });

  it('converts unordered list', async () => {
    const md = '- item 1\n- item 2';
    const result = await tool.run({ markdown: md }, { output: 'source', gfm: true, breaks: false });
    expect(result.data as string).toContain('<ul>');
    expect(result.data as string).toContain('<li>');
  });
});
