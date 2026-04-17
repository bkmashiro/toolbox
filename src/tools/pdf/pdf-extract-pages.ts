import { registry } from '../../core/registry';
import type { Tool } from '../../core/types';
import { loadPDFLib, parsePageRange, savePDFLib } from './pdf-utils';

const tool: Tool = {
  id: 'pdf-extract-pages',
  name: 'Extract Pages',
  description: 'Extract specific pages from a PDF into a new document',
  category: 'pdf',
  tags: ['pdf', 'extract', 'pages', 'select', 'range'],
  inputs: [
    {
      id: 'pdf',
      label: 'PDF File',
      type: 'file',
      accept: 'application/pdf',
    },
  ],
  options: [
    {
      id: 'pages',
      label: 'Pages to Extract',
      type: 'text',
      default: '',
      placeholder: 'e.g. 1, 3, 5-8',
      helpText: 'Comma-separated page numbers or ranges. Leave blank for all pages.',
    },
  ],
  output: {
    type: 'file',
    defaultFilename: 'extracted.pdf',
    defaultMimeType: 'application/pdf',
  },
  heavyDeps: ['pdf-lib'],
  apiSupported: false,

  async run(inputs, options, onProgress) {
    const file = inputs['pdf'] as File;
    const pagesStr = (options['pages'] as string).trim();

    onProgress?.(10, 'Loading PDF...');
    const { PDFDocument } = await import('pdf-lib');

    const srcDoc = await loadPDFLib(file);
    const total = srcDoc.getPageCount();
    const pageIndices = parsePageRange(pagesStr, total);

    if (pageIndices.length === 0) throw new Error('No valid pages specified');

    onProgress?.(40, 'Extracting pages...');
    const newDoc = await PDFDocument.create();
    const pages = await newDoc.copyPages(srcDoc, pageIndices);
    for (const page of pages) {
      newDoc.addPage(page);
    }

    onProgress?.(90, 'Saving...');
    const blob = await savePDFLib(newDoc);
    onProgress?.(100, 'Done');

    const baseName = file.name.replace(/\.pdf$/i, '');
    return {
      type: 'file',
      data: blob,
      filename: `${baseName}-extracted.pdf`,
      mimeType: 'application/pdf',
      summary: `Extracted ${pageIndices.length} page(s) from ${total}-page document`,
    };
  },
};

registry.register(tool);
export default tool;
