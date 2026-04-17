import { registry } from '../../core/registry';
import type { Tool } from '../../core/types';

const tool: Tool = {
  id: 'json-to-yaml',
  name: 'JSON to YAML',
  description: 'Convert JSON to YAML format.',
  category: 'data',
  tags: ['json', 'yaml', 'convert', 'format', 'data'],
  inputs: [
    {
      id: 'json',
      label: 'JSON Input',
      type: 'textarea',
      placeholder: 'Paste JSON here...',
      rows: 12,
    },
  ],
  options: [
    {
      id: 'indent',
      label: 'Indentation',
      type: 'number',
      default: 2,
      min: 1,
      max: 8,
    },
  ],
  output: { type: 'text' },
  apiSupported: true,
  async run(inputs, options) {
    const raw = inputs.json as string;
    const indent = options.indent as number;

    let parsed: unknown;
    try {
      parsed = JSON.parse(raw);
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : String(e);
      return { type: 'text', data: `Parse error: ${msg}` };
    }

    const yaml = await import('js-yaml');
    const result = yaml.dump(parsed, { indent });
    return { type: 'text', data: result };
  },
};

registry.register(tool);
export default tool;
