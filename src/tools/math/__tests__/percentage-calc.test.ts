import { describe, it, expect } from 'vitest';
import percentageCalcTool from '../percentage-calc';

describe('percentage-calc tool', () => {
  describe('mode: of (X% of Y)', () => {
    it('computes 25% of 200 = 50', async () => {
      const result = await percentageCalcTool.run({ x: '25', y: '200' }, { mode: 'of' });
      expect(result.data as string).toContain('50');
    });

    it('computes 10% of 1000 = 100', async () => {
      const result = await percentageCalcTool.run({ x: '10', y: '1000' }, { mode: 'of' });
      expect(result.data as string).toContain('100');
    });

    it('computes 0% of anything = 0', async () => {
      const result = await percentageCalcTool.run({ x: '0', y: '500' }, { mode: 'of' });
      expect(result.data as string).toContain('= 0');
    });
  });

  describe('mode: what (X is what % of Y)', () => {
    it('computes 50 is 25% of 200', async () => {
      const result = await percentageCalcTool.run({ x: '50', y: '200' }, { mode: 'what' });
      expect(result.data as string).toContain('25');
    });

    it('throws if Y is 0', async () => {
      await expect(percentageCalcTool.run({ x: '10', y: '0' }, { mode: 'what' })).rejects.toThrow();
    });
  });

  describe('mode: change (% change X→Y)', () => {
    it('computes +100% change from 50 to 100', async () => {
      const result = await percentageCalcTool.run({ x: '50', y: '100' }, { mode: 'change' });
      expect(result.data as string).toContain('100');
      expect(result.data as string).toContain('increase');
    });

    it('computes -50% change from 100 to 50', async () => {
      const result = await percentageCalcTool.run({ x: '100', y: '50' }, { mode: 'change' });
      expect(result.data as string).toContain('50');
      expect(result.data as string).toContain('decrease');
    });

    it('throws if X is 0', async () => {
      await expect(percentageCalcTool.run({ x: '0', y: '100' }, { mode: 'change' })).rejects.toThrow();
    });
  });

  it('throws if X is not a number', async () => {
    await expect(percentageCalcTool.run({ x: 'abc', y: '100' }, { mode: 'of' })).rejects.toThrow();
  });
});
