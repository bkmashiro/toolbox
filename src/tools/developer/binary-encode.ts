import { registry } from '../../core/registry';
import type { Tool } from '../../core/types';

const tool: Tool = {
  id: 'binary-encode',
  name: 'Binary Encode',
  description: 'Convert numbers/text to/from binary string representation',
  category: 'developer',
  tags: ['binary', 'encode', 'decode', 'bits', 'text', 'number', 'developer'],
  inputs: [
    {
      id: 'text',
      label: 'Input',
      type: 'textarea',
      placeholder: 'Enter text or binary (e.g. 01001000 01100101 01101100)...',
      rows: 4,
    },
  ],
  options: [
    {
      id: 'mode',
      label: 'Mode',
      type: 'select',
      default: 'encode',
      options: [
        { label: 'Text → Binary', value: 'encode' },
        { label: 'Binary → Text', value: 'decode' },
        { label: 'Number → Binary', value: 'num-to-bin' },
        { label: 'Binary → Number', value: 'bin-to-num' },
      ],
    },
    {
      id: 'separator',
      label: 'Separator (for encode)',
      type: 'select',
      default: 'space',
      options: [
        { label: 'Space', value: 'space' },
        { label: 'None', value: 'none' },
      ],
      showWhen: { optionId: 'mode', value: 'encode' },
    },
    {
      id: 'groupSize',
      label: 'Group Size (display)',
      type: 'select',
      default: '8',
      options: [
        { label: '8 bits (byte)', value: '8' },
        { label: '4 bits (nibble)', value: '4' },
      ],
      showWhen: { optionId: 'mode', value: 'encode' },
    },
  ],
  output: { type: 'text' },
  apiSupported: true,
  async run(inputs, options) {
    const input = (inputs.text as string) ?? '';
    const mode = options.mode as string;

    if (mode === 'encode') {
      const separator = options.separator as string;
      const sep = separator === 'space' ? ' ' : '';
      const bytes = new TextEncoder().encode(input);
      const binary = Array.from(bytes, (b) => b.toString(2).padStart(8, '0')).join(sep);
      return { type: 'text', data: binary };
    }

    if (mode === 'decode') {
      const clean = input.replace(/\s/g, '');
      if (!/^[01]+$/.test(clean)) throw new Error('Invalid binary input — only 0 and 1 allowed');
      if (clean.length % 8 !== 0) throw new Error('Binary string length must be a multiple of 8');
      const bytes = new Uint8Array(clean.length / 8);
      for (let i = 0; i < clean.length; i += 8) {
        bytes[i / 8] = parseInt(clean.slice(i, i + 8), 2);
      }
      return { type: 'text', data: new TextDecoder().decode(bytes) };
    }

    if (mode === 'num-to-bin') {
      const num = parseInt(input.trim(), 10);
      if (isNaN(num)) throw new Error('Invalid integer');
      const bin = num < 0
        ? '-' + Math.abs(num).toString(2)
        : num.toString(2);
      return { type: 'text', data: bin.padStart(Math.ceil(bin.replace('-', '').length / 8) * 8, '0') };
    }

    if (mode === 'bin-to-num') {
      const clean = input.trim().replace(/\s/g, '');
      if (!/^[01]+$/.test(clean)) throw new Error('Invalid binary input');
      return { type: 'text', data: parseInt(clean, 2).toString() };
    }

    throw new Error('Unknown mode');
  },
};

registry.register(tool);
export default tool;
