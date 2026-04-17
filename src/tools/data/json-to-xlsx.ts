import { registry } from '../../core/registry';
import type { Tool } from '../../core/types';

const XLSX_MIME = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';

const tool: Tool = {
  id: 'json-to-xlsx',
  name: 'JSON to XLSX',
  description: 'Convert a JSON array of objects to an Excel spreadsheet (.xlsx).',
  category: 'data',
  tags: ['json', 'xlsx', 'excel', 'spreadsheet', 'convert', 'data'],
  inputs: [
    {
      id: 'text',
      label: 'JSON Input',
      type: 'textarea',
      placeholder: '[{"name": "Alice", "age": 30}, ...]',
      rows: 12,
    },
  ],
  options: [
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
      return { type: 'text', data: 'Error: No JSON input provided.' };
    }

    let parsed: unknown;
    try {
      parsed = JSON.parse(raw);
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : String(e);
      return { type: 'text', data: `Parse error: ${msg}` };
    }

    onProgress?.(30, 'Building worksheet…');
    const rows = Array.isArray(parsed) ? parsed : [parsed];
    const ws = XLSX.utils.json_to_sheet(rows as object[]);

    const sheetName = ((options.sheetName as string) || 'Sheet1').slice(0, 31);
    const outputName = ((options.filename as string) || 'output').replace(/\.xlsx$/i, '');

    onProgress?.(60, 'Writing workbook…');
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, sheetName);

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
