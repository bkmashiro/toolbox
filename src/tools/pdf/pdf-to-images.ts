import { registry } from '../../core/registry';
import type { Tool } from '../../core/types';
import { parsePageRange, renderPageToCanvas } from './pdf-utils';

const tool: Tool = {
  id: 'pdf-to-images',
  name: 'PDF to Images',
  description: 'Render PDF pages as PNG or JPEG images at configurable DPI, packaged as a ZIP',
  category: 'pdf',
  tags: ['pdf', 'image', 'render', 'png', 'jpeg', 'screenshot', 'export', 'dpi'],
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
      id: 'dpi',
      label: 'DPI',
      type: 'select',
      default: 150,
      options: [
        { label: '72 DPI (screen)', value: 72 },
        { label: '150 DPI (default)', value: 150 },
        { label: '300 DPI (print)', value: 300 },
      ],
    },
    {
      id: 'format',
      label: 'Image Format',
      type: 'select',
      default: 'png',
      options: [
        { label: 'PNG', value: 'png' },
        { label: 'JPEG', value: 'jpeg' },
      ],
    },
    {
      id: 'pages',
      label: 'Pages (blank = all)',
      type: 'text',
      default: '',
      placeholder: 'e.g. 1-5, 8',
    },
  ],
  output: {
    type: 'file',
    defaultFilename: 'pdf-images.zip',
    defaultMimeType: 'application/zip',
  },
  heavyDeps: ['pdfjs-dist'],
  apiSupported: false,

  async run(inputs, options, onProgress) {
    const file = inputs['pdf'] as File;
    const dpi = options['dpi'] as number;
    const format = options['format'] as string;
    const pagesStr = (options['pages'] as string).trim();

    const scale = dpi / 72;
    const mime = format === 'jpeg' ? 'image/jpeg' : 'image/png';
    const ext = format === 'jpeg' ? 'jpg' : 'png';

    onProgress?.(5, 'Loading PDF engine...');

    const pdfjsLib = await import('pdfjs-dist');
    pdfjsLib.GlobalWorkerOptions.workerSrc = new URL(
      'pdfjs-dist/build/pdf.worker.mjs',
      import.meta.url
    ).toString();

    const buffer = await file.arrayBuffer();
    const pdfDoc = await pdfjsLib.getDocument({ data: buffer }).promise;
    const totalPages = pdfDoc.numPages;

    const pageIndices = parsePageRange(pagesStr, totalPages);
    const { zipSync } = await import('fflate');

    const zipFiles: Record<string, Uint8Array> = {};
    const baseName = file.name.replace(/\.pdf$/i, '');

    for (let i = 0; i < pageIndices.length; i++) {
      const pageNum = pageIndices[i] + 1;
      onProgress?.(
        5 + Math.round((i / pageIndices.length) * 85),
        `Rendering page ${pageNum}/${totalPages}...`
      );

      const page = await pdfDoc.getPage(pageNum);
      const canvas = await renderPageToCanvas(page, scale);

      const blob = await new Promise<Blob>((resolve, reject) => {
        canvas.toBlob(
          (b) => (b ? resolve(b) : reject(new Error(`Page ${pageNum} render failed`))),
          mime,
          0.92
        );
      });
      const buf = await blob.arrayBuffer();
      zipFiles[`${baseName}-page-${String(pageNum).padStart(4, '0')}.${ext}`] = new Uint8Array(buf);
    }

    onProgress?.(95, 'Zipping...');
    const zip = zipSync(zipFiles);
    onProgress?.(100, 'Done');

    return {
      type: 'file',
      data: new Blob([zip.buffer as ArrayBuffer], { type: 'application/zip' }),
      filename: `${baseName}-images.zip`,
      mimeType: 'application/zip',
      summary: `Rendered ${pageIndices.length} pages at ${dpi} DPI as ${format.toUpperCase()}`,
    };
  },
};

registry.register(tool);
export default tool;
