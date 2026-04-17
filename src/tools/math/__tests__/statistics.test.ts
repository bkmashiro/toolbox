import { describe, it, expect } from 'vitest';
import statisticsTool from '../statistics';

describe('statistics tool', () => {
  it('computes basic stats on [1, 2, 3, 4, 5]', async () => {
    const result = await statisticsTool.run({ numbers: '1, 2, 3, 4, 5' }, {});
    expect(result.type).toBe('json');
    const data = result.data as any;
    expect(data.count).toBe(5);
    expect(data.sum).toBe(15);
    expect(data.min).toBe(1);
    expect(data.max).toBe(5);
    expect(data.mean).toBeCloseTo(3, 5);
    expect(data.median).toBeCloseTo(3, 5);
  });

  it('computes correct std dev for [2, 4, 4, 4, 5, 5, 7, 9]', async () => {
    const result = await statisticsTool.run({ numbers: '2,4,4,4,5,5,7,9' }, {});
    const data = result.data as any;
    expect(data.count).toBe(8);
    expect(data.mean).toBeCloseTo(5, 5);
    expect(data.stdDev).toBeCloseTo(2, 4);
  });

  it('handles newline-separated numbers', async () => {
    const result = await statisticsTool.run({ numbers: '10\n20\n30' }, {});
    const data = result.data as any;
    expect(data.count).toBe(3);
    expect(data.mean).toBeCloseTo(20, 5);
  });

  it('computes Q1 and Q3 for [1, 2, 3, 4, 5, 6, 7]', async () => {
    const result = await statisticsTool.run({ numbers: '1,2,3,4,5,6,7' }, {});
    const data = result.data as any;
    // Uses linear interpolation: Q1 at pos 0.25*(n-1)=1.5 → 2.5, Q3 at pos 0.75*(n-1)=4.5 → 5.5
    expect(data.Q1).toBeCloseTo(2.5, 5);
    expect(data.Q3).toBeCloseTo(5.5, 5);
  });

  it('throws on empty input', async () => {
    await expect(statisticsTool.run({ numbers: '  ' }, {})).rejects.toThrow();
  });

  it('throws on invalid input', async () => {
    await expect(statisticsTool.run({ numbers: 'foo,bar' }, {})).rejects.toThrow();
  });

  it('handles single value', async () => {
    const result = await statisticsTool.run({ numbers: '42' }, {});
    const data = result.data as any;
    expect(data.count).toBe(1);
    expect(data.mean).toBe(42);
    expect(data.min).toBe(42);
    expect(data.max).toBe(42);
  });
});
