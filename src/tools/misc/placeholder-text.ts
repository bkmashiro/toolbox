import { registry } from '../../core/registry';
import type { Tool } from '../../core/types';
import { PLACEHOLDER_STYLES, generatePlaceholder } from './placeholder-text-data';

const tool: Tool = {
  id: 'placeholder-text',
  name: 'Placeholder Text',
  description: 'Generate placeholder text in various styles: classic Lorem Ipsum, Hipster, Corporate, Pirate, and Medieval',
  category: 'misc',
  tags: ['placeholder', 'lorem', 'ipsum', 'text', 'generate', 'dummy', 'hipster', 'pirate', 'corporate'],
  inputs: [],
  options: [
    {
      id: 'style',
      label: 'Style',
      type: 'select',
      default: 'lorem',
      options: PLACEHOLDER_STYLES.map(s => ({ label: s.label, value: s.id })),
    },
    {
      id: 'unit',
      label: 'Unit',
      type: 'select',
      default: 'paragraphs',
      options: [
        { label: 'Paragraphs', value: 'paragraphs' },
        { label: 'Sentences', value: 'sentences' },
        { label: 'Words', value: 'words' },
      ],
    },
    {
      id: 'count',
      label: 'Count',
      type: 'range',
      default: 3,
      min: 1,
      max: 20,
      step: 1,
    },
  ],
  output: { type: 'text' },
  apiSupported: false,

  async run(_inputs, options) {
    const style = options.style as string;
    const unit = options.unit as 'paragraphs' | 'sentences' | 'words';
    const count = options.count as number;

    const result = generatePlaceholder(style, unit, count);
    return { type: 'text', data: result };
  },
};

registry.register(tool);
export default tool;
