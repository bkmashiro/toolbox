import { registry } from '../../core/registry';
import type { Tool } from '../../core/types';

const MORSE_TABLE: Record<string, string> = {
  A: '.-',    B: '-...', C: '-.-.', D: '-..',  E: '.',    F: '..-.',
  G: '--.',   H: '....', I: '..',   J: '.---', K: '-.-',  L: '.-..',
  M: '--',    N: '-.',   O: '---',  P: '.--.',  Q: '--.-', R: '.-.',
  S: '...',   T: '-',    U: '..-',  V: '...-', W: '.--',  X: '-..-',
  Y: '-.--',  Z: '--..',
  '0': '-----', '1': '.----', '2': '..---', '3': '...--', '4': '....-',
  '5': '.....', '6': '-....', '7': '--...', '8': '---..', '9': '----.',
  '.': '.-.-.-', ',': '--..--', '?': '..--..', '\'': '.----.',
  '!': '-.-.--', '/': '-..-.', '(': '-.--.',  ')': '-.--.-',
  '&': '.-...', ':': '---...', ';': '-.-.-.', '=': '-...-',
  '+': '.-.-.', '-': '-....-', '_': '..--.-', '"': '.-..-.',
  '$': '...-..-', '@': '.--.-.', ' ': '/',
};

const REVERSE_MORSE: Record<string, string> = {};
for (const [char, code] of Object.entries(MORSE_TABLE)) {
  REVERSE_MORSE[code] = char;
}
REVERSE_MORSE['/'] = ' ';

function textToMorse(text: string): string {
  return text
    .toUpperCase()
    .split('')
    .map(c => MORSE_TABLE[c] ?? '')
    .filter(Boolean)
    .join(' ');
}

function morseToText(morse: string): string {
  return morse
    .trim()
    .split(/\s{3,}|\s*\/\s*/)
    .map(word =>
      word
        .trim()
        .split(/\s+/)
        .map(code => REVERSE_MORSE[code] ?? '?')
        .join('')
    )
    .join(' ');
}

const tool: Tool = {
  id: 'morse-code',
  name: 'Morse Code',
  description: 'Convert text to Morse code and back using the standard ITU Morse table.',
  category: 'text',
  tags: ['morse', 'code', 'encode', 'decode', 'telegraph', 'dots', 'dashes', 'text'],
  inputs: [
    {
      id: 'input',
      label: 'Input',
      type: 'textarea',
      placeholder: 'Enter text or Morse code (dots/dashes separated by spaces)...',
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
        { label: 'Text → Morse', value: 'encode' },
        { label: 'Morse → Text', value: 'decode' },
      ],
    },
  ],
  output: { type: 'text' },
  apiSupported: false,
  async run(inputs, options) {
    const input = inputs.input as string;
    const direction = options.direction as string;

    if (direction === 'encode') {
      const unsupported = input
        .toUpperCase()
        .split('')
        .filter(c => c !== '\n' && !MORSE_TABLE[c]);
      const result = textToMorse(input);
      const summary = unsupported.length > 0 ? `Note: skipped unsupported chars: ${[...new Set(unsupported)].join(' ')}` : undefined;
      return { type: 'text', data: result, summary };
    } else {
      const result = morseToText(input);
      return { type: 'text', data: result };
    }
  },
};

registry.register(tool);
export default tool;
