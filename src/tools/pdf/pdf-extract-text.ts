import { registry } from '../../core/registry';
import type { Tool } from '../../core/types';
import { parsePageRange } from './pdf-utils';

const tool: Tool = {
  id: 'pdf-extract-text',
  name: 'PDF to Text',
  description: 'Extract all text content from a PDF document',
  category: 'pdf',
  tags: ['pdf', 'text', 'extract', 'content', 'ocr', 'copy'],
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
      label: 'Pages (blank = all)',
      type: 'text',
      default: '',
      placeholder: 'e.g. 1-5, 8',
    },
    {
      id: 'separator',
      label: 'Page Separator',
      type: 'select',
      default: 'pagebreak',
      options: [
        { label: 'Page break (\\f)', value: 'pagebreak' },
        { label: 'Double newline', value: 'doublenewline' },
        { label: 'None', value: 'none' },
        { label: 'Custom', value: 'custom' },
      ],
    },
    {
      id: 'customSeparator',
      label: 'Custom Separator',
      type: 'text',
      default: '---',
      placeholder: '---',
      showWhen: { optionId: 'separator', value: 'custom' },
    },
  ],
  output: {
    type: 'text',
  },
  heavyDeps: ['pdfjs-dist'],
  apiSupported: false,

  async run(inputs, options, onProgress) {
    const file = inputs['pdf'] as File;
    const pagesStr = (options['pages'] as string).trim();
    const separatorKey = options['separator'] as string;
    const customSep = (options['customSeparator'] as string) || '---';

    const separatorMap: Record<string, string> = {
      pagebreak: '\f',
      doublenewline: '\n\n',
      none: '',
      custom: customSep,
    };
    const separator = separatorMap[separatorKey] ?? '\f';

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

    const textParts: string[] = [];

    for (let i = 0; i < pageIndices.length; i++) {
      const pageNum = pageIndices[i] + 1;
      onProgress?.(
        5 + Math.round((i / pageIndices.length) * 90),
        `Extracting page ${pageNum}/${totalPages}...`
      );

      const page = await pdfDoc.getPage(pageNum);
      const content = await page.getTextContent();
      const pageText = content.items
        .map((item) => ('str' in item ? item.str : ''))
        .join(' ')
        .replace(/\s+/g, ' ')
        .trim();

      if (pageText) {
        textParts.push(pageText);
      }
    }

    onProgress?.(100, 'Done');

    const result = textParts.join(separator);
    return {
      type: 'text',
      data: result,
      summary: `Extracted text from ${pageIndices.length} page(s), ${result.length.toLocaleString()} characters`,
    };
  },
};

registry.register(tool);
export default tool;
