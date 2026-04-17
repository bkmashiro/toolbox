import { registry } from '../../core/registry';
import type { Tool } from '../../core/types';
import { bufToBase64 } from './crypto-utils';

function toPem(b64: string, type: string): string {
  const lines = b64.match(/.{1,64}/g) ?? [];
  return `-----BEGIN ${type}-----\n${lines.join('\n')}\n-----END ${type}-----`;
}

const tool: Tool = {
  id: 'rsa-gen',
  name: 'RSA Key Generator',
  description: 'Generate RSA key pair (2048/4096 bits) in PEM or JWK format',
  category: 'crypto',
  tags: ['rsa', 'key', 'keypair', 'public', 'private', 'pem', 'jwk', 'asymmetric', 'crypto'],
  inputs: [],
  options: [
    {
      id: 'keySize',
      label: 'Key Size',
      type: 'select',
      default: '2048',
      options: [
        { label: '2048 bits', value: '2048' },
        { label: '4096 bits', value: '4096' },
      ],
    },
    {
      id: 'format',
      label: 'Output Format',
      type: 'select',
      default: 'pem',
      options: [
        { label: 'PEM', value: 'pem' },
        { label: 'JWK', value: 'jwk' },
      ],
    },
  ],
  output: { type: 'text' },
  apiSupported: false,
  async run(_inputs, options, onProgress) {
    const keySize = parseInt(options.keySize as string, 10);
    const format = options.format as string;

    onProgress?.(10, 'Generating RSA key pair...');

    const subtle = globalThis.crypto.subtle;
    const keyPair = await subtle.generateKey(
      {
        name: 'RSA-OAEP',
        modulusLength: keySize,
        publicExponent: new Uint8Array([1, 0, 1]),
        hash: 'SHA-256',
      },
      true,
      ['encrypt', 'decrypt']
    );

    onProgress?.(80, 'Exporting keys...');

    let result: string;
    if (format === 'jwk') {
      const pubJwk = await subtle.exportKey('jwk', keyPair.publicKey);
      const privJwk = await subtle.exportKey('jwk', keyPair.privateKey);
      result = `// Public Key (JWK)\n${JSON.stringify(pubJwk, null, 2)}\n\n// Private Key (JWK)\n${JSON.stringify(privJwk, null, 2)}`;
    } else {
      const pubSpki = await subtle.exportKey('spki', keyPair.publicKey);
      const privPkcs8 = await subtle.exportKey('pkcs8', keyPair.privateKey);
      const pubPem = toPem(bufToBase64(pubSpki), 'PUBLIC KEY');
      const privPem = toPem(bufToBase64(privPkcs8), 'PRIVATE KEY');
      result = `${pubPem}\n\n${privPem}`;
    }

    onProgress?.(100, 'Done');
    return {
      type: 'text',
      data: result,
      summary: `Generated RSA-${keySize} key pair in ${format.toUpperCase()} format`,
    };
  },
};

registry.register(tool);
export default tool;
