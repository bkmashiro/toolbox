import { describe, it, expect } from 'vitest';
import { parsePageRange } from '../pdf-utils';

describe('parsePageRange', () => {
  it('returns all pages when blank string given', () => {
    expect(parsePageRange('', 5)).toEqual([0, 1, 2, 3, 4]);
  });

  it('returns all pages when "all" given', () => {
    expect(parsePageRange('all', 3)).toEqual([0, 1, 2]);
  });

  it('returns all pages when "ALL" given (case-insensitive)', () => {
    expect(parsePageRange('ALL', 4)).toEqual([0, 1, 2, 3]);
  });

  it('parses single page number', () => {
    expect(parsePageRange('3', 5)).toEqual([2]);
  });

  it('parses a range', () => {
    expect(parsePageRange('2-4', 5)).toEqual([1, 2, 3]);
  });

  it('parses mixed single and range', () => {
    expect(parsePageRange('1, 3-5', 6)).toEqual([0, 2, 3, 4]);
  });

  it('deduplicates overlapping ranges', () => {
    expect(parsePageRange('1-3, 2-4', 5)).toEqual([0, 1, 2, 3]);
  });

  it('clamps to document bounds', () => {
    expect(parsePageRange('1-100', 3)).toEqual([0, 1, 2]);
  });

  it('ignores pages out of range', () => {
    expect(parsePageRange('0, 5', 3)).toEqual([]);
  });

  it('handles single page at boundary', () => {
    expect(parsePageRange('5', 5)).toEqual([4]);
    expect(parsePageRange('6', 5)).toEqual([]);
  });

  it('sorts the result', () => {
    expect(parsePageRange('5, 1, 3', 6)).toEqual([0, 2, 4]);
  });

  it('handles whitespace in ranges', () => {
    expect(parsePageRange('  1 - 3  ,  5  ', 6)).toEqual([0, 1, 2, 4]);
  });

  it('returns empty array for invalid input', () => {
    expect(parsePageRange('abc', 5)).toEqual([]);
  });

  it('handles single-page document', () => {
    expect(parsePageRange('1', 1)).toEqual([0]);
    expect(parsePageRange('1-1', 1)).toEqual([0]);
  });
});
