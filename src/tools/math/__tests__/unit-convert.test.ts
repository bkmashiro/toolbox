import { describe, it, expect } from 'vitest';
import { convertUnit } from '../unit-data';

describe('convertUnit', () => {
  it('converts km to mi', () => {
    const result = convertUnit(1, 'km', 'mi', 'length');
    expect(result).not.toBeNull();
    expect(result!).toBeCloseTo(0.621371, 4);
  });

  it('converts mi to km', () => {
    const result = convertUnit(1, 'mi', 'km', 'length');
    expect(result).not.toBeNull();
    expect(result!).toBeCloseTo(1.609344, 4);
  });

  it('converts m to m (identity)', () => {
    const result = convertUnit(42, 'm', 'm', 'length');
    expect(result).not.toBeNull();
    expect(result!).toBe(42);
  });

  it('converts Fahrenheit to Celsius', () => {
    const result = convertUnit(32, 'F', 'C', 'temperature');
    expect(result).not.toBeNull();
    expect(result!).toBeCloseTo(0, 4);
  });

  it('converts 100 Celsius to Fahrenheit', () => {
    const result = convertUnit(100, 'C', 'F', 'temperature');
    expect(result).not.toBeNull();
    expect(result!).toBeCloseTo(212, 4);
  });

  it('converts Celsius to Kelvin', () => {
    const result = convertUnit(0, 'C', 'K', 'temperature');
    expect(result).not.toBeNull();
    expect(result!).toBeCloseTo(273.15, 2);
  });

  it('converts kg to lb', () => {
    const result = convertUnit(1, 'kg', 'lb', 'weight');
    expect(result).not.toBeNull();
    expect(result!).toBeCloseTo(2.20462, 3);
  });

  it('converts GB to MB', () => {
    const result = convertUnit(1, 'GB', 'MB', 'data-size');
    expect(result).not.toBeNull();
    expect(result!).toBeCloseTo(1024, 0);
  });

  it('returns null for unknown category', () => {
    expect(convertUnit(1, 'km', 'mi', 'unknown-cat')).toBeNull();
  });

  it('returns null for unknown units', () => {
    expect(convertUnit(1, 'parsec', 'km', 'length')).toBeNull();
  });

  it('converts km/h to mph', () => {
    const result = convertUnit(100, 'km/h', 'mph', 'speed');
    expect(result).not.toBeNull();
    expect(result!).toBeCloseTo(62.1371, 2);
  });

  it('converts kPa to psi', () => {
    const result = convertUnit(100, 'kPa', 'psi', 'pressure');
    expect(result).not.toBeNull();
    expect(result!).toBeCloseTo(14.504, 2);
  });
});
