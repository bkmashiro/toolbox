import { registry } from '../../core/registry';
import type { Tool } from '../../core/types';
import { savePDFLib } from './pdf-utils';

const PAGE_SIZES: Record<string, [number, number]> = {
  a4: [595.28, 841.89],
  letter: [612, 792],
};

const tool: Tool = {
  id: 'images-to-pdf',
  name: 'Images to PDF',
  description: 'Combine multiple images into a single PDF document',
  category: 'pdf',
  tags: ['pdf', 'image', 'combine', 'convert', 'jpg', 'png', 'merge'],
  inputs: [
    {
      id: 'images',
      label: 'Images',
      type: 'multifile',
      accept: 'image/*',
    },
  ],
  options: [
    {
      id: 'pageSize',
      label: 'Page Size',
      type: 'select',
      default: 'fit',
      options: [
        { label: 'Fit to Image', value: 'fit' },
        { label: 'A4', value: 'a4' },
        { label: 'Letter', value: 'letter' },
      ],
    },
    {
      id: 'fitMode',
      label: 'Fit Mode',
      type: 'select',
      default: 'fit',
      options: [
        { label: 'Fit (preserve ratio)', value: 'fit' },
        { label: 'Fill (crop to fill)', value: 'fill' },
        { label: 'Actual size', value: 'actual' },
      ],
      showWhen: { optionId: 'pageSize', value: 'a4' },
    },
    {
      id: 'orientation',
      label: 'Orientation',
      type: 'select',
      default: 'portrait',
      options: [
        { label: 'Portrait', value: 'portrait' },
        { label: 'Landscape', value: 'landscape' },
        { label: 'Auto (per image)', value: 'auto' },
      ],
      showWhen: { optionId: 'pageSize', value: 'a4' },
    },
    {
      id: 'margin',
      label: 'Margin (pt, 0 = none)',
      type: 'range',
      default: 0,
      min: 0,
      max: 144, // ~5cm
      step: 4,
    },
  ],
  output: {
    type: 'file',
    defaultFilename: 'combined.pdf',
    defaultMimeType: 'application/pdf',
  },
  heavyDeps: ['pdf-lib'],
  apiSupported: false,

  async run(inputs, options, onProgress) {
    const files = inputs['images'] as File[];
    if (files.length === 0) throw new Error('No images provided');

    const pageSize = options['pageSize'] as string;
    const fitMode = options['fitMode'] as string;
    const orientation = options['orientation'] as string;
    const margin = options['margin'] as number;

    const { PDFDocument } = await import('pdf-lib');
    const doc = await PDFDocument.create();

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      onProgress?.(Math.round((i / files.length) * 90), `Adding ${file.name}...`);

      const buffer = await file.arrayBuffer();
      let pdfImage;
      const type = file.type.toLowerCase();
      if (type === 'image/jpeg' || type === 'image/jpg') {
        pdfImage = await doc.embedJpg(buffer);
      } else if (type === 'image/png') {
        pdfImage = await doc.embedPng(buffer);
      } else {
        // Convert to PNG via canvas
        const blob = file;
        const bitmap = await createImageBitmap(blob);
        const canvas = document.createElement('canvas');
        canvas.width = bitmap.width;
        canvas.height = bitmap.height;
        canvas.getContext('2d')!.drawImage(bitmap, 0, 0);
        bitmap.close();
        const pngBlob = await new Promise<Blob>((res, rej) =>
          canvas.toBlob((b) => (b ? res(b) : rej(new Error('conversion failed'))), 'image/png')
        );
        pdfImage = await doc.embedPng(await pngBlob.arrayBuffer());
      }

      const imgW = pdfImage.width;
      const imgH = pdfImage.height;

      let pageW: number, pageH: number;

      if (pageSize === 'fit') {
        pageW = imgW + margin * 2;
        pageH = imgH + margin * 2;
      } else {
        const base = PAGE_SIZES[pageSize] ?? PAGE_SIZES['a4'];
        let orient = orientation;
        if (orient === 'auto') {
          orient = imgW > imgH ? 'landscape' : 'portrait';
        }
        pageW = orient === 'landscape' ? base[1] : base[0];
        pageH = orient === 'landscape' ? base[0] : base[1];
      }

      const page = doc.addPage([pageW, pageH]);
      const drawArea = { x: margin, y: margin, w: pageW - margin * 2, h: pageH - margin * 2 };

      let drawW = imgW, drawH = imgH, drawX = drawArea.x, drawY = drawArea.y;

      if (fitMode === 'fit' || pageSize !== 'fit') {
        const scaleX = drawArea.w / imgW;
        const scaleY = drawArea.h / imgH;
        const scale = Math.min(scaleX, scaleY);
        drawW = imgW * scale;
        drawH = imgH * scale;
        drawX = drawArea.x + (drawArea.w - drawW) / 2;
        drawY = drawArea.y + (drawArea.h - drawH) / 2;
      } else if (fitMode === 'actual') {
        drawW = Math.min(imgW, drawArea.w);
        drawH = Math.min(imgH, drawArea.h);
      }

      page.drawImage(pdfImage, { x: drawX, y: drawY, width: drawW, height: drawH });
    }

    onProgress?.(95, 'Saving PDF...');
    const blob = await savePDFLib(doc);
    onProgress?.(100, 'Done');

    return {
      type: 'file',
      data: blob,
      filename: 'combined.pdf',
      mimeType: 'application/pdf',
      summary: `Combined ${files.length} images into ${doc.getPageCount()}-page PDF`,
    };
  },
};

registry.register(tool);
export default tool;
