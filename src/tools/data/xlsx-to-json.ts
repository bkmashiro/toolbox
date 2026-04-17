import { registry } from '../../core/registry';
import type { Tool } from '../../core/types';

const tool: Tool = {
  id: 'xlsx-to-json',
  name: 'XLSX to JSON',
  description: 'Convert an Excel spreadsheet (.xlsx / .xls) to JSON.',
  category: 'data',
  tags: ['xlsx', 'xls', 'excel', 'spreadsheet', 'json', 'convert', 'data'],
  inputs: [
    {
      id: 'file',
      label: 'Excel File',
      type: 'file',
      accept: '.xlsx,.xls,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,application/vnd.ms-excel',
    },
  ],
  options: [
    {
      id: 'headers',
      label: 'First Row as Headers',
      type: 'checkbox',
      default: true,
      helpText: 'Use the first row as object keys in the JSON output.',
    },
    {
      id: 'sheet',
      label: 'Sheet Index (0-based)',
      type: 'number',
      default: 0,
      min: 0,
      helpText: 'Which sheet to read. 0 = first sheet.',
      advanced: true,
    },
    {
      id: 'indent',
      label: 'JSON Indent Spaces',
      type: 'number',
      default: 2,
      min: 0,
      max: 8,
      advanced: true,
    },
  ],
  output: {
    type: 'text',
    defaultFilename: 'output.json',
    defaultMimeType: 'application/json',
  },
  apiSupported: false,
  heavyDeps: ['xlsx'],
  async run(inputs, options, onProgress) {
    const XLSX = await import('xlsx');

    const file = inputs.file as File;
    if (!file) {
      return { type: 'text', data: 'Error: No file provided.' };
    }

    onProgress?.(20, 'Reading file…');
    const data = await file.arrayBuffer();

    onProgress?.(50, 'Parsing workbook…');
    const wb = XLSX.read(data, { type: 'array' });

    const sheetIndex = Math.max(0, (options.sheet as number) ?? 0);
    const sheetName = wb.SheetNames[sheetIndex] ?? wb.SheetNames[0];
    const ws = wb.Sheets[sheetName];

    const useHeaders = options.headers as boolean;
    const json = XLSX.utils.sheet_to_json(ws, {
      header: useHeaders ? undefined : 1,
      defval: null,
    });

    onProgress?.(90, 'Serialising…');
    const indent = (options.indent as number) ?? 2;
    const result = JSON.stringify(json, null, indent);

    onProgress?.(100, 'Done');

    return {
      type: 'text',
      data: result,
      summary: `${json.length} rows from sheet "${sheetName}"`,
    };
  },
};

registry.register(tool);
export default tool;
