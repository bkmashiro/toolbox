import { registry } from '../../core/registry';
import type { Tool } from '../../core/types';

const tool: Tool = {
  id: 'word-freq',
  name: 'Word Frequency Counter',
  description: 'Analyze text and display a ranked frequency table of the most common words',
  category: 'text',
  tags: ['word', 'frequency', 'count', 'text', 'analysis', 'stats', 'rank', 'common'],
  inputs: [
    {
      id: 'text',
      label: 'Text to analyze',
      type: 'textarea',
      placeholder: 'Paste your text here...',
      required: true,
      rows: 8,
    },
  ],
  options: [
    {
      id: 'top',
      label: 'Top N words',
      type: 'number',
      default: 20,
      min: 1,
      max: 200,
      step: 1,
    },
    {
      id: 'caseSensitive',
      label: 'Case sensitive',
      type: 'checkbox',
      default: false,
    },
  ],
  output: { type: 'text' },
  apiSupported: false,

  async run(inputs, options) {
    const text = inputs.text as string;
    const n = parseInt((options.top as string) || '20');
    const caseSensitive = options.caseSensitive as boolean;

    const words = (caseSensitive ? text : text.toLowerCase())
      .replace(/[^\w\s]/g, '').split(/\s+/).filter(Boolean);

    const freq: Record<string, number> = {};
    for (const w of words) freq[w] = (freq[w] || 0) + 1;

    const sorted = Object.entries(freq).sort((a, b) => b[1] - a[1]).slice(0, n);
    const maxCount = sorted[0]?.[1] ?? 1;

    const lines = sorted.map(([w, c], i) =>
      `${String(i + 1).padStart(3)}. ${w.padEnd(20)} ${String(c).padStart(5)}  ${'█'.repeat(Math.round(c / maxCount * 20))}`
    );

    return {
      type: 'text',
      data: [`Top ${n} words (${words.length} total):\n`, ...lines].join('\n'),
      summary: `${Object.keys(freq).length} unique words from ${words.length} total`,
    };
  },
};

registry.register(tool);
export default tool;
