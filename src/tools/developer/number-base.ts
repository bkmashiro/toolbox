import { registry } from '../../core/registry';
import type { Tool } from '../../core/types';

const tool: Tool = {
  id: 'number-base',
  name: 'Number Base',
  description: 'Convert numbers between bases 2-36 — all simultaneously shown',
  category: 'developer',
  tags: ['base', 'number', 'binary', 'octal', 'decimal', 'hex', 'convert', 'radix', 'developer'],
  inputs: [
    {
      id: 'number',
      label: 'Number',
      type: 'text',
      placeholder: '255 or 0xFF or 0b11111111 or 0o377',
    },
  ],
  options: [
    {
      id: 'fromBase',
      label: 'Input Base',
      type: 'select',
      default: '10',
      options: [
        { label: 'Binary (2)', value: '2' },
        { label: 'Octal (8)', value: '8' },
        { label: 'Decimal (10)', value: '10' },
        { label: 'Hexadecimal (16)', value: '16' },
        { label: 'Base 32', value: '32' },
        { label: 'Base 36', value: '36' },
        { label: 'Auto-detect', value: 'auto' },
      ],
    },
  ],
  output: { type: 'text' },
  apiSupported: true,
  async run(inputs, options) {
    let input = ((inputs.number as string) ?? '').trim();
    if (!input) throw new Error('Number is required');

    let fromBase = parseInt(options.fromBase as string, 10);
    const autoDetect = options.fromBase === 'auto';

    // Auto-detect prefix
    if (autoDetect || input.startsWith('0x') || input.startsWith('0b') || input.startsWith('0o')) {
      if (input.startsWith('0x') || input.startsWith('0X')) { fromBase = 16; input = input.slice(2); }
      else if (input.startsWith('0b') || input.startsWith('0B')) { fromBase = 2; input = input.slice(2); }
      else if (input.startsWith('0o') || input.startsWith('0O')) { fromBase = 8; input = input.slice(2); }
      else if (autoDetect) fromBase = 10;
    }

    const num = parseInt(input, fromBase);
    if (isNaN(num)) throw new Error(`"${input}" is not a valid base-${fromBase} number`);

    const lines = [
      `Decimal  (10): ${num}`,
      `Binary    (2): ${num.toString(2).padStart(Math.ceil(num.toString(2).length / 4) * 4, '0')}`,
      `Octal     (8): ${num.toString(8)}`,
      `Hex      (16): ${num.toString(16).toUpperCase()} (0x${num.toString(16).toUpperCase()})`,
      `Base 32  (32): ${num.toString(32).toUpperCase()}`,
      `Base 36  (36): ${num.toString(36).toUpperCase()}`,
    ];

    return {
      type: 'text',
      data: lines.join('\n'),
      summary: `Input: ${input} (base ${fromBase}) = ${num} (decimal)`,
    };
  },
};

registry.register(tool);
export default tool;
