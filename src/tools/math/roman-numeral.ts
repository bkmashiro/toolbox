import { registry } from '../../core/registry';
import type { Tool } from '../../core/types';

const ROMAN_VALUES: [string, number][] = [
  ['M', 1000], ['CM', 900], ['D', 500], ['CD', 400],
  ['C', 100],  ['XC', 90],  ['L', 50],  ['XL', 40],
  ['X', 10],   ['IX', 9],   ['V', 5],   ['IV', 4],   ['I', 1],
];

export function toRoman(n: number): string {
  if (!Number.isInteger(n) || n < 1 || n > 3999) {
    throw new Error('Number must be an integer between 1 and 3999');
  }
  let result = '';
  let remaining = n;
  for (const [sym, val] of ROMAN_VALUES) {
    while (remaining >= val) {
      result += sym;
      remaining -= val;
    }
  }
  return result;
}

export function fromRoman(s: string): number {
  const str = s.trim().toUpperCase();
  if (!/^[MDCLXVI]+$/.test(str)) {
    throw new Error('Invalid Roman numeral characters');
  }
  const romanMap: Record<string, number> = { M: 1000, D: 500, C: 100, L: 50, X: 10, V: 5, I: 1 };
  let result = 0;
  for (let i = 0; i < str.length; i++) {
    const curr = romanMap[str[i]];
    const next = romanMap[str[i + 1]] ?? 0;
    if (curr < next) {
      result -= curr;
    } else {
      result += curr;
    }
  }
  if (result < 1 || result > 3999) throw new Error('Roman numeral out of range (1-3999)');
  // Validate round-trip
  if (toRoman(result) !== str) throw new Error('Invalid Roman numeral (non-canonical form)');
  return result;
}

function isRoman(s: string): boolean {
  return /^[MDCLXVImdclxvi]+$/.test(s.trim());
}

const tool: Tool = {
  id: 'roman-numeral',
  name: 'Roman Numerals',
  description: 'Convert between integers (1–3999) and Roman numerals. Auto-detects direction.',
  category: 'math',
  tags: ['roman', 'numeral', 'integer', 'convert', 'ancient', 'number'],
  inputs: [
    {
      id: 'value',
      label: 'Value (integer or Roman numeral)',
      type: 'text',
      placeholder: 'e.g. 42 or XLII',
    },
  ],
  options: [
    {
      id: 'direction',
      label: 'Direction',
      type: 'select',
      default: 'auto',
      options: [
        { label: 'Auto-detect', value: 'auto' },
        { label: 'Integer → Roman', value: 'to-roman' },
        { label: 'Roman → Integer', value: 'to-int' },
      ],
    },
  ],
  output: { type: 'text' },
  apiSupported: true,

  async run(inputs, options) {
    const raw = (inputs.value as string).trim();
    if (!raw) throw new Error('Please enter a value');

    const dir = options.direction as string;
    const asInt = parseInt(raw, 10);
    const looksLikeInt = !isNaN(asInt) && asInt.toString() === raw;

    let result: string;

    if (dir === 'to-roman' || (dir === 'auto' && looksLikeInt)) {
      const n = parseInt(raw, 10);
      if (isNaN(n)) throw new Error('Not a valid integer');
      const roman = toRoman(n);
      result = `${n} = ${roman}`;
    } else {
      const n = fromRoman(raw);
      result = `${raw.toUpperCase()} = ${n}`;
    }

    return { type: 'text', data: result };
  },
};

registry.register(tool);
export default tool;
