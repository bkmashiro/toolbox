import { registry } from '../../core/registry';
import type { Tool } from '../../core/types';

function base64UrlDecode(str: string): string {
  // Pad to multiple of 4
  const padded = str + '='.repeat((4 - (str.length % 4)) % 4);
  const standard = padded.replace(/-/g, '+').replace(/_/g, '/');
  try {
    return decodeURIComponent(
      atob(standard)
        .split('')
        .map((c) => '%' + c.charCodeAt(0).toString(16).padStart(2, '0'))
        .join('')
    );
  } catch {
    return atob(standard);
  }
}

const tool: Tool = {
  id: 'jwt-decode',
  name: 'JWT Decode',
  description: 'Decode and inspect JWT tokens — header, payload, expiry status',
  category: 'crypto',
  tags: ['jwt', 'json', 'web', 'token', 'decode', 'auth', 'bearer', 'header', 'payload'],
  inputs: [
    {
      id: 'jwt',
      label: 'JWT Token',
      type: 'textarea',
      placeholder: 'Paste JWT token here...',
      rows: 3,
    },
  ],
  options: [],
  output: { type: 'json' },
  apiSupported: true,
  async run(inputs) {
    const jwt = ((inputs.jwt as string) ?? '').trim();
    if (!jwt) throw new Error('JWT token is required');

    const parts = jwt.split('.');
    if (parts.length !== 3) throw new Error('Invalid JWT format — expected 3 parts separated by dots');

    let header: Record<string, unknown>;
    let payload: Record<string, unknown>;

    try {
      header = JSON.parse(base64UrlDecode(parts[0]));
    } catch {
      throw new Error('Failed to decode JWT header');
    }

    try {
      payload = JSON.parse(base64UrlDecode(parts[1]));
    } catch {
      throw new Error('Failed to decode JWT payload');
    }

    const now = Math.floor(Date.now() / 1000);
    let expiryStatus = 'No expiry (exp claim not present)';
    let isExpired = false;

    if (typeof payload.exp === 'number') {
      isExpired = payload.exp < now;
      const diff = Math.abs(payload.exp - now);
      const days = Math.floor(diff / 86400);
      const hours = Math.floor((diff % 86400) / 3600);
      const mins = Math.floor((diff % 3600) / 60);
      const expiryDate = new Date(payload.exp * 1000).toISOString();
      if (isExpired) {
        expiryStatus = `EXPIRED — expired ${days}d ${hours}h ${mins}m ago (${expiryDate})`;
      } else {
        expiryStatus = `Valid — expires in ${days}d ${hours}h ${mins}m (${expiryDate})`;
      }
    }

    const result = {
      header,
      payload,
      signature: `[${parts[2].length} chars — ${header.alg ?? 'unknown'} signature, verification requires secret/key]`,
      expiry: {
        status: expiryStatus,
        isExpired,
        exp: typeof payload.exp === 'number' ? new Date(payload.exp * 1000).toISOString() : null,
        iat: typeof payload.iat === 'number' ? new Date(payload.iat * 1000).toISOString() : null,
        nbf: typeof payload.nbf === 'number' ? new Date(payload.nbf * 1000).toISOString() : null,
      },
    };

    return { type: 'json', data: result };
  },
};

registry.register(tool);
export default tool;
