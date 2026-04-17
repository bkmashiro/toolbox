import { registry } from '../../core/registry';
import type { Tool } from '../../core/types';
import { bufToBase64, base64ToBuf } from '../crypto/crypto-utils';

function toUrlSafe(b64: string): string {
  return b64.replace(/\+/g, '-').replace(/\//g, '_');
}

function fromUrlSafe(b64: string): string {
  return b64.replace(/-/g, '+').replace(/_/g, '/');
}

const tool: Tool = {
  id: 'base64-encode',
  name: 'Base64 Encode',
  description: 'Encode and decode Base64 — text or file, standard or URL-safe',
  category: 'developer',
  tags: ['base64', 'encode', 'decode', 'text', 'file', 'url-safe', 'developer'],
  inputs: [
    {
      id: 'text',
      label: 'Text Input',
      type: 'textarea',
      placeholder: 'Enter text or base64...',
      rows: 4,
      required: false,
    },
    {
      id: 'file',
      label: 'File Input',
      type: 'file',
      accept: '*',
      required: false,
    },
  ],
  options: [
    {
      id: 'mode',
      label: 'Mode',
      type: 'select',
      default: 'encode',
      options: [
        { label: 'Encode', value: 'encode' },
        { label: 'Decode', value: 'decode' },
      ],
    },
    {
      id: 'variant',
      label: 'Variant',
      type: 'select',
      default: 'standard',
      options: [
        { label: 'Standard (+ and /)', value: 'standard' },
        { label: 'URL-safe (- and _)', value: 'url-safe' },
      ],
    },
    {
      id: 'inputType',
      label: 'Input Type',
      type: 'select',
      default: 'text',
      options: [
        { label: 'Text', value: 'text' },
        { label: 'File', value: 'file' },
      ],
    },
  ],
  output: { type: 'text' },
  apiSupported: true,
  async run(inputs, options) {
    const mode = options.mode as string;
    const variant = options.variant as string;
    const inputType = options.inputType as string;

    if (mode === 'encode') {
      let b64: string;
      if (inputType === 'file') {
        const file = inputs.file as File;
        if (!file) throw new Error('No file provided');
        const buf = await file.arrayBuffer();
        b64 = bufToBase64(buf);
      } else {
        const text = (inputs.text as string) ?? '';
        const encoder = new TextEncoder();
        b64 = bufToBase64(encoder.encode(text));
      }
      if (variant === 'url-safe') b64 = toUrlSafe(b64);
      return { type: 'text', data: b64, summary: `${b64.length} characters of Base64` };
    } else {
      const raw = ((inputs.text as string) ?? '').trim();
      if (!raw) throw new Error('No base64 input provided');
      const normalized = variant === 'url-safe' ? fromUrlSafe(raw) : raw;
      const padded = normalized + '='.repeat((4 - (normalized.length % 4)) % 4);
      let bytes: Uint8Array;
      try {
        bytes = base64ToBuf(padded);
      } catch {
        throw new Error('Invalid base64 input');
      }
      const text = new TextDecoder('utf-8', { fatal: false }).decode(bytes);
      return { type: 'text', data: text };
    }
  },
};

registry.register(tool);
export default tool;
