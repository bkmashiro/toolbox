import { registry } from '../../core/registry';
import type { Tool } from '../../core/types';
import { loadPDFLib, parsePageRange, savePDFLib } from './pdf-utils';

const tool: Tool = {
  id: 'pdf-split',
  name: 'Split PDF',
  description: 'Split a PDF by page ranges into multiple PDFs, packaged as a ZIP',
  category: 'pdf',
  tags: ['pdf', 'split', 'divide', 'pages', 'extract', 'range'],
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
      id: 'ranges',
      label: 'Page Ranges',
      type: 'text',
      default: '',
      placeholder: 'e.g. 1-3, 5, 7-9',
      helpText: 'Each range creates a separate PDF. Comma-separated. Leave blank for one page per file.',
    },
  ],
  output: {
    type: 'file',
    defaultFilename: 'split.zip',
    defaultMimeType: 'application/zip',
  },
  heavyDeps: ['pdf-lib'],
  apiSupported: false,

  async run(inputs, options, onProgress) {
    const file = inputs['pdf'] as File;
    const rangesStr = (options['ranges'] as string).trim();

    onProgress?.(10, 'Loading PDF...');
    const { PDFDocument } = await import('pdf-lib');
    const { zipSync } = await import('fflate');

    const srcDoc = await loadPDFLib(file);
    const totalPages = srcDoc.getPageCount();

    let splitGroups: number[][];

    if (!rangesStr) {
      // One page per file
      splitGroups = Array.from({ length: totalPages }, (_, i) => [i]);
    } else {
      // Parse each comma-separated segment as its own group
      const segments = rangesStr.split(',').map((s) => s.trim()).filter(Boolean);
      splitGroups = segments.map((seg) => parsePageRange(seg, totalPages));
    }

    const zipFiles: Record<string, Uint8Array> = {};
    const baseName = file.name.replace(/\.pdf$/i, '');

    for (let i = 0; i < splitGroups.length; i++) {
      const pageIndices = splitGroups[i];
      onProgress?.(10 + Math.round((i / splitGroups.length) * 80), `Creating part ${i + 1}/${splitGroups.length}...`);

      const newDoc = await PDFDocument.create();
      const pages = await newDoc.copyPages(srcDoc, pageIndices);
      for (const page of pages) {
        newDoc.addPage(page);
      }

      const bytes = await newDoc.save();
      const pageLabel = pageIndices.length === 1
        ? `p${pageIndices[0] + 1}`
        : `p${pageIndices[0] + 1}-${pageIndices[pageIndices.length - 1] + 1}`;
      zipFiles[`${baseName}-part${i + 1}-${pageLabel}.pdf`] = new Uint8Array(bytes);
    }

    onProgress?.(95, 'Zipping...');
    const zip = zipSync(zipFiles);
    onProgress?.(100, 'Done');

    return {
      type: 'file',
      data: new Blob([zip], { type: 'application/zip' }),
      filename: `${baseName}-split.zip`,
      mimeType: 'application/zip',
      summary: `Split into ${splitGroups.length} PDFs`,
    };
  },
};

registry.register(tool);
export default tool;
