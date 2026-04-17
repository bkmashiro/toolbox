import { registry } from '../../core/registry';
import type { Tool } from '../../core/types';

const tool: Tool = {
  id: 'xml-to-json',
  name: 'XML to JSON',
  description: 'Convert XML to JSON format.',
  category: 'data',
  tags: ['xml', 'json', 'convert', 'format', 'data'],
  inputs: [
    {
      id: 'xml',
      label: 'XML Input',
      type: 'textarea',
      placeholder: 'Paste XML here...',
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
        { label: 'Minified', value: '0' },
      ],
    },
    {
      id: 'ignoreAttributes',
      label: 'Ignore attributes',
      type: 'checkbox',
      default: false,
    },
  ],
  output: { type: 'text' },
  apiSupported: false,
  async run(inputs, options) {
    const raw = inputs.xml as string;
    const indentOpt = options.indent as string;
    const ignoreAttributes = options.ignoreAttributes as boolean;

    const { XMLParser } = await import('fast-xml-parser');
    const parser = new XMLParser({
      ignoreAttributes,
      attributeNamePrefix: '@_',
      parseAttributeValue: true,
      parseTagValue: true,
    });

    let parsed: unknown;
    try {
      parsed = parser.parse(raw);
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : String(e);
      return { type: 'text', data: `XML parse error: ${msg}` };
    }

    const indent = parseInt(indentOpt, 10);
    const space = indent === 0 ? undefined : indent;
    return { type: 'text', data: JSON.stringify(parsed, null, space) };
  },
};

registry.register(tool);
export default tool;
