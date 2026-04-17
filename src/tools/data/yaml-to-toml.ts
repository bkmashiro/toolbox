import { registry } from '../../core/registry';
import type { Tool } from '../../core/types';

const tool: Tool = {
  id: 'yaml-to-toml',
  name: 'YAML to TOML',
  description: 'Convert YAML to TOML format (via JSON intermediary).',
  category: 'data',
  tags: ['yaml', 'toml', 'convert', 'format', 'data'],
  inputs: [
    {
      id: 'yaml',
      label: 'YAML Input',
      type: 'textarea',
      placeholder: 'Paste YAML here...',
      rows: 12,
    },
  ],
  options: [],
  output: { type: 'text' },
  apiSupported: false,
  async run(inputs) {
    const raw = inputs.yaml as string;

    const yaml = await import('js-yaml');
    let parsed: unknown;
    try {
      parsed = yaml.load(raw);
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : String(e);
      return { type: 'text', data: `YAML parse error: ${msg}` };
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
