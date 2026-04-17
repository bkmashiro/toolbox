import { registry } from '../../core/registry';
import type { Tool } from '../../core/types';

const tool: Tool = {
  id: 'json-to-csv',
  name: 'JSON to CSV',
  description: 'Convert a JSON array of objects to CSV format.',
  category: 'data',
  tags: ['json', 'csv', 'convert', 'spreadsheet', 'table', 'data'],
  inputs: [
    {
      id: 'json',
      label: 'JSON Array Input',
      type: 'textarea',
      placeholder: '[{"name": "Alice", "age": 30}, ...]',
      rows: 12,
    },
  ],
  options: [
    {
      id: 'delimiter',
      label: 'Delimiter',
      type: 'select',
      default: ',',
      options: [
        { label: 'Comma (,)', value: ',' },
        { label: 'Semicolon (;)', value: ';' },
        { label: 'Tab (\\t)', value: '\t' },
        { label: 'Pipe (|)', value: '|' },
      ],
    },
    {
      id: 'headers',
      label: 'Include Headers',
      type: 'checkbox',
      default: true,
    },
  ],
  output: {
    type: 'text',
    defaultFilename: 'output.csv',
    defaultMimeType: 'text/csv',
  },
  apiSupported: true,
  async run(inputs, options) {
    const raw = inputs.json as string;
    const delimiter = options.delimiter as string;
    const headers = options.headers as boolean;

    let parsed: unknown;
    try {
      parsed = JSON.parse(raw);
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : String(e);
      return { type: 'text', data: `Parse error: ${msg}` };
    }

    if (!Array.isArray(parsed)) {
      return { type: 'text', data: 'Error: Input must be a JSON array.' };
    }

    const Papa = await import('papaparse');
    const result = Papa.unparse(parsed as object[], {
      delimiter,
      header: headers,
    });
    return {
      type: 'text',
      data: result,
      summary: `${parsed.length} rows converted`,
    };
  },
};

registry.register(tool);
export default tool;
