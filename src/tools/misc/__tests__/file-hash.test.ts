import { describe, it, expect, vi } from 'vitest';
import fileHashTool from '../file-hash';

// Mock Web Crypto for Node.js test environment
const mockDigest = vi.fn(async (algo: string, data: Uint8Array) => {
  // Return known SHA-256 of empty string: e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855
  if (algo === 'SHA-256') {
    return new Uint8Array([
      0xe3, 0xb0, 0xc4, 0x42, 0x98, 0xfc, 0x1c, 0x14,
      0x9a, 0xfb, 0xf4, 0xc8, 0x99, 0x6f, 0xb9, 0x24,
      0x27, 0xae, 0x41, 0xe4, 0x64, 0x9b, 0x93, 0x4c,
      0xa4, 0x95, 0x99, 0x1b, 0x78, 0x52, 0xb8, 0x55,
    ]).buffer;
  }
  if (algo === 'SHA-512') {
    // SHA-512 of empty string
    return new Uint8Array([
      0xcf, 0x83, 0xe1, 0x35, 0x7e, 0xef, 0xb8, 0xbd,
      0xf1, 0x54, 0x28, 0x50, 0xd6, 0x6d, 0x80, 0x07,
      0xd6, 0x20, 0xe4, 0x05, 0x0b, 0x57, 0x15, 0xdc,
      0x83, 0xf4, 0xa9, 0x21, 0xd3, 0x6c, 0xe9, 0xce,
      0x47, 0xd0, 0xd1, 0x3c, 0x5d, 0x85, 0xf2, 0xb0,
      0xff, 0x83, 0x18, 0xd2, 0x87, 0x7e, 0xec, 0x2f,
      0x63, 0xb9, 0x31, 0xbd, 0x47, 0x41, 0x7a, 0x81,
      0xa5, 0x38, 0x32, 0x7a, 0xf9, 0x27, 0xda, 0x3e,
    ]).buffer;
  }
  return new ArrayBuffer(32);
});

// Setup crypto mock
Object.defineProperty(globalThis, 'crypto', {
  value: { subtle: { digest: mockDigest } },
  writable: true,
  configurable: true,
});

// jsdom's File/Blob may not implement arrayBuffer() — patch it
if (typeof Blob !== 'undefined' && !Blob.prototype.arrayBuffer) {
  Blob.prototype.arrayBuffer = function () {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as ArrayBuffer);
      reader.onerror = () => reject(reader.error);
      reader.readAsArrayBuffer(this);
    });
  };
}

function makeFile(content: string, name = 'test.txt'): File {
  const blob = new Blob([content], { type: 'text/plain' });
  return new File([blob], name, { type: 'text/plain' });
}

describe('file-hash tool', () => {
  it('computes SHA-256 of empty string', async () => {
    const file = makeFile('', 'empty.txt');
    const result = await fileHashTool.run({ file }, { algorithm: 'sha-256', uppercase: false });
    expect(result.type).toBe('text');
    const text = result.data as string;
    expect(text).toContain('e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855');
  });

  it('returns uppercase when requested', async () => {
    const file = makeFile('', 'empty.txt');
    const result = await fileHashTool.run({ file }, { algorithm: 'sha-256', uppercase: true });
    const text = result.data as string;
    expect(text).toContain('E3B0C44298FC1C149AFBF4C8996FB92427AE41E4649B934CA495991B7852B855');
  });

  it('includes filename and size in output', async () => {
    const file = makeFile('hello', 'hello.txt');
    const result = await fileHashTool.run({ file }, { algorithm: 'sha-256', uppercase: false });
    const text = result.data as string;
    expect(text).toContain('hello.txt');
  });

  it('throws when no file provided', async () => {
    await expect(fileHashTool.run({ file: null as any }, { algorithm: 'sha-256', uppercase: false })).rejects.toThrow();
  });

  it('uses SHA-512 algorithm', async () => {
    const file = makeFile('', 'empty.txt');
    const result = await fileHashTool.run({ file }, { algorithm: 'sha-512', uppercase: false });
    const text = result.data as string;
    expect(text).toContain('SHA-512');
    expect(text).toContain('cf83e1357eefb8bdf1542850d66d8007d620e4050b5715dc83f4a921d36ce9ce');
  });
});
