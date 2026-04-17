import { describe, it, expect } from 'vitest';
import tool from '../url-parse';

describe('url-parse', () => {
  it('parses complex URL correctly', async () => {
    const url = 'https://user:pass@example.com:8080/path/to/page?key=value&foo=bar#section';
    const result = await tool.run({ url }, {});
    const data = result.data as Record<string, unknown>;

    expect(data.protocol).toBe('https:');
    expect(data.hostname).toBe('example.com');
    expect(data.port).toBe('8080');
    expect(data.pathname).toBe('/path/to/page');
    expect(data.hash).toBe('#section');
    expect(data.username).toBe('user');
    expect(data.password).toBe('pass');
  });

  it('parses search params correctly', async () => {
    const result = await tool.run({ url: 'https://example.com?a=1&b=2&c=3' }, {});
    const data = result.data as Record<string, unknown>;
    const params = data.searchParams as Record<string, string>;
    expect(params.a).toBe('1');
    expect(params.b).toBe('2');
    expect(params.c).toBe('3');
  });

  it('handles URL without port', async () => {
    const result = await tool.run({ url: 'https://example.com/path' }, {});
    const data = result.data as Record<string, unknown>;
    expect(data.port).toBeNull();
  });

  it('handles URL without path', async () => {
    const result = await tool.run({ url: 'https://example.com' }, {});
    const data = result.data as Record<string, unknown>;
    expect(data.pathname).toBe('/');
  });

  it('handles URL without hash', async () => {
    const result = await tool.run({ url: 'https://example.com/path' }, {});
    const data = result.data as Record<string, unknown>;
    expect(data.hash).toBeNull();
  });

  it('returns params table as array', async () => {
    const result = await tool.run({ url: 'https://example.com?x=1&y=2' }, {});
    const data = result.data as Record<string, unknown>;
    const table = data.paramsTable as Array<{ key: string; value: string }>;
    expect(Array.isArray(table)).toBe(true);
    expect(table.length).toBe(2);
  });

  it('handles empty URL input', async () => {
    await expect(tool.run({ url: '' }, {})).rejects.toThrow('URL is required');
  });

  it('parses origin correctly', async () => {
    const result = await tool.run({ url: 'https://example.com:3000/path' }, {});
    const data = result.data as Record<string, unknown>;
    expect(data.origin).toBe('https://example.com:3000');
  });
});
