import { registry } from '../../core/registry';
import type { Tool } from '../../core/types';
import { hexEncode, strToBytes } from './crypto-utils';

async function hashText(algorithm: string, text: string): Promise<string> {
  if (algorithm === 'MD5') {
    const SparkMD5 = (await import('spark-md5')).default;
    return SparkMD5.hash(text);
  }
  const algoMap: Record<string, string> = {
    'SHA-1': 'SHA-1',
    'SHA-224': 'SHA-224',
    'SHA-256': 'SHA-256',
    'SHA-384': 'SHA-384',
    'SHA-512': 'SHA-512',
  };
  const subtle = globalThis.crypto?.subtle ?? (globalThis as unknown as { crypto: { subtle: SubtleCrypto } }).crypto?.subtle;
  const hash = await subtle.digest(algoMap[algorithm], strToBytes(text));
  return hexEncode(hash);
}

async function hashFile(algorithm: string, file: File): Promise<string> {
  const buf = await file.arrayBuffer();
  if (algorithm === 'MD5') {
    const SparkMD5 = (await import('spark-md5')).default;
    const spark = new SparkMD5.ArrayBuffer();
    spark.append(buf);
    return spark.end();
  }
  const algoMap: Record<string, string> = {
    'SHA-1': 'SHA-1',
    'SHA-224': 'SHA-224',
    'SHA-256': 'SHA-256',
    'SHA-384': 'SHA-384',
    'SHA-512': 'SHA-512',
  };
  const subtle = globalThis.crypto?.subtle ?? (globalThis as unknown as { crypto: { subtle: SubtleCrypto } }).crypto?.subtle;
  const hash = await subtle.digest(algoMap[algorithm], buf);
  return hexEncode(hash);
}

const tool: Tool = {
  id: 'hash-gen',
  name: 'Hash Generator',
  description: 'Compute hash of text or file using MD5, SHA-1, SHA-256, SHA-384, or SHA-512',
  category: 'crypto',
  tags: ['hash', 'md5', 'sha', 'sha256', 'sha512', 'checksum', 'digest', 'crypto'],
  inputs: [
    {
      id: 'text',
      label: 'Text Input',
      type: 'textarea',
      placeholder: 'Enter text to hash...',
      required: false,
      rows: 4,
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
      id: 'algorithm',
      label: 'Algorithm',
      type: 'select',
      default: 'SHA-256',
      options: [
        { label: 'MD5', value: 'MD5' },
        { label: 'SHA-1', value: 'SHA-1' },
        { label: 'SHA-224', value: 'SHA-224' },
        { label: 'SHA-256', value: 'SHA-256' },
        { label: 'SHA-384', value: 'SHA-384' },
        { label: 'SHA-512', value: 'SHA-512' },
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
    {
      id: 'showAll',
      label: 'Show All Algorithms',
      type: 'checkbox',
      default: false,
      helpText: 'Compute and display all hash algorithms simultaneously',
    },
    {
      id: 'uppercase',
      label: 'Uppercase Output',
      type: 'checkbox',
      default: false,
    },
  ],
  output: { type: 'text' },
  apiSupported: true,
  async run(inputs, options) {
    const inputType = options.inputType as string;
    const algorithm = options.algorithm as string;
    const uppercase = options.uppercase as boolean;
    const showAll = options.showAll as boolean;

    const algorithms = showAll
      ? ['MD5', 'SHA-1', 'SHA-224', 'SHA-256', 'SHA-384', 'SHA-512']
      : [algorithm];

    const results: string[] = [];

    for (const algo of algorithms) {
      let hash: string;
      if (inputType === 'file') {
        const file = inputs.file as File;
        if (!file) throw new Error('No file provided');
        hash = await hashFile(algo, file);
      } else {
        const text = (inputs.text as string) ?? '';
        hash = await hashText(algo, text);
      }
      if (uppercase) hash = hash.toUpperCase();
      results.push(showAll ? `${algo.padEnd(8)}: ${hash}` : hash);
    }

    return { type: 'text', data: results.join('\n') };
  },
};

registry.register(tool);
export default tool;
