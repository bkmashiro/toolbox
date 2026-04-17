import { describe, it, expect, vi } from 'vitest';
import { hashRoutes } from '../api/routes/hash';

// Mock Web Crypto for Node.js test environment
const mockDigest = vi.fn(async (algo: string, _data: Uint8Array) => {
  if (algo === 'SHA-256') {
    // SHA-256 of empty string: e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855
    return new Uint8Array([
      0xe3, 0xb0, 0xc4, 0x42, 0x98, 0xfc, 0x1c, 0x14,
      0x9a, 0xfb, 0xf4, 0xc8, 0x99, 0x6f, 0xb9, 0x24,
      0x27, 0xae, 0x41, 0xe4, 0x64, 0x9b, 0x93, 0x4c,
      0xa4, 0x95, 0x99, 0x1b, 0x78, 0x52, 0xb8, 0x55,
    ]).buffer;
  }
  return new ArrayBuffer(32);
});

Object.defineProperty(globalThis, 'crypto', {
  value: { subtle: { digest: mockDigest } },
  writable: true,
  configurable: true,
});

async function fetchRoute(path: string): Promise<{ ok: boolean; result?: string; error?: string }> {
  const req = new Request(`http://localhost${path}`);
  const res = await hashRoutes.fetch(req);
  return res.json();
}

describe('hash route', () => {
  it('SHA-256 of empty string returns known hash', async () => {
    const body = await fetchRoute('/hash?algo=sha-256&input=');
    expect(body.ok).toBe(true);
    expect(body.result).toBe('e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855');
  });

  it('returns uppercase hash when uppercase=1', async () => {
    const body = await fetchRoute('/hash?algo=sha-256&input=&uppercase=1');
    expect(body.ok).toBe(true);
    expect(body.result).toBe('E3B0C44298FC1C149AFBF4C8996FB92427AE41E4649B934CA495991B7852B855');
  });

  it('returns error for unsupported algorithm', async () => {
    const body = await fetchRoute('/hash?algo=md5&input=test');
    expect(body.ok).toBe(false);
    expect(body.error).toContain('Unsupported');
  });

  it('defaults to sha-256 if no algo provided', async () => {
    const body = await fetchRoute('/hash?input=');
    expect(body.ok).toBe(true);
    expect(body.result).toBe('e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855');
  });
});
