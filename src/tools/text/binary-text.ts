import { registry } from '../../core/registry';
import type { Tool } from '../../core/types';

function textToBinary(text: string): string {
  return Array.from(text)
    .map(c => c.charCodeAt(0).toString(2).padStart(8, '0'))
    .join(' ');
}

function binaryToText(binary: string): string {
  const bytes = binary.trim().split(/\s+/);
  return bytes
    .map(byte => {
      const code = parseInt(byte, 2);
      if (isNaN(code) || code < 0 || code > 255) return '?';
      return String.fromCharCode(code);
    })
    .join('');
}

const tool: Tool = {
  id: 'binary-text',
  name: 'Binary / Text',
  description: 'Convert text to binary (space-separated 8-bit bytes) and back.',
  category: 'text',
  tags: ['binary', 'text', 'encode', 'decode', 'bits', 'bytes', 'convert'],
  inputs: [
    {
      id: 'input',
      label: 'Input',
      type: 'textarea',
      placeholder: 'Enter text or binary (e.g. 01001000 01101001)...',
      rows: 6,
    },
  ],
  options: [
    {
      id: 'direction',
      label: 'Direction',
      type: 'select',
      default: 'encode',
      options: [
        { label: 'Text → Binary', value: 'encode' },
        { label: 'Binary → Text', value: 'decode' },
      ],
    },
    {
      id: 'encoding',
      label: 'Character Encoding',
      type: 'select',
      default: 'ascii',
      options: [
        { label: 'ASCII / Latin-1 (8-bit)', value: 'ascii' },
      ],
      helpText: 'Currently supports ASCII/Latin-1. Non-ASCII characters encode to their code point, which may exceed 8 bits.',
    },
  ],
  output: { type: 'text' },
  apiSupported: false,
  async run(inputs, options) {
    const input = inputs.input as string;
    const direction = options.direction as string;

    if (direction === 'encode') {
      return {
        type: 'text',
        data: textToBinary(input),
        summary: `${input.length} characters → ${input.length} bytes`,
      };
    } else {
      const result = binaryToText(input);
      return {
        type: 'text',
        data: result,
        summary: `${input.trim().split(/\s+/).length} bytes decoded`,
      };
    }
  },
};

registry.register(tool);
export default tool;
