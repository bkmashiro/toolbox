import { registry } from '../../core/registry';
import type { Tool } from '../../core/types';
import { hexEncode, bufToBase64, strToBytes, hexDecode } from './crypto-utils';

const tool: Tool = {
  id: 'hmac-gen',
  name: 'HMAC Generator',
  description: 'Compute HMAC with a secret key and message using SHA-256/384/512',
  category: 'crypto',
  tags: ['hmac', 'hash', 'mac', 'authentication', 'sha256', 'sha512', 'crypto', 'signature'],
  inputs: [
    {
      id: 'message',
      label: 'Message',
      type: 'textarea',
      placeholder: 'Enter message...',
      rows: 4,
    },
    {
      id: 'key',
      label: 'Secret Key',
      type: 'text',
      placeholder: 'Enter secret key...',
    },
  ],
  options: [
    {
      id: 'algorithm',
      label: 'Algorithm',
      type: 'select',
      default: 'SHA-256',
      options: [
        { label: 'HMAC-SHA-256', value: 'SHA-256' },
        { label: 'HMAC-SHA-384', value: 'SHA-384' },
        { label: 'HMAC-SHA-512', value: 'SHA-512' },
      ],
    },
    {
      id: 'keyFormat',
      label: 'Key Format',
      type: 'select',
      default: 'text',
      options: [
        { label: 'Text (UTF-8)', value: 'text' },
        { label: 'Hex', value: 'hex' },
      ],
    },
    {
      id: 'outputFormat',
      label: 'Output Format',
      type: 'select',
      default: 'hex',
      options: [
        { label: 'Hex', value: 'hex' },
        { label: 'Base64', value: 'base64' },
      ],
    },
  ],
  output: { type: 'text' },
  apiSupported: true,
  async run(inputs, options) {
    const message = (inputs.message as string) ?? '';
    const key = (inputs.key as string) ?? '';
    const algorithm = options.algorithm as string;
    const keyFormat = options.keyFormat as string;
    const outputFormat = options.outputFormat as string;

    const subtle = globalThis.crypto.subtle;

    const keyBytes = keyFormat === 'hex' ? hexDecode(key) : strToBytes(key);

    const cryptoKey = await subtle.importKey(
      'raw',
      keyBytes,
      { name: 'HMAC', hash: algorithm },
      false,
      ['sign']
    );

    const signature = await subtle.sign('HMAC', cryptoKey, strToBytes(message));

    const result = outputFormat === 'base64' ? bufToBase64(signature) : hexEncode(signature);
    return { type: 'text', data: result };
  },
};

registry.register(tool);
export default tool;
