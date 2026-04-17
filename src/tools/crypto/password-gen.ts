import { registry } from '../../core/registry';
import type { Tool } from '../../core/types';

const UPPERCASE = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
const LOWERCASE = 'abcdefghijklmnopqrstuvwxyz';
const NUMBERS = '0123456789';
const SYMBOLS = '!@#$%^&*()_+-=[]{}|;:,.<>?';
const AMBIGUOUS = /[0OoIl1]/g;

function calcEntropy(charsetSize: number, length: number): number {
  return Math.log2(Math.pow(charsetSize, length));
}

function generatePassword(
  length: number,
  charset: string
): string {
  const arr = new Uint32Array(length);
  globalThis.crypto.getRandomValues(arr);
  return Array.from(arr, (n) => charset[n % charset.length]).join('');
}

const tool: Tool = {
  id: 'password-gen',
  name: 'Password Generator',
  description: 'Generate secure random passwords with configurable length and charset',
  category: 'crypto',
  tags: ['password', 'generator', 'random', 'secure', 'entropy', 'charset', 'crypto'],
  inputs: [],
  options: [
    {
      id: 'length',
      label: 'Length',
      type: 'range',
      default: 16,
      min: 8,
      max: 128,
      step: 1,
    },
    {
      id: 'uppercase',
      label: 'Uppercase (A-Z)',
      type: 'checkbox',
      default: true,
    },
    {
      id: 'lowercase',
      label: 'Lowercase (a-z)',
      type: 'checkbox',
      default: true,
    },
    {
      id: 'numbers',
      label: 'Numbers (0-9)',
      type: 'checkbox',
      default: true,
    },
    {
      id: 'symbols',
      label: 'Symbols (!@#$...)',
      type: 'checkbox',
      default: true,
    },
    {
      id: 'excludeAmbiguous',
      label: 'Exclude Ambiguous (0, O, o, I, l, 1)',
      type: 'checkbox',
      default: false,
    },
    {
      id: 'excludeChars',
      label: 'Exclude Characters',
      type: 'text',
      default: '',
      placeholder: 'Characters to exclude...',
      required: false,
    },
    {
      id: 'count',
      label: 'Count',
      type: 'number',
      default: 1,
      min: 1,
      max: 100,
      step: 1,
    },
  ],
  output: { type: 'text' },
  apiSupported: true,
  async run(_inputs, options) {
    const length = options.length as number;
    const count = options.count as number;
    const excludeAmbiguous = options.excludeAmbiguous as boolean;
    const excludeChars = (options.excludeChars as string) || '';

    let charset = '';
    if (options.uppercase) charset += UPPERCASE;
    if (options.lowercase) charset += LOWERCASE;
    if (options.numbers) charset += NUMBERS;
    if (options.symbols) charset += SYMBOLS;

    if (!charset) throw new Error('At least one character type must be selected');

    if (excludeAmbiguous) charset = charset.replace(AMBIGUOUS, '');
    if (excludeChars) {
      const toExclude = new Set(excludeChars.split(''));
      charset = charset.split('').filter((c) => !toExclude.has(c)).join('');
    }

    if (!charset) throw new Error('No characters left after exclusions');

    const passwords = Array.from({ length: count }, () => generatePassword(length, charset));
    const entropy = calcEntropy(charset.length, length).toFixed(1);

    return {
      type: 'text',
      data: passwords.join('\n'),
      summary: `Charset size: ${charset.length} | Entropy: ${entropy} bits | Length: ${length}`,
    };
  },
};

registry.register(tool);
export default tool;
