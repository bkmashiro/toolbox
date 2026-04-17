import { registry } from '../../core/registry';
import type { Tool } from '../../core/types';

const ALGO_MAP: Record<string, string> = {
  'sha-256': 'SHA-256',
  'sha-384': 'SHA-384',
  'sha-512': 'SHA-512',
  'sha-1': 'SHA-1',
};

async function computeHash(buffer: ArrayBuffer, algorithm: string): Promise<string> {
  const subtleAlgo = ALGO_MAP[algorithm.toLowerCase()];
  if (!subtleAlgo) throw new Error(`Unsupported algorithm: ${algorithm}`);
  const hashBuffer = await crypto.subtle.digest(subtleAlgo, buffer);
  return Array.from(new Uint8Array(hashBuffer))
    .map(b => b.toString(16).padStart(2, '0'))
    .join('');
}

const tool: Tool = {
  id: 'file-hash',
  name: 'File Hash',
  description: 'Compute SHA-256, SHA-384, SHA-512, or SHA-1 of any file locally via Web Crypto. Files never leave your browser.',
  category: 'misc',
  tags: ['file', 'hash', 'sha256', 'sha-256', 'sha-512', 'checksum', 'integrity', 'crypto'],
  inputs: [
    {
      id: 'file',
      label: 'File',
      type: 'file',
      accept: '*',
    },
  ],
  options: [
    {
      id: 'algorithm',
      label: 'Algorithm',
      type: 'select',
      default: 'sha-256',
      options: [
        { label: 'SHA-256 (recommended)', value: 'sha-256' },
        { label: 'SHA-384', value: 'sha-384' },
        { label: 'SHA-512', value: 'sha-512' },
        { label: 'SHA-1 (weak, legacy use only)', value: 'sha-1' },
      ],
    },
    {
      id: 'uppercase',
      label: 'Uppercase output',
      type: 'checkbox',
      default: false,
    },
  ],
  output: { type: 'text' },
  apiSupported: false,

  async run(inputs, options, onProgress) {
    const file = inputs.file as File;
    if (!file) throw new Error('Please select a file');

    onProgress?.(10, 'Reading file...');
    const buffer = await file.arrayBuffer();
    onProgress?.(50, 'Computing hash...');

    const algorithm = options.algorithm as string;
    let hash = await computeHash(buffer, algorithm);

    if (options.uppercase as boolean) hash = hash.toUpperCase();
    onProgress?.(100, 'Done');

    const formatBytes = (n: number) => {
      if (n < 1024) return `${n} B`;
      if (n < 1048576) return `${(n / 1024).toFixed(2)} KB`;
      return `${(n / 1048576).toFixed(2)} MB`;
    };

    const output = [
      `File: ${file.name}`,
      `Size: ${formatBytes(file.size)}`,
      `Algorithm: ${algorithm.toUpperCase()}`,
      ``,
      hash,
    ].join('\n');

    return { type: 'text', data: output, summary: `${algorithm.toUpperCase()} hash computed` };
  },
};

registry.register(tool);
export default tool;
