import { describe, it, expect } from 'vitest';

// Inline sha256 test using Web Crypto (available in vitest's jsdom+node environment)
async function sha256hex(text: string): Promise<string> {
  const data = new TextEncoder().encode(text);
  const hash = await globalThis.crypto.subtle.digest('SHA-256', data);
  return Array.from(new Uint8Array(hash)).map((b) => b.toString(16).padStart(2, '0')).join('');
}

describe('hash-gen', () => {
  it('SHA-256 of "hello" matches known value', async () => {
    const result = await sha256hex('hello');
    expect(result).toBe('2cf24dba5fb0a30e26e83b2ac5b9e29e1b161e5c1fa7425e73043362938b9824');
  });

  it('SHA-256 of empty string matches known value', async () => {
    const result = await sha256hex('');
    expect(result).toBe('e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855');
  });

  it('SHA-256 of "abc" matches known value', async () => {
    const result = await sha256hex('abc');
    expect(result).toBe('ba7816bf8f01cfea414140de5dae2223b00361a396177a9cb410ff61f20015ad');
  });

  it('produces 64-character hex output', async () => {
    const result = await sha256hex('test input');
    expect(result).toHaveLength(64);
    expect(result).toMatch(/^[0-9a-f]+$/);
  });
});
