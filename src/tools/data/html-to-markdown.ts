import { registry } from '../../core/registry';
import type { Tool } from '../../core/types';

const tool: Tool = {
  id: 'html-to-markdown',
  name: 'HTML to Markdown',
  description: 'Convert HTML to Markdown using Turndown.',
  category: 'data',
  tags: ['html', 'markdown', 'convert', 'md', 'data'],
  inputs: [
    {
      id: 'html',
      label: 'HTML Input',
      type: 'textarea',
      placeholder: '<h1>Hello</h1><p>This is <strong>bold</strong>.</p>',
      rows: 12,
    },
  ],
  options: [
    {
      id: 'headingStyle',
      label: 'Heading Style',
      type: 'select',
      default: 'atx',
      options: [
        { label: 'ATX (# Heading)', value: 'atx' },
        { label: 'Setext (underline)', value: 'setext' },
      ],
    },
    {
      id: 'bulletListMarker',
      label: 'Bullet List Marker',
      type: 'select',
      default: '-',
      options: [
        { label: 'Hyphen (-)', value: '-' },
        { label: 'Asterisk (*)', value: '*' },
        { label: 'Plus (+)', value: '+' },
      ],
    },
    {
      id: 'codeBlockStyle',
      label: 'Code Block Style',
      type: 'select',
      default: 'fenced',
      options: [
        { label: 'Fenced (```)', value: 'fenced' },
        { label: 'Indented (4 spaces)', value: 'indented' },
      ],
    },
  ],
  output: { type: 'text' },
  apiSupported: false,
  async run(inputs, options) {
    const html = inputs.html as string;
    const headingStyle = options.headingStyle as 'atx' | 'setext';
    const bulletListMarker = options.bulletListMarker as '-' | '*' | '+';
    const codeBlockStyle = options.codeBlockStyle as 'fenced' | 'indented';

    const TurndownService = (await import('turndown')).default;
    const td = new TurndownService({
      headingStyle,
      bulletListMarker,
      codeBlockStyle,
    });

    try {
      const markdown = td.turndown(html);
      return { type: 'text', data: markdown };
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : String(e);
      return { type: 'text', data: `Conversion error: ${msg}` };
    }
  },
};

registry.register(tool);
export default tool;
