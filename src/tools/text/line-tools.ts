import { registry } from '../../core/registry';
import type { Tool } from '../../core/types';

function shuffleArray<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

const tool: Tool = {
  id: 'line-tools',
  name: 'Line Tools',
  description:
    'Sort, deduplicate, reverse, trim, and add/remove prefix/suffix from lines of text.',
  category: 'text',
  tags: ['lines', 'sort', 'deduplicate', 'reverse', 'trim', 'prefix', 'suffix', 'text'],
  inputs: [
    {
      id: 'text',
      label: 'Text (one item per line)',
      type: 'textarea',
      placeholder: 'Line 1\nLine 2\nLine 3...',
      rows: 10,
    },
  ],
  options: [
    {
      id: 'sort',
      label: 'Sort lines',
      type: 'select',
      default: 'none',
      options: [
        { label: 'No sorting', value: 'none' },
        { label: 'Alphabetical (A → Z)', value: 'alpha-asc' },
        { label: 'Alphabetical (Z → A)', value: 'alpha-desc' },
        { label: 'By length (short → long)', value: 'len-asc' },
        { label: 'By length (long → short)', value: 'len-desc' },
        { label: 'Random / shuffle', value: 'random' },
      ],
    },
    {
      id: 'deduplicate',
      label: 'Remove duplicate lines',
      type: 'checkbox',
      default: false,
    },
    {
      id: 'reverse',
      label: 'Reverse line order',
      type: 'checkbox',
      default: false,
    },
    {
      id: 'trim',
      label: 'Trim whitespace from each line',
      type: 'checkbox',
      default: false,
    },
    {
      id: 'removeEmpty',
      label: 'Remove empty lines',
      type: 'checkbox',
      default: false,
    },
    {
      id: 'prefix',
      label: 'Add prefix to each line',
      type: 'text',
      default: '',
      placeholder: 'e.g. // or > ',
    },
    {
      id: 'suffix',
      label: 'Add suffix to each line',
      type: 'text',
      default: '',
      placeholder: 'e.g. , or ;',
    },
    {
      id: 'removePrefix',
      label: 'Remove prefix from each line',
      type: 'text',
      default: '',
      placeholder: 'Prefix to remove',
    },
    {
      id: 'removeSuffix',
      label: 'Remove suffix from each line',
      type: 'text',
      default: '',
      placeholder: 'Suffix to remove',
    },
  ],
  output: { type: 'text' },
  apiSupported: false,
  async run(inputs, options) {
    const rawText = inputs.text as string;
    const sortMode = options.sort as string;
    const deduplicate = options.deduplicate as boolean;
    const reverse = options.reverse as boolean;
    const trim = options.trim as boolean;
    const removeEmpty = options.removeEmpty as boolean;
    const prefix = options.prefix as string;
    const suffix = options.suffix as string;
    const removePrefix = options.removePrefix as string;
    const removeSuffix = options.removeSuffix as string;

    let lines = rawText.split('\n');

    if (trim) lines = lines.map(l => l.trim());
    if (removeEmpty) lines = lines.filter(l => l.trim() !== '');
    if (removePrefix) lines = lines.map(l => (l.startsWith(removePrefix) ? l.slice(removePrefix.length) : l));
    if (removeSuffix) lines = lines.map(l => (l.endsWith(removeSuffix) ? l.slice(0, -removeSuffix.length) : l));
    if (deduplicate) lines = [...new Set(lines)];

    if (sortMode === 'alpha-asc') lines = [...lines].sort((a, b) => a.localeCompare(b));
    else if (sortMode === 'alpha-desc') lines = [...lines].sort((a, b) => b.localeCompare(a));
    else if (sortMode === 'len-asc') lines = [...lines].sort((a, b) => a.length - b.length);
    else if (sortMode === 'len-desc') lines = [...lines].sort((a, b) => b.length - a.length);
    else if (sortMode === 'random') lines = shuffleArray(lines);

    if (reverse) lines = [...lines].reverse();
    if (prefix) lines = lines.map(l => prefix + l);
    if (suffix) lines = lines.map(l => l + suffix);

    return {
      type: 'text',
      data: lines.join('\n'),
      summary: `${lines.length} lines`,
    };
  },
};

registry.register(tool);
export default tool;
