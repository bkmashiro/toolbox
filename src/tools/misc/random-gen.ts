import { registry } from '../../core/registry';
import type { Tool } from '../../core/types';

function randomInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function randomString(length: number, charset: string): string {
  let result = '';
  for (let i = 0; i < length; i++) {
    result += charset[Math.floor(Math.random() * charset.length)];
  }
  return result;
}

const CHARSETS: Record<string, string> = {
  alphanumeric: 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789',
  alpha: 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz',
  lowercase: 'abcdefghijklmnopqrstuvwxyz',
  uppercase: 'ABCDEFGHIJKLMNOPQRSTUVWXYZ',
  digits: '0123456789',
  hex: '0123456789abcdef',
  symbols: '!@#$%^&*()_+-=[]{}|;:,.<>?',
  all: 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*()_+-=[]{}|;:,.<>?',
};

const tool: Tool = {
  id: 'random-gen',
  name: 'Random Generator',
  description: 'Generate random numbers, strings, dice rolls, and picks from a list',
  category: 'misc',
  tags: ['random', 'generator', 'number', 'string', 'dice', 'pick', 'list', 'password'],
  inputs: [
    {
      id: 'listItems',
      label: 'List items (for "pick from list" mode, one per line)',
      type: 'textarea',
      placeholder: 'apple\nbanana\ncherry\n...',
      required: false,
      rows: 4,
    },
  ],
  options: [
    {
      id: 'mode',
      label: 'Mode',
      type: 'select',
      default: 'number',
      options: [
        { label: 'Random Number', value: 'number' },
        { label: 'Random String', value: 'string' },
        { label: 'Dice Roller (NdM)', value: 'dice' },
        { label: 'Pick from List', value: 'list' },
      ],
    },
    {
      id: 'min',
      label: 'Min (for number)',
      type: 'number',
      default: 1,
      step: 1,
      showWhen: { optionId: 'mode', value: 'number' },
    },
    {
      id: 'max',
      label: 'Max (for number)',
      type: 'number',
      default: 100,
      step: 1,
      showWhen: { optionId: 'mode', value: 'number' },
    },
    {
      id: 'unique',
      label: 'Unique numbers only',
      type: 'checkbox',
      default: false,
      showWhen: { optionId: 'mode', value: 'number' },
    },
    {
      id: 'stringLength',
      label: 'String Length',
      type: 'range',
      default: 16,
      min: 1,
      max: 256,
      step: 1,
      showWhen: { optionId: 'mode', value: 'string' },
    },
    {
      id: 'charset',
      label: 'Character Set',
      type: 'select',
      default: 'alphanumeric',
      options: [
        { label: 'Alphanumeric (A-Z a-z 0-9)', value: 'alphanumeric' },
        { label: 'Alpha only (A-Z a-z)', value: 'alpha' },
        { label: 'Lowercase (a-z)', value: 'lowercase' },
        { label: 'Uppercase (A-Z)', value: 'uppercase' },
        { label: 'Digits only (0-9)', value: 'digits' },
        { label: 'Hex (0-9 a-f)', value: 'hex' },
        { label: 'Symbols only', value: 'symbols' },
        { label: 'All printable ASCII', value: 'all' },
      ],
      showWhen: { optionId: 'mode', value: 'string' },
    },
    {
      id: 'diceCount',
      label: 'Number of Dice (N)',
      type: 'number',
      default: 2,
      min: 1,
      max: 100,
      step: 1,
      showWhen: { optionId: 'mode', value: 'dice' },
    },
    {
      id: 'diceSides',
      label: 'Sides per Die (M)',
      type: 'select',
      default: 6,
      options: [
        { label: 'd4', value: 4 }, { label: 'd6', value: 6 }, { label: 'd8', value: 8 },
        { label: 'd10', value: 10 }, { label: 'd12', value: 12 }, { label: 'd20', value: 20 },
        { label: 'd100', value: 100 },
      ],
      showWhen: { optionId: 'mode', value: 'dice' },
    },
    {
      id: 'count',
      label: 'Count (how many to generate)',
      type: 'range',
      default: 1,
      min: 1,
      max: 100,
      step: 1,
    },
  ],
  output: { type: 'text' },
  apiSupported: false,

  async run(inputs, options) {
    const mode = options.mode as string;
    const count = options.count as number;
    const results: string[] = [];

    if (mode === 'number') {
      const min = options.min as number;
      const max = options.max as number;
      const unique = options.unique as boolean;
      if (min > max) throw new Error('Min must be ≤ Max');

      if (unique) {
        const range = max - min + 1;
        if (count > range) throw new Error(`Cannot generate ${count} unique numbers in range [${min}, ${max}] (only ${range} possible)`);
        const pool = Array.from({ length: range }, (_, i) => i + min);
        // Fisher-Yates shuffle to pick first N
        for (let i = 0; i < count; i++) {
          const j = i + Math.floor(Math.random() * (pool.length - i));
          [pool[i], pool[j]] = [pool[j], pool[i]];
        }
        results.push(...pool.slice(0, count).map(String));
      } else {
        for (let i = 0; i < count; i++) results.push(randomInt(min, max).toString());
      }

    } else if (mode === 'string') {
      const length = options.stringLength as number;
      const charset = CHARSETS[options.charset as string] ?? CHARSETS.alphanumeric;
      for (let i = 0; i < count; i++) results.push(randomString(length, charset));

    } else if (mode === 'dice') {
      const n = options.diceCount as number;
      const m = options.diceSides as number;
      for (let roll = 0; roll < count; roll++) {
        const rolls: number[] = [];
        for (let i = 0; i < n; i++) rolls.push(randomInt(1, m));
        const total = rolls.reduce((a, b) => a + b, 0);
        results.push(`${n}d${m}: [${rolls.join(', ')}] = ${total}`);
      }

    } else if (mode === 'list') {
      const rawList = (inputs.listItems as string ?? '').trim();
      if (!rawList) throw new Error('Please enter items in the list input');
      const items = rawList.split('\n').map(s => s.trim()).filter(s => s);
      if (items.length === 0) throw new Error('No valid items found');
      for (let i = 0; i < count; i++) results.push(items[randomInt(0, items.length - 1)]);
    }

    return {
      type: 'text',
      data: results.join('\n'),
      summary: `Generated ${count} ${mode} value${count !== 1 ? 's' : ''}`,
    };
  },
};

registry.register(tool);
export default tool;
