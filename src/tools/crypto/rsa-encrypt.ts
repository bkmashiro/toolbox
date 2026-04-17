import { registry } from '../../core/registry';
import type { Tool } from '../../core/types';
import { hexEncode, hexDecode, bufToBase64, base64ToBuf, strToBytes, bytesToStr } from './crypto-utils';

function pemToBytes(pem: string): Uint8Array<ArrayBuffer> {
  const b64 = pem
    .replace(/-----[^-]+-----/g, '')
    .replace(/\s+/g, '');
  return base64ToBuf(b64);
}

async function importPublicKey(pem: string, hash: string): Promise<CryptoKey> {
  const bytes = pemToBytes(pem);
  return globalThis.crypto.subtle.importKey(
    'spki',
    bytes,
    { name: 'RSA-OAEP', hash },
    false,
    ['encrypt']
  );
}

async function importPrivateKey(pem: string, hash: string): Promise<CryptoKey> {
  const bytes = pemToBytes(pem);
  return globalThis.crypto.subtle.importKey(
    'pkcs8',
    bytes,
    { name: 'RSA-OAEP', hash },
    false,
    ['decrypt']
  );
}

const tool: Tool = {
  id: 'rsa-encrypt',
  name: 'RSA Encrypt',
  description: 'RSA-OAEP encrypt and decrypt with PEM public/private key',
  category: 'crypto',
  tags: ['rsa', 'encrypt', 'decrypt', 'oaep', 'public', 'private', 'pem', 'asymmetric', 'crypto'],
  inputs: [
    {
      id: 'text',
      label: 'Text',
      type: 'textarea',
      placeholder: 'Enter plaintext to encrypt or ciphertext to decrypt...',
      rows: 4,
    },
    {
      id: 'key',
      label: 'PEM Key (public for encrypt, private for decrypt)',
      type: 'textarea',
      placeholder: '-----BEGIN PUBLIC KEY-----\n...\n-----END PUBLIC KEY-----',
      rows: 8,
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
      id: 'hash',
      label: 'Hash Algorithm',
      type: 'select',
      default: 'SHA-256',
      options: [
        { label: 'SHA-256', value: 'SHA-256' },
        { label: 'SHA-384', value: 'SHA-384' },
        { label: 'SHA-512', value: 'SHA-512' },
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
  apiSupported: false,
  async run(inputs, options) {
    const text = (inputs.text as string) ?? '';
    const keyPem = (inputs.key as string) ?? '';
    const mode = options.mode as string;
    const hash = options.hash as string;
    const outputFormat = options.outputFormat as string;

    if (!text) throw new Error('Text is required');
    if (!keyPem) throw new Error('PEM key is required');

    const subtle = globalThis.crypto.subtle;

    if (mode === 'encrypt') {
      const publicKey = await importPublicKey(keyPem, hash);
      const ciphertext = await subtle.encrypt({ name: 'RSA-OAEP' }, publicKey, strToBytes(text));
      const encoded = outputFormat === 'base64' ? bufToBase64(ciphertext) : hexEncode(ciphertext);
      return { type: 'text', data: encoded };
    } else {
      let cipherbytes: Uint8Array<ArrayBuffer>;
      try {
        cipherbytes = outputFormat === 'base64' ? base64ToBuf(text) : hexDecode(text);
      } catch {
        throw new Error('Invalid ciphertext encoding');
      }
      const privateKey = await importPrivateKey(keyPem, hash);
      let plaintext: ArrayBuffer;
      try {
        plaintext = await subtle.decrypt({ name: 'RSA-OAEP' }, privateKey, cipherbytes);
      } catch {
        throw new Error('Decryption failed — wrong key or corrupted data');
      }
      return { type: 'text', data: bytesToStr(plaintext) };
    }
  },
};

registry.register(tool);
export default tool;
