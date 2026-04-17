import { describe, it, expect } from 'vitest';
import tool from '../timestamp';

describe('timestamp', () => {
  it('converts Unix 0 to 1970-01-01', async () => {
    const result = await tool.run({ value: '0' }, { timezone: 'UTC' });
    const data = result.data as Record<string, unknown>;
    expect(data.iso8601).toBe('1970-01-01T00:00:00.000Z');
    expect(data.unixSeconds).toBe(0);
    expect(data.unixMilliseconds).toBe(0);
  });

  it('converts known unix timestamp correctly', async () => {
    // 2024-04-17T12:00:00.000Z = 1713355200
    const result = await tool.run({ value: '1713355200' }, { timezone: 'UTC' });
    const data = result.data as Record<string, unknown>;
    expect(data.iso8601).toBe('2024-04-17T12:00:00.000Z');
    expect(data.unixSeconds).toBe(1713355200);
  });

  it('auto-detects milliseconds when value > 9999999999', async () => {
    const ms = 1713355200000;
    const result = await tool.run({ value: ms.toString() }, { timezone: 'UTC' });
    const data = result.data as Record<string, unknown>;
    expect(data.inputType).toBe('unix-milliseconds');
    expect(data.unixMilliseconds).toBe(ms);
  });

  it('parses ISO date string', async () => {
    const result = await tool.run({ value: '2024-01-01T00:00:00.000Z' }, { timezone: 'UTC' });
    const data = result.data as Record<string, unknown>;
    expect(data.inputType).toBe('date-string');
    expect(data.unixSeconds).toBe(1704067200);
  });

  it('returns current time on blank input', async () => {
    const before = Math.floor(Date.now() / 1000);
    const result = await tool.run({ value: '' }, { timezone: 'UTC' });
    const after = Math.floor(Date.now() / 1000);
    const data = result.data as Record<string, unknown>;
    expect(data.unixSeconds as number).toBeGreaterThanOrEqual(before);
    expect(data.unixSeconds as number).toBeLessThanOrEqual(after);
  });

  it('includes UTC parts', async () => {
    const result = await tool.run({ value: '0' }, { timezone: 'UTC' });
    const data = result.data as Record<string, unknown>;
    const parts = data.utcParts as Record<string, unknown>;
    expect(parts.year).toBe(1970);
    expect(parts.month).toBe(1);
    expect(parts.day).toBe(1);
  });

  it('includes relative time', async () => {
    const result = await tool.run({ value: '0' }, { timezone: 'UTC' });
    const data = result.data as Record<string, unknown>;
    expect(data.relative).toContain('ago');
  });

  it('throws on invalid date', async () => {
    await expect(tool.run({ value: 'not-a-date' }, { timezone: 'UTC' })).rejects.toThrow();
  });
});
