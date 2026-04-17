import { describe, it, expect } from 'vitest';
import tool from '../cron-parse';

describe('cron-parse', () => {
  it('parses "0 9 * * 1" (every Monday at 9am)', async () => {
    const result = await tool.run({ expression: '0 9 * * 1' }, { timezone: 'UTC' });
    const data = result.data as Record<string, unknown>;
    expect(data.description).toContain('Monday');
    expect(data.description).toContain('9:00');
  });

  it('provides 10 next run times', async () => {
    const result = await tool.run({ expression: '0 9 * * 1' }, { timezone: 'UTC' });
    const data = result.data as Record<string, unknown>;
    const nextRuns = data.nextRuns as string[];
    expect(nextRuns).toHaveLength(10);
  });

  it('all next runs are valid ISO dates', async () => {
    const result = await tool.run({ expression: '0 9 * * 1' }, { timezone: 'UTC' });
    const data = result.data as Record<string, unknown>;
    const nextRuns = data.nextRuns as string[];
    nextRuns.forEach((run) => {
      expect(new Date(run).toISOString()).toBe(run);
    });
  });

  it('next runs are in the future', async () => {
    const result = await tool.run({ expression: '0 9 * * 1' }, { timezone: 'UTC' });
    const data = result.data as Record<string, unknown>;
    const nextRuns = data.nextRuns as string[];
    const now = new Date();
    nextRuns.forEach((run) => {
      expect(new Date(run)).toBeInstanceOf(Date);
      expect(new Date(run).getTime()).toBeGreaterThan(now.getTime());
    });
  });

  it('parses every minute cron', async () => {
    const result = await tool.run({ expression: '* * * * *' }, { timezone: 'UTC' });
    const data = result.data as Record<string, unknown>;
    expect(data.description).toContain('every minute');
  });

  it('includes parsed fields', async () => {
    const result = await tool.run({ expression: '30 14 * * 5' }, { timezone: 'UTC' });
    const data = result.data as Record<string, unknown>;
    const fields = data.fields as Record<string, string>;
    expect(fields.minute).toBe('30');
    expect(fields.hour).toBe('14');
    expect(fields.dayOfWeek).toBe('5');
  });

  it('throws on invalid CRON expression', async () => {
    await expect(tool.run({ expression: 'not-a-cron' }, { timezone: 'UTC' })).rejects.toThrow();
  });

  it('throws on empty input', async () => {
    await expect(tool.run({ expression: '' }, { timezone: 'UTC' })).rejects.toThrow('CRON expression is required');
  });
});
