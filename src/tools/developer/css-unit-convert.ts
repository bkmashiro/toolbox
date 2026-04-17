import { registry } from '../../core/registry';
import type { Tool } from '../../core/types';

const UNITS = ['px', 'rem', 'em', 'vw', 'vh', 'pt', 'cm', 'mm', 'in', '%'];

function convert(value: number, from: string, to: string, opts: { base: number; vw: number; vh: number; parentSize?: number }): number {
  const { base, vw, vh, parentSize = base } = opts;

  // Convert to px first
  let px: number;
  switch (from) {
    case 'px': px = value; break;
    case 'rem': px = value * base; break;
    case 'em': px = value * parentSize; break;
    case 'vw': px = (value / 100) * vw; break;
    case 'vh': px = (value / 100) * vh; break;
    case 'pt': px = value * (96 / 72); break;
    case 'cm': px = value * (96 / 2.54); break;
    case 'mm': px = value * (96 / 25.4); break;
    case 'in': px = value * 96; break;
    case '%': px = (value / 100) * parentSize; break;
    default: throw new Error(`Unknown unit: ${from}`);
  }

  // Convert from px to target
  switch (to) {
    case 'px': return px;
    case 'rem': return px / base;
    case 'em': return px / parentSize;
    case 'vw': return (px / vw) * 100;
    case 'vh': return (px / vh) * 100;
    case 'pt': return px / (96 / 72);
    case 'cm': return px / (96 / 2.54);
    case 'mm': return px / (96 / 25.4);
    case 'in': return px / 96;
    case '%': return (px / parentSize) * 100;
    default: throw new Error(`Unknown unit: ${to}`);
  }
}

const tool: Tool = {
  id: 'css-unit-convert',
  name: 'CSS Units',
  description: 'Convert between CSS units — px, rem, em, vw, vh, pt, cm, mm, in, %',
  category: 'developer',
  tags: ['css', 'units', 'px', 'rem', 'em', 'vw', 'vh', 'convert', 'responsive', 'developer'],
  inputs: [
    {
      id: 'value',
      label: 'Value (e.g. "16px" or just "16")',
      type: 'text',
      placeholder: '16px',
    },
  ],
  options: [
    {
      id: 'fromUnit',
      label: 'From Unit',
      type: 'select',
      default: 'px',
      options: UNITS.map((u) => ({ label: u, value: u })),
    },
    {
      id: 'toUnit',
      label: 'To Unit',
      type: 'select',
      default: 'rem',
      options: UNITS.map((u) => ({ label: u, value: u })),
    },
    {
      id: 'baseFontSize',
      label: 'Base Font Size (px)',
      type: 'number',
      default: 16,
      min: 1,
      max: 100,
      helpText: 'Root font-size for rem conversions',
    },
    {
      id: 'viewportWidth',
      label: 'Viewport Width (px)',
      type: 'number',
      default: 1440,
      min: 1,
      max: 7680,
      helpText: 'For vw conversions',
    },
    {
      id: 'viewportHeight',
      label: 'Viewport Height (px)',
      type: 'number',
      default: 900,
      min: 1,
      max: 4320,
      helpText: 'For vh conversions',
    },
    {
      id: 'showAll',
      label: 'Show All Conversions',
      type: 'checkbox',
      default: false,
    },
  ],
  output: { type: 'text' },
  apiSupported: false,
  async run(inputs, options) {
    let valueStr = ((inputs.value as string) ?? '').trim();
    const fromUnit = options.fromUnit as string;
    const toUnit = options.toUnit as string;
    const base = options.baseFontSize as number;
    const vw = options.viewportWidth as number;
    const vh = options.viewportHeight as number;
    const showAll = options.showAll as boolean;

    // Parse value — strip unit if present
    const match = valueStr.match(/^([\d.]+)\s*([a-z%]*)$/i);
    if (!match) throw new Error('Invalid value format');
    const num = parseFloat(match[1]);
    if (isNaN(num)) throw new Error('Invalid number');

    const opts = { base, vw, vh };

    if (showAll) {
      const lines = UNITS.map((unit) => {
        const result = convert(num, fromUnit, unit, opts);
        const formatted = result.toFixed(4).replace(/\.?0+$/, '');
        return `${unit.padEnd(4)}: ${formatted}${unit}`;
      });
      return { type: 'text', data: lines.join('\n') };
    }

    const result = convert(num, fromUnit, toUnit, opts);
    const formatted = result.toFixed(6).replace(/\.?0+$/, '');
    return {
      type: 'text',
      data: `${num}${fromUnit} = ${formatted}${toUnit}`,
      summary: `Base: ${base}px | Viewport: ${vw}x${vh}px`,
    };
  },
};

registry.register(tool);
export default tool;
