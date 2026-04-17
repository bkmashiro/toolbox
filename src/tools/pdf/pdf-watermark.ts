import { registry } from '../../core/registry';
import type { Tool } from '../../core/types';
import { loadPDFLib, parsePageRange, savePDFLib } from './pdf-utils';

const tool: Tool = {
  id: 'pdf-watermark',
  name: 'PDF Watermark',
  description: 'Add a text watermark to all or specific pages of a PDF',
  category: 'pdf',
  tags: ['pdf', 'watermark', 'stamp', 'text', 'overlay', 'confidential'],
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
      id: 'text',
      label: 'Watermark Text',
      type: 'text',
      default: 'CONFIDENTIAL',
      placeholder: 'Watermark text',
    },
    {
      id: 'fontSize',
      label: 'Font Size (pt)',
      type: 'range',
      default: 48,
      min: 12,
      max: 120,
      step: 4,
    },
    {
      id: 'opacity',
      label: 'Opacity (0.05 - 1.0)',
      type: 'range',
      default: 0.2,
      min: 0.05,
      max: 1.0,
      step: 0.05,
    },
    {
      id: 'rotation',
      label: 'Rotation (degrees)',
      type: 'range',
      default: -45,
      min: -180,
      max: 180,
      step: 5,
    },
    {
      id: 'position',
      label: 'Position',
      type: 'select',
      default: 'center',
      options: [
        { label: 'Center', value: 'center' },
        { label: 'Diagonal (tiled)', value: 'diagonal' },
        { label: 'Top-left', value: 'topleft' },
        { label: 'Top-right', value: 'topright' },
        { label: 'Bottom-left', value: 'bottomleft' },
        { label: 'Bottom-right', value: 'bottomright' },
      ],
    },
    {
      id: 'pages',
      label: 'Pages (blank = all)',
      type: 'text',
      default: '',
      placeholder: 'e.g. 1-3, 5',
    },
  ],
  output: {
    type: 'file',
    defaultFilename: 'watermarked.pdf',
    defaultMimeType: 'application/pdf',
  },
  heavyDeps: ['pdf-lib'],
  apiSupported: false,

  async run(inputs, options, onProgress) {
    const file = inputs['pdf'] as File;
    const text = (options['text'] as string) || 'WATERMARK';
    const fontSize = options['fontSize'] as number;
    const opacity = options['opacity'] as number;
    const rotationDeg = options['rotation'] as number;
    const position = options['position'] as string;
    const pagesStr = (options['pages'] as string).trim();

    onProgress?.(10, 'Loading PDF...');
    const { degrees, rgb, StandardFonts } = await import('pdf-lib');

    const doc = await loadPDFLib(file);
    const total = doc.getPageCount();
    const pageIndices = parsePageRange(pagesStr, total);
    const font = await doc.embedFont(StandardFonts.HelveticaBold);

    for (let i = 0; i < pageIndices.length; i++) {
      const idx = pageIndices[i];
      onProgress?.(10 + Math.round((i / pageIndices.length) * 80), `Watermarking page ${idx + 1}...`);
      const page = doc.getPage(idx);
      const { width, height } = page.getSize();

      const textWidth = font.widthOfTextAtSize(text, fontSize);

      let x: number, y: number;
      switch (position) {
        case 'topleft':
          x = 20; y = height - 20 - fontSize; break;
        case 'topright':
          x = width - textWidth - 20; y = height - 20 - fontSize; break;
        case 'bottomleft':
          x = 20; y = 20; break;
        case 'bottomright':
          x = width - textWidth - 20; y = 20; break;
        case 'diagonal':
        case 'center':
        default:
          x = (width - textWidth) / 2;
          y = height / 2 - fontSize / 2;
      }

      if (position === 'diagonal') {
        // Tile diagonally
        const step = Math.max(150, textWidth + 40);
        for (let ty = -step; ty < height + step; ty += step) {
          for (let tx = -step; tx < width + step; tx += step) {
            page.drawText(text, {
              x: tx,
              y: ty,
              size: fontSize,
              font,
              color: rgb(0.5, 0.5, 0.5),
              opacity,
              rotate: degrees(rotationDeg),
            });
          }
        }
      } else {
        page.drawText(text, {
          x,
          y,
          size: fontSize,
          font,
          color: rgb(0.5, 0.5, 0.5),
          opacity,
          rotate: degrees(rotationDeg),
        });
      }
    }

    onProgress?.(95, 'Saving...');
    const blob = await savePDFLib(doc);
    onProgress?.(100, 'Done');

    const baseName = file.name.replace(/\.pdf$/i, '');
    return {
      type: 'file',
      data: blob,
      filename: `${baseName}-watermarked.pdf`,
      mimeType: 'application/pdf',
      summary: `Added "${text}" watermark to ${pageIndices.length} page(s)`,
    };
  },
};

registry.register(tool);
export default tool;
