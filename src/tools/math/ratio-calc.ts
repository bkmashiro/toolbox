import { registry } from '../../core/registry';
import type { Tool } from '../../core/types';

function gcd(a: number, b: number): number {
  a = Math.abs(Math.round(a));
  b = Math.abs(Math.round(b));
  while (b) { [a, b] = [b, a % b]; }
  return a;
}


const tool: Tool = {
  id: 'ratio-calc',
  name: 'Ratio Calculator',
  description: 'Simplify ratios using GCD, scale ratios, and calculate aspect ratios',
  category: 'math',
  tags: ['ratio', 'calculator', 'simplify', 'scale', 'aspect', 'gcd', 'proportion'],
  inputs: [
    {
      id: 'ratioA',
      label: 'A (first part of ratio A:B)',
      type: 'text',
      placeholder: 'e.g. 16',
    },
    {
      id: 'ratioB',
      label: 'B (second part of ratio A:B)',
      type: 'text',
      placeholder: 'e.g. 9',
    },
  ],
  options: [
    {
      id: 'mode',
      label: 'Mode',
      type: 'select',
      default: 'simplify',
      options: [
        { label: 'Simplify Ratio', value: 'simplify' },
        { label: 'Scale Ratio (multiply A:B by factor)', value: 'scale' },
        { label: 'Aspect Ratio (A×B scaled to standard widths)', value: 'aspect' },
      ],
    },
    {
      id: 'scaleFactor',
      label: 'Scale Factor',
      type: 'number',
      default: 2,
      min: 0.001,
      step: 0.1,
      showWhen: { optionId: 'mode', value: 'scale' },
    },
  ],
  output: { type: 'text' },
  apiSupported: false,

  async run(inputs, options) {
    const a = parseFloat(inputs.ratioA as string);
    const b = parseFloat(inputs.ratioB as string);
    if (isNaN(a) || isNaN(b)) throw new Error('Both A and B must be valid numbers');
    if (a <= 0 || b <= 0) throw new Error('Both values must be positive');

    const mode = options.mode as string;
    const lines: string[] = [];

    if (mode === 'simplify') {
      // For integer ratios use GCD; for decimals, find rational approximation
      const g = gcd(Math.round(a * 1000), Math.round(b * 1000));
      const sa = Math.round(a * 1000) / g;
      const sb = Math.round(b * 1000) / g;
      const g2 = gcd(sa, sb);
      const simpA = sa / g2;
      const simpB = sb / g2;

      lines.push(`Original:   ${a} : ${b}`);
      lines.push(`Simplified: ${simpA} : ${simpB}`);
      lines.push(`GCD: ${g2}`);
      lines.push(`Decimal ratio: ${(a / b).toPrecision(6)}`);
      lines.push(`As fraction: ${simpA}/${simpB}`);
    } else if (mode === 'scale') {
      const factor = options.scaleFactor as number;
      const scaledA = a * factor;
      const scaledB = b * factor;
      lines.push(`Original:  ${a} : ${b}`);
      lines.push(`× ${factor} =  ${scaledA} : ${scaledB}`);
      lines.push(`Scaled A = ${scaledA}`);
      lines.push(`Scaled B = ${scaledB}`);
    } else {
      // Aspect ratio
      const g = gcd(Math.round(a), Math.round(b));
      const simpA = Math.round(a) / g;
      const simpB = Math.round(b) / g;

      lines.push(`Simplified: ${simpA}:${simpB}`);
      lines.push(`Decimal: ${(a / b).toFixed(4)}`);
      lines.push('');
      lines.push('Scaled to common widths:');
      const widths = [320, 640, 800, 1024, 1280, 1366, 1440, 1920, 2560, 3840];
      for (const w of widths) {
        const h = Math.round(w * (b / a));
        lines.push(`  ${w} × ${h}`);
      }
    }

    return { type: 'text', data: lines.join('\n') };
  },
};

registry.register(tool);
export default tool;
