import { describe, it, expect } from 'vitest';
import tool from '../color-convert';

describe('color-convert', () => {
  it('converts #ff0000 to correct RGB', async () => {
    const result = await tool.run({ color: '#ff0000' }, {});
    const data = result.data as Record<string, unknown>;
    expect(data.rgb).toBe('rgb(255, 0, 0)');
    const rgbValues = data.rgbValues as { r: number; g: number; b: number };
    expect(rgbValues.r).toBe(255);
    expect(rgbValues.g).toBe(0);
    expect(rgbValues.b).toBe(0);
  });

  it('converts #ffffff to correct HSL', async () => {
    const result = await tool.run({ color: '#ffffff' }, {});
    const data = result.data as Record<string, unknown>;
    const hsl = data.hslValues as { h: number; s: number; l: number };
    expect(hsl.l).toBe(100);
    expect(hsl.s).toBe(0);
  });

  it('converts #000000 to CMYK(0,0,0,100)', async () => {
    const result = await tool.run({ color: '#000000' }, {});
    const data = result.data as Record<string, unknown>;
    const cmyk = data.cmykValues as { c: number; m: number; y: number; k: number };
    expect(cmyk.k).toBe(100);
    expect(cmyk.c).toBe(0);
  });

  it('parses rgb() input', async () => {
    const result = await tool.run({ color: 'rgb(128, 64, 32)' }, {});
    const data = result.data as Record<string, unknown>;
    const rgbValues = data.rgbValues as { r: number; g: number; b: number };
    expect(rgbValues.r).toBe(128);
    expect(rgbValues.g).toBe(64);
    expect(rgbValues.b).toBe(32);
  });

  it('parses hsl() input', async () => {
    const result = await tool.run({ color: 'hsl(0, 100%, 50%)' }, {});
    const data = result.data as Record<string, unknown>;
    // hsl(0, 100%, 50%) = red = rgb(255, 0, 0)
    const rgbValues = data.rgbValues as { r: number; g: number; b: number };
    expect(rgbValues.r).toBe(255);
    expect(rgbValues.g).toBe(0);
    expect(rgbValues.b).toBe(0);
  });

  it('outputs hex uppercase', async () => {
    const result = await tool.run({ color: '#aabbcc' }, {});
    const data = result.data as Record<string, unknown>;
    expect(data.hex).toBe('#AABBCC');
  });

  it('handles shorthand hex', async () => {
    const result = await tool.run({ color: '#f00' }, {});
    const data = result.data as Record<string, unknown>;
    const rgbValues = data.rgbValues as { r: number; g: number; b: number };
    expect(rgbValues.r).toBe(255);
    expect(rgbValues.g).toBe(0);
    expect(rgbValues.b).toBe(0);
  });

  it('throws on invalid color', async () => {
    await expect(tool.run({ color: 'not-a-color' }, {})).rejects.toThrow();
  });
});
