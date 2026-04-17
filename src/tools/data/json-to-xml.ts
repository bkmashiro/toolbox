import { registry } from '../../core/registry';
import type { Tool } from '../../core/types';

const tool: Tool = {
  id: 'json-to-xml',
  name: 'JSON to XML',
  description: 'Convert JSON to XML format.',
  category: 'data',
  tags: ['json', 'xml', 'convert', 'format', 'data'],
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
      id: 'rootElement',
      label: 'Root Element Name',
      type: 'text',
      default: 'root',
      placeholder: 'root',
    },
    {
      id: 'indent',
      label: 'Indentation',
      type: 'select',
      default: '2',
      options: [
        { label: '2 spaces', value: '2' },
        { label: '4 spaces', value: '4' },
        { label: 'Tab', value: 'tab' },
      ],
    },
  ],
  output: { type: 'text' },
  apiSupported: true,
  async run(inputs, options) {
    const raw = inputs.json as string;
    const rootElement = (options.rootElement as string) || 'root';
    const indentOpt = options.indent as string;

    let parsed: unknown;
    try {
      parsed = JSON.parse(raw);
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : String(e);
      return { type: 'text', data: `Parse error: ${msg}` };
    }

    const { XMLBuilder } = await import('fast-xml-parser');
    const indentBy = indentOpt === 'tab' ? '\t' : ' '.repeat(parseInt(indentOpt, 10));

    const builder = new XMLBuilder({
      format: true,
      indentBy,
      ignoreAttributes: false,
      attributeNamePrefix: '@_',
    });

    // Wrap the JSON in a root element
    const wrapped = { [rootElement]: parsed };
    const xmlContent = builder.build(wrapped);
    const result = `<?xml version="1.0" encoding="UTF-8"?>\n${xmlContent}`;

    return { type: 'text', data: result };
  },
};

registry.register(tool);
export default tool;
