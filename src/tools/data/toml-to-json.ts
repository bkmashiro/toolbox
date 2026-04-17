import { registry } from '../../core/registry';
import type { Tool } from '../../core/types';

const tool: Tool = {
  id: 'toml-to-json',
  name: 'TOML to JSON',
  description: 'Convert TOML to JSON format.',
  category: 'data',
  tags: ['toml', 'json', 'convert', 'format', 'data'],
  inputs: [
    {
      id: 'toml',
      label: 'TOML Input',
      type: 'textarea',
      placeholder: 'Paste TOML here...',
      rows: 12,
    },
  ],
  options: [
    {
      id: 'indent',
      label: 'JSON Indentation',
      type: 'select',
      default: '2',
      options: [
        { label: '2 spaces', value: '2' },
        { label: '4 spaces', value: '4' },
        { label: 'Tab', value: 'tab' },
        { label: 'Minified', value: '0' },
      ],
    },
  ],
  output: { type: 'text' },
  apiSupported: false,
  async run(inputs, options) {
    const raw = inputs.toml as string;
    const indentOpt = options.indent as string;

    const TOML = await import('@iarna/toml');
    let parsed: unknown;
    try {
      parsed = TOML.parse(raw);
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : String(e);
      return { type: 'text', data: `TOML parse error: ${msg}` };
    }

    const indent = indentOpt === 'tab' ? '\t' : parseInt(indentOpt, 10);
    const space = indent === 0 ? undefined : indent;
    return { type: 'text', data: JSON.stringify(parsed, null, space) };
  },
};

registry.register(tool);
export default tool;
