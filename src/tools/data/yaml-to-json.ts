import { registry } from '../../core/registry';
import type { Tool } from '../../core/types';

const tool: Tool = {
  id: 'yaml-to-json',
  name: 'YAML to JSON',
  description: 'Convert YAML to JSON format.',
  category: 'data',
  tags: ['yaml', 'json', 'convert', 'format', 'data'],
  inputs: [
    {
      id: 'yaml',
      label: 'YAML Input',
      type: 'textarea',
      placeholder: 'Paste YAML here...',
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
  apiSupported: true,
  async run(inputs, options) {
    const raw = inputs.yaml as string;
    const indentOpt = options.indent as string;

    const yaml = await import('js-yaml');
    let parsed: unknown;
    try {
      parsed = yaml.load(raw);
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : String(e);
      return { type: 'text', data: `Parse error: ${msg}` };
    }

    const indent = indentOpt === 'tab' ? '\t' : parseInt(indentOpt, 10);
    const space = indent === 0 ? undefined : indent;
    return { type: 'text', data: JSON.stringify(parsed, null, space) };
  },
};

registry.register(tool);
export default tool;
