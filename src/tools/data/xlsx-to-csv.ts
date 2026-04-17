import { registry } from '../../core/registry';
import type { Tool } from '../../core/types';

const tool: Tool = {
  id: 'xlsx-to-csv',
  name: 'XLSX to CSV',
  description: 'Convert an Excel spreadsheet (.xlsx / .xls) to CSV.',
  category: 'data',
  tags: ['xlsx', 'xls', 'excel', 'spreadsheet', 'csv', 'convert', 'data'],
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
      id: 'sheet',
      label: 'Sheet Index (0-based)',
      type: 'number',
      default: 0,
      min: 0,
      helpText: 'Which sheet to read. 0 = first sheet.',
      advanced: true,
    },
  ],
  output: {
    type: 'text',
    defaultFilename: 'output.csv',
    defaultMimeType: 'text/csv',
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

    onProgress?.(80, 'Converting to CSV…');
    const csv = XLSX.utils.sheet_to_csv(ws);

    onProgress?.(100, 'Done');

    return {
      type: 'text',
      data: csv,
      summary: `Converted sheet "${sheetName}" to CSV`,
    };
  },
};

registry.register(tool);
export default tool;
