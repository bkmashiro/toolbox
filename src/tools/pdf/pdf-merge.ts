import { registry } from '../../core/registry';
import type { Tool } from '../../core/types';
import { savePDFLib } from './pdf-utils';

const tool: Tool = {
  id: 'pdf-merge',
  name: 'Merge PDFs',
  description: 'Combine multiple PDF files into a single PDF',
  category: 'pdf',
  tags: ['pdf', 'merge', 'combine', 'join', 'concatenate'],
  inputs: [
    {
      id: 'pdfs',
      label: 'PDF Files',
      type: 'multifile',
      accept: 'application/pdf',
    },
  ],
  options: [],
  output: {
    type: 'file',
    defaultFilename: 'merged.pdf',
    defaultMimeType: 'application/pdf',
  },
  heavyDeps: ['pdf-lib'],
  apiSupported: false,

  async run(inputs, _options, onProgress) {
    const files = inputs['pdfs'] as File[];
    if (files.length < 2) throw new Error('Please provide at least 2 PDF files');

    const { PDFDocument } = await import('pdf-lib');
    const merged = await PDFDocument.create();

    for (let i = 0; i < files.length; i++) {
      onProgress?.(Math.round((i / files.length) * 90), `Merging ${files[i].name}...`);
      const buffer = await files[i].arrayBuffer();
      const doc = await PDFDocument.load(buffer);
      const pages = await merged.copyPages(doc, doc.getPageIndices());
      for (const page of pages) {
        merged.addPage(page);
      }
    }

    onProgress?.(95, 'Saving...');
    const blob = await savePDFLib(merged);
    onProgress?.(100, 'Done');

    return {
      type: 'file',
      data: blob,
      filename: 'merged.pdf',
      mimeType: 'application/pdf',
      summary: `Merged ${files.length} PDFs (${merged.getPageCount()} pages total)`,
    };
  },
};

registry.register(tool);
export default tool;
