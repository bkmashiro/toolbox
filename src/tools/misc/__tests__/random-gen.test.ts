import { describe, it, expect } from 'vitest';
import randomGenTool from '../random-gen';

describe('random-gen tool', () => {
  describe('number mode', () => {
    it('generates a number within the range', async () => {
      const result = await randomGenTool.run({}, { mode: 'number', min: 1, max: 10, count: 1, unique: false });
      const lines = (result.data as string).trim().split('\n');
      expect(lines.length).toBe(1);
      const n = parseInt(lines[0]);
      expect(n).toBeGreaterThanOrEqual(1);
      expect(n).toBeLessThanOrEqual(10);
    });

    it('generates multiple numbers', async () => {
      const result = await randomGenTool.run({}, { mode: 'number', min: 1, max: 100, count: 5, unique: false });
      const lines = (result.data as string).trim().split('\n');
      expect(lines.length).toBe(5);
    });

    it('generates unique numbers', async () => {
      const result = await randomGenTool.run({}, { mode: 'number', min: 1, max: 10, count: 10, unique: true });
      const lines = (result.data as string).trim().split('\n');
      const nums = lines.map(Number);
      const unique = new Set(nums);
      expect(unique.size).toBe(10);
    });

    it('throws when unique count exceeds range', async () => {
      await expect(randomGenTool.run({}, { mode: 'number', min: 1, max: 5, count: 10, unique: true })).rejects.toThrow();
    });

    it('throws when min > max', async () => {
      await expect(randomGenTool.run({}, { mode: 'number', min: 10, max: 1, count: 1, unique: false })).rejects.toThrow();
    });
  });

  describe('string mode', () => {
    it('generates a string of the correct length', async () => {
      const result = await randomGenTool.run({}, { mode: 'string', stringLength: 12, charset: 'alphanumeric', count: 1 });
      const s = (result.data as string).trim();
      expect(s.length).toBe(12);
    });

    it('generates hex strings', async () => {
      const result = await randomGenTool.run({}, { mode: 'string', stringLength: 8, charset: 'hex', count: 1 });
      const s = (result.data as string).trim();
      expect(/^[0-9a-f]+$/.test(s)).toBe(true);
    });
  });

  describe('dice mode', () => {
    it('rolls dice within valid range', async () => {
      const result = await randomGenTool.run({}, { mode: 'dice', diceCount: 2, diceSides: 6, count: 1 });
      const line = (result.data as string).trim();
      expect(line).toContain('2d6');
      const totalMatch = line.match(/= (\d+)$/);
      expect(totalMatch).not.toBeNull();
      const total = parseInt(totalMatch![1]);
      expect(total).toBeGreaterThanOrEqual(2);
      expect(total).toBeLessThanOrEqual(12);
    });
  });

  describe('list mode', () => {
    it('picks from a list', async () => {
      const items = 'apple\nbanana\ncherry';
      const result = await randomGenTool.run({ listItems: items }, { mode: 'list', count: 3 });
      const lines = (result.data as string).trim().split('\n');
      expect(lines.length).toBe(3);
      for (const line of lines) {
        expect(['apple', 'banana', 'cherry']).toContain(line);
      }
    });

    it('throws when list is empty', async () => {
      await expect(randomGenTool.run({ listItems: '' }, { mode: 'list', count: 1 })).rejects.toThrow();
    });
  });
});
