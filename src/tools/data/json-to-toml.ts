import { registry } from '../../core/registry';
import type { Tool } from '../../core/types';

const tool: Tool = {
  id: 'json-to-toml',
  name: 'JSON to TOML',
  description: 'Convert JSON to TOML format.',
  category: 'data',
  tags: ['json', 'toml', 'convert', 'format', 'data'],
  inputs: [
    {
      id: 'json',
      label: 'JSON Input',
      type: 'textarea',
      placeholder: 'Paste JSON here...',
      rows: 12,
    },
  ],
  options: [],
  output: { type: 'text' },
  apiSupported: true,
  async run(inputs) {
    const raw = inputs.json as string;

    let parsed: unknown;
    try {
      parsed = JSON.parse(raw);
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : String(e);
      return { type: 'text', data: `Parse error: ${msg}` };
    }

    const TOML = await import('@iarna/toml');
    try {
      const result = TOML.stringify(parsed as Parameters<typeof TOML.stringify>[0]);
      return { type: 'text', data: result };
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : String(e);
      return { type: 'text', data: `TOML conversion error: ${msg}` };
    }
  },
};

registry.register(tool);
export default tool;
