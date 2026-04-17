import { describe, it, expect } from 'vitest';
import { toRoman, fromRoman } from '../roman-numeral';

describe('Roman numeral conversion', () => {
  describe('toRoman', () => {
    it('converts 1 to I', () => { expect(toRoman(1)).toBe('I'); });
    it('converts 4 to IV', () => { expect(toRoman(4)).toBe('IV'); });
    it('converts 9 to IX', () => { expect(toRoman(9)).toBe('IX'); });
    it('converts 14 to XIV', () => { expect(toRoman(14)).toBe('XIV'); });
    it('converts 40 to XL', () => { expect(toRoman(40)).toBe('XL'); });
    it('converts 42 to XLII', () => { expect(toRoman(42)).toBe('XLII'); });
    it('converts 90 to XC', () => { expect(toRoman(90)).toBe('XC'); });
    it('converts 400 to CD', () => { expect(toRoman(400)).toBe('CD'); });
    it('converts 500 to D', () => { expect(toRoman(500)).toBe('D'); });
    it('converts 900 to CM', () => { expect(toRoman(900)).toBe('CM'); });
    it('converts 1999 to MCMXCIX', () => { expect(toRoman(1999)).toBe('MCMXCIX'); });
    it('converts 3999 to MMMCMXCIX', () => { expect(toRoman(3999)).toBe('MMMCMXCIX'); });
    it('converts 2024 correctly', () => { expect(toRoman(2024)).toBe('MMXXIV'); });
    it('throws for 0', () => { expect(() => toRoman(0)).toThrow(); });
    it('throws for 4000', () => { expect(() => toRoman(4000)).toThrow(); });
    it('throws for negative', () => { expect(() => toRoman(-1)).toThrow(); });
  });

  describe('fromRoman', () => {
    it('converts I to 1', () => { expect(fromRoman('I')).toBe(1); });
    it('converts IV to 4', () => { expect(fromRoman('IV')).toBe(4); });
    it('converts IX to 9', () => { expect(fromRoman('IX')).toBe(9); });
    it('converts XLII to 42', () => { expect(fromRoman('XLII')).toBe(42); });
    it('converts MCMXCIX to 1999', () => { expect(fromRoman('MCMXCIX')).toBe(1999); });
    it('converts MMMCMXCIX to 3999', () => { expect(fromRoman('MMMCMXCIX')).toBe(3999); });
    it('handles lowercase', () => { expect(fromRoman('xlii')).toBe(42); });
    it('throws for invalid chars', () => { expect(() => fromRoman('HELLO')).toThrow(); });
    it('throws for non-canonical form', () => { expect(() => fromRoman('IIII')).toThrow(); });
  });
});
