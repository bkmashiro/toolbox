import { describe, it, expect } from 'vitest';
import dateCalcTool from '../date-calc';

describe('date-calc tool', () => {
  it('calculates difference between two dates in days', async () => {
    const result = await dateCalcTool.run(
      { dateA: '2024-01-01', dateB: '2024-12-31' },
      { mode: 'difference' }
    );
    const text = result.data as string;
    expect(text).toContain('365');
  });

  it('adds days to a date', async () => {
    const result = await dateCalcTool.run(
      { dateA: '2024-01-01', dateB: '' },
      { mode: 'add', amount: 30, unit: 'days' }
    );
    const text = result.data as string;
    expect(text).toContain('2024-01-31');
  });

  it('subtracts months from a date', async () => {
    const result = await dateCalcTool.run(
      { dateA: '2024-03-15', dateB: '' },
      { mode: 'subtract', amount: 1, unit: 'months' }
    );
    const text = result.data as string;
    // 2024-03-15 minus 1 month should be in February
    expect(text).toMatch(/2024-02/);
  });

  it('adds years to a date', async () => {
    const result = await dateCalcTool.run(
      { dateA: '2020-02-29', dateB: '' },
      { mode: 'add', amount: 4, unit: 'years' }
    );
    const text = result.data as string;
    expect(text).toContain('2024-02-29');
  });

  it('throws when dateA is empty', async () => {
    await expect(dateCalcTool.run({ dateA: '', dateB: '' }, { mode: 'difference' })).rejects.toThrow();
  });

  it('throws when dateB is missing for difference mode', async () => {
    await expect(dateCalcTool.run({ dateA: '2024-01-01', dateB: '' }, { mode: 'difference' })).rejects.toThrow();
  });

  it('difference shows negative for reversed dates', async () => {
    const result = await dateCalcTool.run(
      { dateA: '2024-12-31', dateB: '2024-01-01' },
      { mode: 'difference' }
    );
    const text = result.data as string;
    expect(text).toContain('before');
  });
});
