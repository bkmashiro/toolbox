import { registry } from '../../core/registry';
import type { Tool } from '../../core/types';

const XLSX_MIME = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';

const tool: Tool = {
  id: 'csv-to-xlsx',
  name: 'CSV to XLSX',
  description: 'Convert CSV text to an Excel spreadsheet (.xlsx).',
  category: 'data',
  tags: ['csv', 'xlsx', 'excel', 'spreadsheet', 'convert', 'data'],
  inputs: [
    {
      id: 'text',
      label: 'CSV Input',
      type: 'textarea',
      placeholder: 'name,age\nAlice,30\nBob,25',
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
      id: 'sheetName',
      label: 'Sheet Name',
      type: 'text',
      default: 'Sheet1',
      placeholder: 'Sheet1',
    },
    {
      id: 'filename',
      label: 'Output Filename',
      type: 'text',
      default: 'output',
      placeholder: 'output',
      helpText: 'Name of the resulting .xlsx file (without extension)',
    },
  ],
  output: {
    type: 'file',
    defaultFilename: 'output.xlsx',
    defaultMimeType: XLSX_MIME,
  },
  apiSupported: false,
  heavyDeps: ['xlsx'],
  async run(inputs, options, onProgress) {
    const XLSX = await import('xlsx');

    const raw = inputs.text as string;
    if (!raw?.trim()) {
      return { type: 'text', data: 'Error: No CSV input provided.' };
    }

    const delimiter = (options.delimiter as string) || ',';
    const sheetName = ((options.sheetName as string) || 'Sheet1').slice(0, 31);
    const outputName = ((options.filename as string) || 'output').replace(/\.xlsx$/i, '');

    onProgress?.(30, 'Parsing CSV…');
    const rows = raw
      .split('\n')
      .filter((line) => line.trim() !== '')
      .map((line) => line.split(delimiter));

    onProgress?.(60, 'Building worksheet…');
    const ws = XLSX.utils.aoa_to_sheet(rows);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, sheetName);

    onProgress?.(85, 'Writing workbook…');
    const buf = XLSX.write(wb, { bookType: 'xlsx', type: 'array' }) as ArrayBuffer;
    const blob = new Blob([buf], { type: XLSX_MIME });

    onProgress?.(100, 'Done');

    return {
      type: 'file',
      data: blob,
      filename: `${outputName}.xlsx`,
      mimeType: XLSX_MIME,
      summary: `${rows.length} row${rows.length !== 1 ? 's' : ''} exported to ${outputName}.xlsx`,
    };
  },
};

registry.register(tool);
export default tool;
