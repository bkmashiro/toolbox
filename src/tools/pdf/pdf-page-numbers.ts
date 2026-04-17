import { registry } from '../../core/registry';
import type { Tool } from '../../core/types';
import { loadPDFLib, savePDFLib } from './pdf-utils';

const tool: Tool = {
  id: 'pdf-page-numbers',
  name: 'PDF Page Numbers',
  description: 'Add page numbers to all pages of a PDF',
  category: 'pdf',
  tags: ['pdf', 'page numbers', 'numbering', 'footer', 'header'],
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
      id: 'position',
      label: 'Position',
      type: 'select',
      default: 'bottom-center',
      options: [
        { label: 'Bottom Center', value: 'bottom-center' },
        { label: 'Bottom Right', value: 'bottom-right' },
        { label: 'Bottom Left', value: 'bottom-left' },
        { label: 'Top Center', value: 'top-center' },
        { label: 'Top Right', value: 'top-right' },
        { label: 'Top Left', value: 'top-left' },
      ],
    },
    {
      id: 'format',
      label: 'Format',
      type: 'select',
      default: '{n}',
      options: [
        { label: '{n}', value: '{n}' },
        { label: '{n} / {total}', value: '{n}/{total}' },
        { label: 'Page {n}', value: 'Page {n}' },
        { label: 'Page {n} of {total}', value: 'Page {n} of {total}' },
      ],
    },
    {
      id: 'startNumber',
      label: 'Start Number',
      type: 'number',
      default: 1,
      min: 0,
      max: 9999,
    },
    {
      id: 'fontSize',
      label: 'Font Size (pt)',
      type: 'range',
      default: 12,
      min: 8,
      max: 24,
      step: 1,
    },
    {
      id: 'margin',
      label: 'Margin from edge (pt)',
      type: 'range',
      default: 30,
      min: 10,
      max: 100,
      step: 5,
    },
  ],
  output: {
    type: 'file',
    defaultFilename: 'numbered.pdf',
    defaultMimeType: 'application/pdf',
  },
  heavyDeps: ['pdf-lib'],
  apiSupported: false,

  async run(inputs, options, onProgress) {
    const file = inputs['pdf'] as File;
    const position = options['position'] as string;
    const format = options['format'] as string;
    const startNumber = options['startNumber'] as number;
    const fontSize = options['fontSize'] as number;
    const margin = options['margin'] as number;

    onProgress?.(10, 'Loading PDF...');
    const { rgb, StandardFonts } = await import('pdf-lib');

    const doc = await loadPDFLib(file);
    const totalPages = doc.getPageCount();
    const font = await doc.embedFont(StandardFonts.Helvetica);

    for (let i = 0; i < totalPages; i++) {
      onProgress?.(10 + Math.round((i / totalPages) * 80), `Numbering page ${i + 1}/${totalPages}...`);
      const page = doc.getPage(i);
      const { width, height } = page.getSize();
      const n = startNumber + i;
      const label = format
        .replace('{n}', String(n))
        .replace('{total}', String(totalPages + startNumber - 1));

      const textWidth = font.widthOfTextAtSize(label, fontSize);

      let x: number, y: number;
      const isTop = position.startsWith('top');
      y = isTop ? height - margin : margin - fontSize / 2;

      if (position.endsWith('center')) {
        x = (width - textWidth) / 2;
      } else if (position.endsWith('right')) {
        x = width - textWidth - margin;
      } else {
        x = margin;
      }

      page.drawText(label, {
        x,
        y,
        size: fontSize,
        font,
        color: rgb(0, 0, 0),
      });
    }

    onProgress?.(95, 'Saving...');
    const blob = await savePDFLib(doc);
    onProgress?.(100, 'Done');

    const baseName = file.name.replace(/\.pdf$/i, '');
    return {
      type: 'file',
      data: blob,
      filename: `${baseName}-numbered.pdf`,
      mimeType: 'application/pdf',
      summary: `Added page numbers to ${totalPages} pages`,
    };
  },
};

registry.register(tool);
export default tool;
