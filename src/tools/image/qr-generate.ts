import { registry } from '../../core/registry';
import type { Tool } from '../../core/types';

const tool: Tool = {
  id: 'qr-generate',
  name: 'QR Generator',
  description: 'Generate QR code from text or URL as a downloadable PNG image',
  category: 'image',
  tags: ['qr', 'qrcode', 'generate', 'barcode', 'url', 'text', 'image'],
  inputs: [
    {
      id: 'content',
      label: 'Content (URL or text)',
      type: 'textarea',
      placeholder: 'https://example.com',
      rows: 3,
    },
  ],
  options: [
    {
      id: 'size',
      label: 'Size (px)',
      type: 'range',
      default: 256,
      min: 128,
      max: 1024,
      step: 8,
    },
    {
      id: 'errorCorrection',
      label: 'Error Correction',
      type: 'select',
      default: 'M',
      options: [
        { label: 'L (7%)', value: 'L' },
        { label: 'M (15%)', value: 'M' },
        { label: 'Q (25%)', value: 'Q' },
        { label: 'H (30%)', value: 'H' },
      ],
    },
    {
      id: 'margin',
      label: 'Margin (modules)',
      type: 'range',
      default: 4,
      min: 0,
      max: 10,
      step: 1,
    },
    {
      id: 'fgColor',
      label: 'Foreground Color',
      type: 'color',
      default: '#000000',
    },
    {
      id: 'bgColor',
      label: 'Background Color',
      type: 'color',
      default: '#ffffff',
    },
  ],
  output: {
    type: 'file',
    defaultFilename: 'qrcode.png',
    defaultMimeType: 'image/png',
  },
  heavyDeps: ['qrcode'],
  apiSupported: true,

  async run(inputs, options) {
    const content = inputs['content'] as string;
    if (!content.trim()) throw new Error('Content is required');

    const size = options['size'] as number;
    const errorCorrectionLevel = options['errorCorrection'] as 'L' | 'M' | 'Q' | 'H';
    const margin = options['margin'] as number;
    const color = { dark: options['fgColor'] as string, light: options['bgColor'] as string };

    const QRCode = await import('qrcode');

    const canvas = document.createElement('canvas');
    await QRCode.toCanvas(canvas, content, {
      width: size,
      margin,
      errorCorrectionLevel,
      color,
    });

    const blob = await new Promise<Blob>((resolve, reject) => {
      canvas.toBlob(
        (b) => (b ? resolve(b) : reject(new Error('QR generation failed'))),
        'image/png'
      );
    });

    return {
      type: 'file',
      data: blob,
      filename: 'qrcode.png',
      mimeType: 'image/png',
    };
  },
};

registry.register(tool);
export default tool;
