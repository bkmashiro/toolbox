import { registry } from '../../core/registry';
import type { Tool } from '../../core/types';

const tool: Tool = {
  id: 'percentage-calc',
  name: 'Percentage Calculator',
  description: 'Three calculators: X% of Y, X is what % of Y, and % change from X to Y',
  category: 'math',
  tags: ['percentage', 'percent', 'calculator', 'change', 'ratio', 'proportion'],
  inputs: [
    {
      id: 'x',
      label: 'X (first value)',
      type: 'text',
      placeholder: 'Enter X...',
    },
    {
      id: 'y',
      label: 'Y (second value)',
      type: 'text',
      placeholder: 'Enter Y...',
    },
  ],
  options: [
    {
      id: 'mode',
      label: 'Mode',
      type: 'select',
      default: 'of',
      options: [
        { label: 'X% of Y = ?', value: 'of' },
        { label: 'X is what % of Y?', value: 'what' },
        { label: '% change from X to Y', value: 'change' },
      ],
    },
  ],
  output: { type: 'text' },
  apiSupported: true,

  async run(inputs, options) {
    const x = parseFloat(inputs.x as string);
    const y = parseFloat(inputs.y as string);
    const mode = options.mode as string;

    if (isNaN(x)) throw new Error('X must be a valid number');
    if (isNaN(y)) throw new Error('Y must be a valid number');

    let lines: string[] = [];

    if (mode === 'of') {
      // X% of Y
      const result = (x / 100) * y;
      lines = [
        `${x}% of ${y} = ${result}`,
        ``,
        `Formula: (${x} / 100) × ${y} = ${result}`,
      ];
    } else if (mode === 'what') {
      // X is what % of Y
      if (y === 0) throw new Error('Y cannot be zero for this mode');
      const result = (x / y) * 100;
      lines = [
        `${x} is ${result.toPrecision(6)}% of ${y}`,
        ``,
        `Formula: (${x} / ${y}) × 100 = ${result.toPrecision(6)}%`,
      ];
    } else if (mode === 'change') {
      // % change from X to Y
      if (x === 0) throw new Error('X (starting value) cannot be zero for % change');
      const result = ((y - x) / Math.abs(x)) * 100;
      const direction = result > 0 ? 'increase' : result < 0 ? 'decrease' : 'no change';
      lines = [
        `% change from ${x} to ${y} = ${result.toPrecision(6)}% (${direction})`,
        ``,
        `Formula: ((${y} - ${x}) / |${x}|) × 100 = ${result.toPrecision(6)}%`,
        `Absolute change: ${y - x}`,
      ];
    }

    return { type: 'text', data: lines.join('\n') };
  },
};

registry.register(tool);
export default tool;
