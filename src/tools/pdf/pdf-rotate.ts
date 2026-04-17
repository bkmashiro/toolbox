import { registry } from '../../core/registry';
import type { Tool } from '../../core/types';
import { loadPDFLib, parsePageRange, savePDFLib } from './pdf-utils';

const tool: Tool = {
  id: 'pdf-rotate',
  name: 'Rotate PDF',
  description: 'Rotate all or specific pages in a PDF by 90, 180, or 270 degrees',
  category: 'pdf',
  tags: ['pdf', 'rotate', 'orientation', 'landscape', 'portrait'],
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
      id: 'rotation',
      label: 'Rotation',
      type: 'select',
      default: 90,
      options: [
        { label: '90° clockwise', value: 90 },
        { label: '180°', value: 180 },
        { label: '270° clockwise', value: 270 },
      ],
    },
    {
      id: 'pages',
      label: 'Pages (blank = all)',
      type: 'text',
      default: '',
      placeholder: 'e.g. 1, 3, 5-8',
    },
  ],
  output: {
    type: 'file',
    defaultFilename: 'rotated.pdf',
    defaultMimeType: 'application/pdf',
  },
  heavyDeps: ['pdf-lib'],
  apiSupported: false,

  async run(inputs, options, onProgress) {
    const file = inputs['pdf'] as File;
    const rotation = options['rotation'] as number;
    const pagesStr = (options['pages'] as string).trim();

    onProgress?.(10, 'Loading PDF...');
    const { degrees } = await import('pdf-lib');

    const doc = await loadPDFLib(file);
    const total = doc.getPageCount();
    const pageIndices = parsePageRange(pagesStr, total);

    onProgress?.(40, 'Rotating pages...');
    for (const idx of pageIndices) {
      const page = doc.getPage(idx);
      const currentRotation = page.getRotation().angle;
      page.setRotation(degrees((currentRotation + rotation) % 360));
    }

    onProgress?.(80, 'Saving...');
    const blob = await savePDFLib(doc);
    onProgress?.(100, 'Done');

    const baseName = file.name.replace(/\.pdf$/i, '');
    return {
      type: 'file',
      data: blob,
      filename: `${baseName}-rotated.pdf`,
      mimeType: 'application/pdf',
      summary: `Rotated ${pageIndices.length} page(s) by ${rotation}°`,
    };
  },
};

registry.register(tool);
export default tool;
