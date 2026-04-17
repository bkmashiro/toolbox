import { registry } from '../../core/registry';
import type { Tool } from '../../core/types';
import { bufToBase64, strToBytes, base64ToBuf } from './crypto-utils';

function base64UrlEncode(buf: ArrayBuffer | Uint8Array): string {
  return bufToBase64(buf).replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '');
}

function base64UrlEncodeStr(str: string): string {
  const bytes = strToBytes(str);
  return base64UrlEncode(bytes);
}

function pemToBytes(pem: string): Uint8Array {
  const b64 = pem.replace(/-----[^-]+-----/g, '').replace(/\s+/g, '');
  return base64ToBuf(b64);
}

const tool: Tool = {
  id: 'jwt-sign',
  name: 'JWT Sign',
  description: 'Create and sign JWT tokens with HS256/HS384/HS512 or RS256',
  category: 'crypto',
  tags: ['jwt', 'sign', 'token', 'hs256', 'rs256', 'hmac', 'rsa', 'auth', 'bearer'],
  inputs: [
    {
      id: 'payload',
      label: 'Payload (JSON)',
      type: 'textarea',
      placeholder: '{\n  "sub": "1234567890",\n  "name": "John Doe"\n}',
      rows: 6,
    },
    {
      id: 'secret',
      label: 'Secret / Private Key',
      type: 'textarea',
      placeholder: 'HMAC secret or RSA private key PEM...',
      rows: 4,
    },
  ],
  options: [
    {
      id: 'algorithm',
      label: 'Algorithm',
      type: 'select',
      default: 'HS256',
      options: [
        { label: 'HS256', value: 'HS256' },
        { label: 'HS384', value: 'HS384' },
        { label: 'HS512', value: 'HS512' },
        { label: 'RS256', value: 'RS256' },
      ],
    },
    {
      id: 'expiration',
      label: 'Expiration',
      type: 'select',
      default: '3600',
      options: [
        { label: '1 hour', value: '3600' },
        { label: '24 hours', value: '86400' },
        { label: '7 days', value: '604800' },
        { label: '30 days', value: '2592000' },
        { label: 'No expiration', value: '0' },
      ],
    },
    {
      id: 'issuer',
      label: 'Issuer (iss)',
      type: 'text',
      default: '',
      placeholder: 'Optional issuer...',
      required: false,
    },
    {
      id: 'audience',
      label: 'Audience (aud)',
      type: 'text',
      default: '',
      placeholder: 'Optional audience...',
      required: false,
    },
  ],
  output: { type: 'text' },
  apiSupported: false,
  async run(inputs, options) {
    const payloadStr = (inputs.payload as string) ?? '{}';
    const secret = (inputs.secret as string) ?? '';
    const algorithm = options.algorithm as string;
    const expiration = parseInt(options.expiration as string, 10);
    const issuer = (options.issuer as string) || undefined;
    const audience = (options.audience as string) || undefined;

    if (!secret) throw new Error('Secret/key is required');

    let payload: Record<string, unknown>;
    try {
      payload = JSON.parse(payloadStr);
    } catch {
      throw new Error('Invalid JSON payload');
    }

    const now = Math.floor(Date.now() / 1000);
    payload.iat = now;
    if (expiration > 0) payload.exp = now + expiration;
    if (issuer) payload.iss = issuer;
    if (audience) payload.aud = audience;

    const header = { alg: algorithm, typ: 'JWT' };
    const headerB64 = base64UrlEncodeStr(JSON.stringify(header));
    const payloadB64 = base64UrlEncodeStr(JSON.stringify(payload));
    const signingInput = `${headerB64}.${payloadB64}`;

    const subtle = globalThis.crypto.subtle;
    let signatureBytes: ArrayBuffer;

    if (algorithm.startsWith('HS')) {
      const hashMap: Record<string, string> = { HS256: 'SHA-256', HS384: 'SHA-384', HS512: 'SHA-512' };
      const key = await subtle.importKey(
        'raw',
        strToBytes(secret),
        { name: 'HMAC', hash: hashMap[algorithm] },
        false,
        ['sign']
      );
      signatureBytes = await subtle.sign('HMAC', key, strToBytes(signingInput));
    } else {
      // RS256
      const privateKey = await subtle.importKey(
        'pkcs8',
        pemToBytes(secret),
        { name: 'RSASSA-PKCS1-v1_5', hash: 'SHA-256' },
        false,
        ['sign']
      );
      signatureBytes = await subtle.sign('RSASSA-PKCS1-v1_5', privateKey, strToBytes(signingInput));
    }

    const signatureB64 = base64UrlEncode(signatureBytes);
    const jwt = `${signingInput}.${signatureB64}`;

    return { type: 'text', data: jwt, summary: `Signed JWT (${algorithm})` };
  },
};

registry.register(tool);
export default tool;
