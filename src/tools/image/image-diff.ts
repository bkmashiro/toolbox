import { registry } from '../../core/registry';
import type { Tool } from '../../core/types';

const tool: Tool = {
  id: 'image-diff',
  name: 'Image Diff',
  description: 'Show pixel-level differences between two images with highlighted regions',
  category: 'image',
  tags: ['image', 'diff', 'compare', 'difference', 'pixel', 'visual'],
  inputs: [
    {
      id: 'imageA',
      label: 'Image A',
      type: 'file',
      accept: 'image/*',
    },
    {
      id: 'imageB',
      label: 'Image B',
      type: 'file',
      accept: 'image/*',
    },
  ],
  options: [
    {
      id: 'threshold',
      label: 'Difference Threshold (0-100)',
      type: 'range',
      default: 10,
      min: 0,
      max: 100,
      step: 1,
      helpText: 'Lower = more sensitive to differences',
    },
    {
      id: 'highlightColor',
      label: 'Highlight Color',
      type: 'color',
      default: '#ff0000',
    },
  ],
  output: {
    type: 'file',
    defaultFilename: 'diff.png',
    defaultMimeType: 'image/png',
  },
  apiSupported: false,

  async run(inputs, options, onProgress) {
    const fileA = inputs['imageA'] as File;
    const fileB = inputs['imageB'] as File;
    const threshold = ((options['threshold'] as number) / 100) * 441.67; // max euclidean distance
    const highlightColor = options['highlightColor'] as string;

    const [bitmapA, bitmapB] = await Promise.all([
      createImageBitmap(fileA),
      createImageBitmap(fileB),
    ]);

    const w = Math.max(bitmapA.width, bitmapB.width);
    const h = Math.max(bitmapA.height, bitmapB.height);

    const canvasA = document.createElement('canvas');
    canvasA.width = w; canvasA.height = h;
    const ctxA = canvasA.getContext('2d')!;
    ctxA.drawImage(bitmapA, 0, 0);
    bitmapA.close();

    const canvasB = document.createElement('canvas');
    canvasB.width = w; canvasB.height = h;
    const ctxB = canvasB.getContext('2d')!;
    ctxB.drawImage(bitmapB, 0, 0);
    bitmapB.close();

    onProgress?.(30, 'Comparing pixels...');

    const dataA = ctxA.getImageData(0, 0, w, h);
    const dataB = ctxB.getImageData(0, 0, w, h);

    const output = ctxA.createImageData(w, h);
    const outData = output.data;

    // Parse highlight color
    const hr = parseInt(highlightColor.slice(1, 3), 16);
    const hg = parseInt(highlightColor.slice(3, 5), 16);
    const hb = parseInt(highlightColor.slice(5, 7), 16);

    let diffPixels = 0;
    const total = w * h;

    for (let i = 0; i < total; i++) {
      const idx = i * 4;
      const rA = dataA.data[idx], gA = dataA.data[idx + 1], bA = dataA.data[idx + 2];
      const rB = dataB.data[idx], gB = dataB.data[idx + 1], bB = dataB.data[idx + 2];

      const dist = Math.sqrt((rA - rB) ** 2 + (gA - gB) ** 2 + (bA - bB) ** 2);

      if (dist > threshold) {
        outData[idx] = hr;
        outData[idx + 1] = hg;
        outData[idx + 2] = hb;
        outData[idx + 3] = 255;
        diffPixels++;
      } else {
        // Show original image A, dimmed
        outData[idx] = Math.round(rA * 0.5);
        outData[idx + 1] = Math.round(gA * 0.5);
        outData[idx + 2] = Math.round(bA * 0.5);
        outData[idx + 3] = dataA.data[idx + 3];
      }
    }

    onProgress?.(80, 'Rendering diff...');

    const outCanvas = document.createElement('canvas');
    outCanvas.width = w;
    outCanvas.height = h;
    outCanvas.getContext('2d')!.putImageData(output, 0, 0);

    const blob = await new Promise<Blob>((resolve, reject) => {
      outCanvas.toBlob(
        (b) => (b ? resolve(b) : reject(new Error('Diff render failed'))),
        'image/png'
      );
    });

    onProgress?.(100, 'Done');
    const pct = ((diffPixels / total) * 100).toFixed(2);

    return {
      type: 'file',
      data: blob,
      filename: 'diff.png',
      mimeType: 'image/png',
      summary: `${diffPixels.toLocaleString()} different pixels (${pct}%) out of ${total.toLocaleString()} total`,
    };
  },
};

registry.register(tool);
export default tool;
