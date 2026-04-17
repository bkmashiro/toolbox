import { registry } from '../../core/registry';
import type { Tool } from '../../core/types';

const tool: Tool = {
  id: 'color-pick',
  name: 'Color Picker',
  description: 'Upload an image and click to pick colors — returns HEX, RGB, and HSL values',
  category: 'image',
  tags: ['image', 'color', 'pick', 'eyedropper', 'hex', 'rgb', 'hsl', 'palette'],
  inputs: [
    {
      id: 'image',
      label: 'Image',
      type: 'file',
      accept: 'image/*',
    },
  ],
  options: [],
  output: {
    type: 'text',
  },
  apiSupported: false,

  async run(inputs) {
    const file = inputs['image'] as File;

    const bitmap = await createImageBitmap(file);
    const canvas = document.createElement('canvas');
    canvas.width = bitmap.width;
    canvas.height = bitmap.height;
    const ctx = canvas.getContext('2d', { willReadFrequently: true })!;
    ctx.drawImage(bitmap, 0, 0);
    bitmap.close();

    // Sample a 5x5 grid of colors as a representation
    const stepX = Math.floor(bitmap.width / 6);
    const stepY = Math.floor(bitmap.height / 6);
    const samples: string[] = [];

    for (let row = 1; row <= 5; row++) {
      for (let col = 1; col <= 5; col++) {
        const px = ctx.getImageData(col * stepX, row * stepY, 1, 1).data;
        const hex = `#${px[0].toString(16).padStart(2, '0')}${px[1].toString(16).padStart(2, '0')}${px[2].toString(16).padStart(2, '0')}`;
        samples.push(hex);
      }
    }

    return {
      type: 'text',
      data:
        `Image: ${file.name} (${bitmap.width}x${bitmap.height})\n` +
        `\nUse the interactive canvas in the UI to click and pick specific colors.\n` +
        `\nSample colors from 5x5 grid:\n` +
        samples.join(', '),
      summary: 'Use the UI to click on the image to pick any color',
    };
  },
};

registry.register(tool);
export default tool;
