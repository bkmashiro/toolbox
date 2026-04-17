import { describe, it, expect } from 'vitest';
import { strToBytes, bytesToStr, bufToBase64, base64ToBuf } from '../crypto-utils';

// Minimal AES-256-GCM roundtrip test (same logic as aes-encrypt.ts)
async function deriveKey(password: string, salt: Uint8Array): Promise<CryptoKey> {
  const subtle = globalThis.crypto.subtle;
  const keyMaterial = await subtle.importKey('raw', strToBytes(password), 'PBKDF2', false, ['deriveKey']);
  return subtle.deriveKey(
    { name: 'PBKDF2', salt, iterations: 100000, hash: 'SHA-256' },
    keyMaterial,
    { name: 'AES-GCM', length: 256 },
    false,
    ['encrypt', 'decrypt']
  );
}

async function encrypt(text: string, password: string): Promise<string> {
  const subtle = globalThis.crypto.subtle;
  const salt = globalThis.crypto.getRandomValues(new Uint8Array(16));
  const iv = globalThis.crypto.getRandomValues(new Uint8Array(12));
  const key = await deriveKey(password, salt);
  const ciphertext = await subtle.encrypt({ name: 'AES-GCM', iv }, key, strToBytes(text));
  const combined = new Uint8Array(16 + 12 + ciphertext.byteLength);
  combined.set(salt, 0);
  combined.set(iv, 16);
  combined.set(new Uint8Array(ciphertext), 28);
  return bufToBase64(combined);
}

async function decrypt(encoded: string, password: string): Promise<string> {
  const subtle = globalThis.crypto.subtle;
  const combined = base64ToBuf(encoded);
  const salt = combined.slice(0, 16);
  const iv = combined.slice(16, 28);
  const ciphertext = combined.slice(28);
  const key = await deriveKey(password, salt);
  const plaintext = await subtle.decrypt({ name: 'AES-GCM', iv }, key, ciphertext);
  return bytesToStr(plaintext);
}

describe('aes-encrypt', () => {
  it('encrypts and decrypts text roundtrip', async () => {
    const original = 'Hello, AES-256-GCM!';
    const password = 'super-secret-password';
    const ciphertext = await encrypt(original, password);
    const decrypted = await decrypt(ciphertext, password);
    expect(decrypted).toBe(original);
  });

  it('produces different ciphertext for same input (random salt/IV)', async () => {
    const text = 'same text';
    const password = 'password123';
    const c1 = await encrypt(text, password);
    const c2 = await encrypt(text, password);
    expect(c1).not.toBe(c2);
  });

  it('decryption fails with wrong password', async () => {
    const ciphertext = await encrypt('secret', 'correct-password');
    await expect(decrypt(ciphertext, 'wrong-password')).rejects.toThrow();
  });

  it('handles unicode text', async () => {
    const text = '日本語テスト 🔐 émojis';
    const ciphertext = await encrypt(text, 'password');
    const decrypted = await decrypt(ciphertext, 'password');
    expect(decrypted).toBe(text);
  });
});
