import { registry } from '../../core/registry';
import type { Tool } from '../../core/types';
import { UNIT_CATEGORIES, convertUnit } from './unit-data';

const tool: Tool = {
  id: 'unit-convert',
  name: 'Unit Converter',
  description: 'Convert between measurement units across length, weight, temperature, area, volume, speed, pressure, energy, power, data size, and time',
  category: 'math',
  tags: ['unit', 'convert', 'length', 'weight', 'temperature', 'area', 'volume', 'speed', 'pressure', 'energy', 'power', 'data', 'size', 'time', 'measurement'],
  inputs: [
    {
      id: 'value',
      label: 'Value',
      type: 'text',
      placeholder: 'Enter value to convert...',
    },
  ],
  options: [
    {
      id: 'category',
      label: 'Category',
      type: 'select',
      default: 'length',
      options: UNIT_CATEGORIES.map(c => ({ label: c.label, value: c.id })),
    },
    {
      id: 'from',
      label: 'From Unit',
      type: 'select',
      default: 'km',
      options: UNIT_CATEGORIES[0].units.map(u => ({ label: u.label, value: u.id })),
    },
    {
      id: 'to',
      label: 'To Unit',
      type: 'select',
      default: 'mi',
      options: UNIT_CATEGORIES[0].units.map(u => ({ label: u.label, value: u.id })),
    },
  ],
  output: { type: 'text' },
  apiSupported: true,

  async run(inputs, options) {
    const value = parseFloat(inputs.value as string);
    if (isNaN(value)) throw new Error('Please enter a valid number');

    const category = options.category as string;
    const from = options.from as string;
    const to = options.to as string;

    const result = convertUnit(value, from, to, category);
    if (result === null) throw new Error(`Cannot convert: invalid units or category`);

    const cat = UNIT_CATEGORIES.find(c => c.id === category)!;
    const fromUnit = cat.units.find(u => u.id === from)!;
    const toUnit = cat.units.find(u => u.id === to)!;

    // Format result: avoid scientific notation for reasonably sized numbers
    let formatted: string;
    const abs = Math.abs(result);
    if (abs === 0) {
      formatted = '0';
    } else if (abs >= 1e-4 && abs < 1e12) {
      // Use up to 10 significant digits but trim trailing zeros
      formatted = parseFloat(result.toPrecision(10)).toString();
    } else {
      formatted = result.toExponential(6);
    }

    return {
      type: 'text',
      data: `${value} ${fromUnit.label} = ${formatted} ${toUnit.label}`,
      summary: `Category: ${cat.label}`,
    };
  },
};

registry.register(tool);
export default tool;
