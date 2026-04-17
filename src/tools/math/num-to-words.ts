import { registry } from '../../core/registry';
import type { Tool } from '../../core/types';

const ones = ['', 'one', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight', 'nine',
  'ten', 'eleven', 'twelve', 'thirteen', 'fourteen', 'fifteen', 'sixteen', 'seventeen', 'eighteen', 'nineteen'];
const tens = ['', '', 'twenty', 'thirty', 'forty', 'fifty', 'sixty', 'seventy', 'eighty', 'ninety'];

function toWords(n: number): string {
  if (n < 0) return 'negative ' + toWords(-n);
  if (n === 0) return 'zero';
  if (n < 20) return ones[n];
  if (n < 100) return tens[Math.floor(n / 10)] + (n % 10 ? '-' + ones[n % 10] : '');
  if (n < 1000) return ones[Math.floor(n / 100)] + ' hundred' + (n % 100 ? ' ' + toWords(n % 100) : '');
  if (n < 1000000) return toWords(Math.floor(n / 1000)) + ' thousand' + (n % 1000 ? ' ' + toWords(n % 1000) : '');
  if (n < 1000000000) return toWords(Math.floor(n / 1000000)) + ' million' + (n % 1000000 ? ' ' + toWords(n % 1000000) : '');
  return toWords(Math.floor(n / 1000000000)) + ' billion' + (n % 1000000000 ? ' ' + toWords(n % 1000000000) : '');
}

const ZH_DIGITS = ['零', '一', '二', '三', '四', '五', '六', '七', '八', '九'];
const ZH_UNITS = ['', '十', '百', '千', '万', '十', '百', '千', '亿'];

function toWordsZh(n: number): string {
  if (n < 0) return '负' + toWordsZh(-n);
  if (n === 0) return '零';
  const s = String(Math.floor(n));
  const digits = s.split('').map(Number);
  let result = '';
  const len = digits.length;
  for (let i = 0; i < len; i++) {
    const d = digits[i];
    const unitIdx = len - 1 - i;
    if (d !== 0) {
      result += ZH_DIGITS[d] + ZH_UNITS[unitIdx];
    } else if (result && !result.endsWith('零') && i < len - 1) {
      result += '零';
    }
  }
  return result.replace(/零+$/, '');
}

const tool: Tool = {
  id: 'num-to-words',
  name: 'Number to Words',
  description: 'Convert numbers to their written word equivalents (English and Chinese)',
  category: 'math',
  tags: ['number', 'words', 'convert', 'english', 'chinese', 'spell', 'text', 'cardinal'],
  inputs: [
    {
      id: 'number',
      label: 'Number',
      type: 'text',
      placeholder: 'e.g. 123456',
      required: true,
    },
  ],
  options: [
    {
      id: 'lang',
      label: 'Language',
      type: 'select',
      default: 'en',
      options: [
        { label: 'English', value: 'en' },
        { label: 'Chinese (中文)', value: 'zh' },
      ],
    },
  ],
  output: { type: 'text' },
  apiSupported: false,

  async run(inputs, options) {
    const raw = (inputs.number as string).trim();
    const n = parseFloat(raw);
    if (isNaN(n)) throw new Error('Invalid number: ' + raw);
    if (!Number.isInteger(n)) throw new Error('Only integers are supported');
    if (Math.abs(n) > 999999999999) throw new Error('Number too large (max ±999,999,999,999)');

    const lang = (options.lang as string) || 'en';
    const words = lang === 'zh' ? toWordsZh(n) : toWords(n);

    return {
      type: 'text',
      data: words,
      summary: `${n} → "${words}"`,
    };
  },
};

registry.register(tool);
export default tool;
