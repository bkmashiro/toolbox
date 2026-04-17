import { registry } from '../../core/registry';
import type { Tool } from '../../core/types';

const tool: Tool = {
  id: 'csv-to-json',
  name: 'CSV to JSON',
  description: 'Convert CSV to JSON with delimiter options, header row detection, and type inference.',
  category: 'data',
  tags: ['csv', 'json', 'convert', 'table', 'spreadsheet', 'data'],
  inputs: [
    {
      id: 'csv',
      label: 'CSV Input',
      type: 'textarea',
      placeholder: 'Paste CSV here...',
      rows: 12,
    },
  ],
  options: [
    {
      id: 'delimiter',
      label: 'Delimiter',
      type: 'select',
      default: 'auto',
      options: [
        { label: 'Auto-detect', value: 'auto' },
        { label: 'Comma (,)', value: ',' },
        { label: 'Semicolon (;)', value: ';' },
        { label: 'Tab (\\t)', value: '\t' },
        { label: 'Pipe (|)', value: '|' },
      ],
    },
    {
      id: 'header',
      label: 'First row is header',
      type: 'checkbox',
      default: true,
    },
    {
      id: 'typeInference',
      label: 'Infer types (numbers, booleans)',
      type: 'checkbox',
      default: true,
    },
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
  ],
  output: { type: 'text' },
  apiSupported: false,
  async run(inputs, options) {
    const raw = inputs.csv as string;
    const delimiter = options.delimiter as string;
    const header = options.header as boolean;
    const typeInference = options.typeInference as boolean;
    const indentOpt = options.indent as string;

    const Papa = await import('papaparse');
    const result = Papa.parse(raw, {
      delimiter: delimiter === 'auto' ? undefined : delimiter,
      header,
      dynamicTyping: typeInference,
      skipEmptyLines: true,
    });

    if (result.errors && result.errors.length > 0) {
      const errs = result.errors.map(e => e.message).join('; ');
      return { type: 'text', data: `Parse errors: ${errs}` };
    }

    const indent = parseInt(indentOpt, 10);
    const space = indent === 0 ? undefined : indent;
    return {
      type: 'text',
      data: JSON.stringify(result.data, null, space),
      summary: `${(result.data as unknown[]).length} rows converted`,
    };
  },
};

registry.register(tool);
export default tool;
