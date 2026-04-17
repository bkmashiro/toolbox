import { registry } from '../../core/registry';
import type { Tool } from '../../core/types';
import { hexEncode, hexDecode, bufToBase64, base64ToBuf, strToBytes, bytesToStr } from './crypto-utils';

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

const tool: Tool = {
  id: 'aes-encrypt',
  name: 'AES Encrypt',
  description: 'AES-256-GCM encrypt and decrypt text with password-derived key via PBKDF2',
  category: 'crypto',
  tags: ['aes', 'encrypt', 'decrypt', 'gcm', 'pbkdf2', 'symmetric', 'crypto', 'cipher'],
  inputs: [
    {
      id: 'text',
      label: 'Text',
      type: 'textarea',
      placeholder: 'Enter text to encrypt or ciphertext to decrypt...',
      rows: 5,
    },
    {
      id: 'password',
      label: 'Password',
      type: 'text',
      placeholder: 'Enter password...',
    },
  ],
  options: [
    {
      id: 'mode',
      label: 'Mode',
      type: 'select',
      default: 'encrypt',
      options: [
        { label: 'Encrypt', value: 'encrypt' },
        { label: 'Decrypt', value: 'decrypt' },
      ],
    },
    {
      id: 'outputFormat',
      label: 'Output Format',
      type: 'select',
      default: 'base64',
      options: [
        { label: 'Base64', value: 'base64' },
        { label: 'Hex', value: 'hex' },
      ],
    },
  ],
  output: { type: 'text' },
  apiSupported: true,
  async run(inputs, options) {
    const text = (inputs.text as string) ?? '';
    const password = (inputs.password as string) ?? '';
    const mode = options.mode as string;
    const outputFormat = options.outputFormat as string;

    if (!text) throw new Error('Text is required');
    if (!password) throw new Error('Password is required');

    const subtle = globalThis.crypto.subtle;

    if (mode === 'encrypt') {
      const salt = globalThis.crypto.getRandomValues(new Uint8Array(16));
      const iv = globalThis.crypto.getRandomValues(new Uint8Array(12));
      const key = await deriveKey(password, salt);
      const ciphertext = await subtle.encrypt({ name: 'AES-GCM', iv }, key, strToBytes(text));

      // Format: salt (16 bytes) + iv (12 bytes) + ciphertext
      const combined = new Uint8Array(salt.length + iv.length + ciphertext.byteLength);
      combined.set(salt, 0);
      combined.set(iv, 16);
      combined.set(new Uint8Array(ciphertext), 28);

      const encoded = outputFormat === 'base64' ? bufToBase64(combined) : hexEncode(combined);
      return {
        type: 'text',
        data: encoded,
        summary: `Encrypted (AES-256-GCM, PBKDF2). Format: salt(16B)+iv(12B)+ciphertext, encoded as ${outputFormat}`,
      };
    } else {
      let combined: Uint8Array;
      try {
        combined = outputFormat === 'base64' ? base64ToBuf(text) : hexDecode(text);
      } catch {
        throw new Error('Invalid ciphertext encoding');
      }
      if (combined.length < 29) throw new Error('Ciphertext too short');

      const salt = combined.slice(0, 16);
      const iv = combined.slice(16, 28);
      const ciphertext = combined.slice(28);

      const key = await deriveKey(password, salt);
      let plaintext: ArrayBuffer;
      try {
        plaintext = await subtle.decrypt({ name: 'AES-GCM', iv }, key, ciphertext);
      } catch {
        throw new Error('Decryption failed — wrong password or corrupted data');
      }

      return { type: 'text', data: bytesToStr(plaintext) };
    }
  },
};

registry.register(tool);
export default tool;
