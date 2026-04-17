import { registry } from '../../core/registry';
import type { Tool } from '../../core/types';

const tool: Tool = {
  id: 'qr-decode',
  name: 'QR Decoder',
  description: 'Decode QR code from an image file to extract the text content',
  category: 'image',
  tags: ['qr', 'qrcode', 'decode', 'scan', 'read', 'barcode', 'image'],
  inputs: [
    {
      id: 'image',
      label: 'QR Code Image',
      type: 'file',
      accept: 'image/*',
    },
  ],
  options: [],
  output: {
    type: 'text',
  },
  heavyDeps: ['jsqr'],
  apiSupported: false,

  async run(inputs) {
    const file = inputs['image'] as File;
    const { default: jsQR } = await import('jsqr');

    const bitmap = await createImageBitmap(file);
    const canvas = document.createElement('canvas');
    canvas.width = bitmap.width;
    canvas.height = bitmap.height;
    const ctx = canvas.getContext('2d')!;
    ctx.drawImage(bitmap, 0, 0);
    bitmap.close();

    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const code = jsQR(imageData.data, imageData.width, imageData.height);

    if (!code) {
      throw new Error('No QR code found in image');
    }

    return {
      type: 'text',
      data: code.data,
      summary: `Decoded QR code: ${code.data.length} characters`,
    };
  },
};

registry.register(tool);
export default tool;
