import { describe, it, expect } from 'vitest';
import tool from '../number-base';

describe('number-base', () => {
  it('converts 255 decimal to all bases', async () => {
    const result = await tool.run({ number: '255' }, { fromBase: '10' });
    const data = result.data as string;
    expect(data).toContain('FF');
    expect(data).toContain('11111111');
    expect(data).toContain('377');  // octal
    expect(data).toContain('255'); // decimal
  });

  it('converts hex FF to decimal 255', async () => {
    const result = await tool.run({ number: 'FF' }, { fromBase: '16' });
    const data = result.data as string;
    expect(data).toContain('255');
  });

  it('converts binary 11111111 to 255', async () => {
    const result = await tool.run({ number: '11111111' }, { fromBase: '2' });
    const data = result.data as string;
    expect(data).toContain('255');
    expect(data).toContain('FF');
  });

  it('auto-detects 0xFF', async () => {
    const result = await tool.run({ number: '0xFF' }, { fromBase: 'auto' });
    const data = result.data as string;
    expect(data).toContain('255');
  });

  it('auto-detects 0b11111111', async () => {
    const result = await tool.run({ number: '0b11111111' }, { fromBase: 'auto' });
    const data = result.data as string;
    expect(data).toContain('255');
  });

  it('converts 0 correctly', async () => {
    const result = await tool.run({ number: '0' }, { fromBase: '10' });
    const data = result.data as string;
    expect(data).toContain('0');
  });

  it('converts large number', async () => {
    const result = await tool.run({ number: '65536' }, { fromBase: '10' });
    const data = result.data as string;
    expect(data).toContain('10000'); // hex
    expect(data).toContain('65536'); // decimal
  });

  it('throws on invalid hex character', async () => {
    await expect(tool.run({ number: 'GGGG' }, { fromBase: '16' })).rejects.toThrow();
  });

  it('throws on empty input', async () => {
    await expect(tool.run({ number: '' }, { fromBase: '10' })).rejects.toThrow('Number is required');
  });
});
