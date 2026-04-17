import { describe, it, expect } from 'vitest';
import tool from '../password-gen';

describe('password-gen', () => {
  it('generates password with correct length', async () => {
    const result = await tool.run({}, {
      length: 20, uppercase: true, lowercase: true, numbers: true, symbols: false,
      excludeAmbiguous: false, excludeChars: '', count: 1,
    });
    expect(result.type).toBe('text');
    expect((result.data as string).trim()).toHaveLength(20);
  });

  it('generates multiple passwords when count > 1', async () => {
    const result = await tool.run({}, {
      length: 12, uppercase: true, lowercase: true, numbers: true, symbols: false,
      excludeAmbiguous: false, excludeChars: '', count: 5,
    });
    const lines = (result.data as string).trim().split('\n');
    expect(lines).toHaveLength(5);
  });

  it('uses only uppercase when selected', async () => {
    const result = await tool.run({}, {
      length: 50, uppercase: true, lowercase: false, numbers: false, symbols: false,
      excludeAmbiguous: false, excludeChars: '', count: 1,
    });
    const password = (result.data as string).trim();
    expect(password).toMatch(/^[A-Z]+$/);
  });

  it('uses only numbers when selected', async () => {
    const result = await tool.run({}, {
      length: 20, uppercase: false, lowercase: false, numbers: true, symbols: false,
      excludeAmbiguous: false, excludeChars: '', count: 1,
    });
    const password = (result.data as string).trim();
    expect(password).toMatch(/^[0-9]+$/);
  });

  it('excludes ambiguous characters', async () => {
    const result = await tool.run({}, {
      length: 100, uppercase: true, lowercase: true, numbers: true, symbols: false,
      excludeAmbiguous: true, excludeChars: '', count: 1,
    });
    const password = (result.data as string).trim();
    expect(password).not.toMatch(/[0OoIl1]/);
  });

  it('respects exclude characters', async () => {
    const result = await tool.run({}, {
      length: 100, uppercase: true, lowercase: false, numbers: false, symbols: false,
      excludeAmbiguous: false, excludeChars: 'AEIOU', count: 1,
    });
    const password = (result.data as string).trim();
    expect(password).not.toMatch(/[AEIOU]/);
  });

  it('shows entropy in summary', async () => {
    const result = await tool.run({}, {
      length: 16, uppercase: true, lowercase: true, numbers: true, symbols: true,
      excludeAmbiguous: false, excludeChars: '', count: 1,
    });
    expect(result.summary).toContain('Entropy');
    expect(result.summary).toContain('bits');
  });

  it('throws when no charset selected', async () => {
    await expect(tool.run({}, {
      length: 12, uppercase: false, lowercase: false, numbers: false, symbols: false,
      excludeAmbiguous: false, excludeChars: '', count: 1,
    })).rejects.toThrow();
  });
});
