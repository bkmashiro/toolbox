import { registry } from '../../core/registry';
import type { Tool } from '../../core/types';

const tool: Tool = {
  id: 'barcode-generate',
  name: 'Barcode Generator',
  description: 'Generate barcodes in various formats (Code128, EAN-13, UPC, etc.)',
  category: 'image',
  tags: ['barcode', 'code128', 'ean', 'upc', 'generate', 'image', 'scan'],
  inputs: [
    {
      id: 'content',
      label: 'Barcode Content',
      type: 'text',
      placeholder: 'Enter barcode content...',
    },
  ],
  options: [
    {
      id: 'format',
      label: 'Barcode Format',
      type: 'select',
      default: 'CODE128',
      options: [
        { label: 'Code 128', value: 'CODE128' },
        { label: 'EAN-13', value: 'EAN13' },
        { label: 'UPC-A', value: 'UPC' },
        { label: 'Code 39', value: 'CODE39' },
        { label: 'ITF-14', value: 'ITF14' },
        { label: 'MSI', value: 'MSI' },
        { label: 'Pharmacode', value: 'pharmacode' },
      ],
    },
    {
      id: 'width',
      label: 'Bar Width',
      type: 'range',
      default: 2,
      min: 1,
      max: 4,
      step: 1,
    },
    {
      id: 'height',
      label: 'Height (px)',
      type: 'range',
      default: 100,
      min: 50,
      max: 200,
      step: 10,
    },
    {
      id: 'displayValue',
      label: 'Display Value Below Barcode',
      type: 'checkbox',
      default: true,
    },
    {
      id: 'fontSize',
      label: 'Font Size',
      type: 'range',
      default: 16,
      min: 8,
      max: 32,
      step: 2,
    },
  ],
  output: {
    type: 'file',
    defaultFilename: 'barcode.png',
    defaultMimeType: 'image/png',
  },
  heavyDeps: ['jsbarcode'],
  apiSupported: false,

  async run(inputs, options) {
    const content = inputs['content'] as string;
    if (!content.trim()) throw new Error('Content is required');

    const format = options['format'] as string;
    const width = options['width'] as number;
    const height = options['height'] as number;
    const displayValue = options['displayValue'] as boolean;
    const fontSize = options['fontSize'] as number;

    const JsBarcode = (await import('jsbarcode')).default;

    const canvas = document.createElement('canvas');
    try {
      JsBarcode(canvas, content, {
        format,
        width,
        height,
        displayValue,
        fontSize,
        margin: 10,
      });
    } catch (e) {
      throw new Error(`Invalid content for ${format} barcode: ${(e as Error).message}`);
    }

    const blob = await new Promise<Blob>((resolve, reject) => {
      canvas.toBlob(
        (b) => (b ? resolve(b) : reject(new Error('Barcode generation failed'))),
        'image/png'
      );
    });

    return {
      type: 'file',
      data: blob,
      filename: `barcode-${format.toLowerCase()}.png`,
      mimeType: 'image/png',
    };
  },
};

registry.register(tool);
export default tool;
