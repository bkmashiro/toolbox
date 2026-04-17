import { registry } from '../../core/registry';
import type { Tool } from '../../core/types';

const tool: Tool = {
  id: 'jwt-debug',
  name: 'JWT Visual Debugger',
  description: 'Decode and analyze a JWT token with expiry status, time remaining, and claims breakdown',
  category: 'crypto',
  tags: ['jwt', 'token', 'debug', 'decode', 'claims', 'expiry', 'auth', 'crypto'],
  inputs: [
    {
      id: 'token',
      label: 'JWT Token',
      type: 'textarea',
      placeholder: 'Paste your JWT token here...',
      rows: 4,
    },
  ],
  options: [],
  output: { type: 'text' },
  apiSupported: true,
  async run(inputs) {
    const token = (inputs.token as string).trim();
    const parts = token.split('.');
    if (parts.length !== 3) throw new Error('Invalid JWT: must have 3 parts');

    const decode = (b64: string) =>
      JSON.parse(atob(b64.replace(/-/g, '+').replace(/_/g, '/')));

    const header = decode(parts[0]);
    const payload = decode(parts[1]);
    const now = Math.floor(Date.now() / 1000);

    const lines: string[] = [
      '=== HEADER ===',
      JSON.stringify(header, null, 2),
      '',
      '=== PAYLOAD ===',
      JSON.stringify(payload, null, 2),
      '',
      '=== CLAIMS ANALYSIS ===',
    ];

    if (payload.iat) lines.push(`Issued At:  ${new Date(payload.iat * 1000).toISOString()}`);
    if (payload.exp) {
      const exp = new Date(payload.exp * 1000).toISOString();
      const diff = payload.exp - now;
      if (diff > 0) {
        lines.push(`Expires At: ${exp} (in ${Math.floor(diff / 60)}m ${diff % 60}s)`);
      } else {
        lines.push(`Expires At: ${exp} *** EXPIRED ${Math.floor(-diff / 60)}m ${(-diff) % 60}s ago ***`);
      }
    }
    if (payload.nbf) lines.push(`Not Before: ${new Date(payload.nbf * 1000).toISOString()}`);
    if (payload.iss) lines.push(`Issuer:     ${payload.iss}`);
    if (payload.sub) lines.push(`Subject:    ${payload.sub}`);
    if (payload.aud) lines.push(`Audience:   ${JSON.stringify(payload.aud)}`);

    lines.push('', `Signature:  ${parts[2]}`);

    return { type: 'text', data: lines.join('\n') };
  },
};

registry.register(tool);
export default tool;
