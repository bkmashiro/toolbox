import { registry } from '../../core/registry';
import type { Tool } from '../../core/types';

const tool: Tool = {
  id: 'number-format',
  name: 'Number Format',
  description: 'Format numbers with thousand separators, decimal places, scientific notation, and locales',
  category: 'math',
  tags: ['number', 'format', 'thousand', 'separator', 'decimal', 'scientific', 'notation', 'locale', 'currency'],
  inputs: [
    {
      id: 'number',
      label: 'Number',
      type: 'text',
      placeholder: 'Enter a number (e.g. 1234567.89)',
    },
  ],
  options: [
    {
      id: 'format',
      label: 'Format',
      type: 'select',
      default: 'standard',
      options: [
        { label: 'Standard (1,234,567.89)', value: 'standard' },
        { label: 'Scientific (1.235e+6)', value: 'scientific' },
        { label: 'Engineering (1.235 × 10⁶)', value: 'engineering' },
        { label: 'Compact (1.2M)', value: 'compact' },
      ],
    },
    {
      id: 'locale',
      label: 'Locale',
      type: 'select',
      default: 'en-US',
      options: [
        { label: 'US (1,234,567.89)', value: 'en-US' },
        { label: 'EU German (1.234.567,89)', value: 'de-DE' },
        { label: 'Indian (12,34,567.89)', value: 'en-IN' },
        { label: 'Japanese (1,234,567.89)', value: 'ja-JP' },
        { label: 'French (1 234 567,89)', value: 'fr-FR' },
        { label: 'Chinese (1,234,567.89)', value: 'zh-CN' },
      ],
    },
    {
      id: 'decimals',
      label: 'Decimal Places',
      type: 'number',
      default: 2,
      min: 0,
      max: 20,
      step: 1,
    },
    {
      id: 'grouping',
      label: 'Use Grouping Separator',
      type: 'checkbox',
      default: true,
    },
  ],
  output: { type: 'text' },
  apiSupported: false,

  async run(inputs, options) {
    const raw = (inputs.number as string).trim();
    const n = parseFloat(raw);
    if (isNaN(n)) throw new Error('Please enter a valid number');

    const locale = options.locale as string;
    const decimals = options.decimals as number;
    const useGrouping = options.grouping as boolean;
    const format = options.format as string;

    let results: string[] = [];

    if (format === 'standard') {
      const formatted = n.toLocaleString(locale, {
        minimumFractionDigits: decimals,
        maximumFractionDigits: decimals,
        useGrouping,
      });
      results.push(`Standard: ${formatted}`);
    } else if (format === 'scientific') {
      results.push(`Scientific: ${n.toExponential(decimals)}`);
    } else if (format === 'engineering') {
      // Engineering notation: exponent is multiple of 3
      const exp = Math.floor(Math.log10(Math.abs(n)) / 3) * 3;
      const mantissa = n / Math.pow(10, exp);
      const superscripts = ['⁰','¹','²','³','⁴','⁵','⁶','⁷','⁸','⁹',];
      const expStr = exp < 0
        ? `⁻${Math.abs(exp).toString().split('').map(d => superscripts[+d]).join('')}`
        : exp.toString().split('').map(d => superscripts[+d]).join('');
      results.push(`Engineering: ${mantissa.toFixed(decimals)} × 10${expStr}`);
    } else if (format === 'compact') {
      const compact = n.toLocaleString(locale, { notation: 'compact', maximumFractionDigits: decimals } as Intl.NumberFormatOptions);
      results.push(`Compact: ${compact}`);
    }

    // Always show all formats for comparison
    const std = n.toLocaleString(locale, { minimumFractionDigits: decimals, maximumFractionDigits: decimals, useGrouping });
    const sci = n.toExponential(decimals);
    const cpt = n.toLocaleString(locale, { notation: 'compact', maximumFractionDigits: 2 } as Intl.NumberFormatOptions);

    const output = [
      `Input:       ${raw}`,
      `Numeric:     ${n}`,
      ``,
      `Standard:    ${std}`,
      `Scientific:  ${sci}`,
      `Compact:     ${cpt}`,
      ``,
      `Locale: ${locale}  |  Decimals: ${decimals}  |  Grouping: ${useGrouping ? 'yes' : 'no'}`,
    ].join('\n');

    return { type: 'text', data: output };
  },
};

registry.register(tool);
export default tool;
