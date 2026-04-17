import { registry } from '../../core/registry';
import type { Tool } from '../../core/types';

interface Color {
  r: number;
  g: number;
  b: number;
}

function colorDistance(a: Color, b: Color): number {
  return Math.sqrt((a.r - b.r) ** 2 + (a.g - b.g) ** 2 + (a.b - b.b) ** 2);
}

function kMeans(pixels: Color[], k: number, iterations = 20): Color[] {
  // Init centroids by picking evenly-spaced pixels
  const step = Math.max(1, Math.floor(pixels.length / k));
  let centroids: Color[] = Array.from({ length: k }, (_, i) => ({ ...pixels[i * step % pixels.length] }));

  for (let iter = 0; iter < iterations; iter++) {
    const clusters: Color[][] = Array.from({ length: k }, () => []);

    for (const pixel of pixels) {
      let minDist = Infinity;
      let minIdx = 0;
      for (let i = 0; i < k; i++) {
        const d = colorDistance(pixel, centroids[i]);
        if (d < minDist) { minDist = d; minIdx = i; }
      }
      clusters[minIdx].push(pixel);
    }

    const newCentroids: Color[] = centroids.map((c, i) => {
      if (clusters[i].length === 0) return c;
      const r = Math.round(clusters[i].reduce((s, p) => s + p.r, 0) / clusters[i].length);
      const g = Math.round(clusters[i].reduce((s, p) => s + p.g, 0) / clusters[i].length);
      const b = Math.round(clusters[i].reduce((s, p) => s + p.b, 0) / clusters[i].length);
      return { r, g, b };
    });

    const converged = newCentroids.every((nc, i) => colorDistance(nc, centroids[i]) < 1);
    centroids = newCentroids;
    if (converged) break;
  }

  return centroids;
}

function toHex(c: Color): string {
  return `#${c.r.toString(16).padStart(2, '0')}${c.g.toString(16).padStart(2, '0')}${c.b.toString(16).padStart(2, '0')}`;
}

const tool: Tool = {
  id: 'palette-extract',
  name: 'Palette Extractor',
  description: 'Extract dominant colors from an image using k-means clustering',
  category: 'image',
  tags: ['image', 'palette', 'color', 'extract', 'dominant', 'kmeans', 'swatch'],
  inputs: [
    {
      id: 'image',
      label: 'Image',
      type: 'file',
      accept: 'image/*',
    },
  ],
  options: [
    {
      id: 'count',
      label: 'Number of Colors',
      type: 'range',
      default: 6,
      min: 3,
      max: 12,
      step: 1,
    },
  ],
  output: {
    type: 'json',
  },
  apiSupported: false,

  async run(inputs, options, onProgress) {
    const file = inputs['image'] as File;
    const k = options['count'] as number;

    const bitmap = await createImageBitmap(file);
    const canvas = document.createElement('canvas');
    // Downsample for performance
    const maxDim = 200;
    const scale = Math.min(1, maxDim / Math.max(bitmap.width, bitmap.height));
    canvas.width = Math.round(bitmap.width * scale);
    canvas.height = Math.round(bitmap.height * scale);
    const ctx = canvas.getContext('2d')!;
    ctx.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
    bitmap.close();

    onProgress?.(20, 'Sampling pixels...');
    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const data = imageData.data;

    const pixels: Color[] = [];
    for (let i = 0; i < data.length; i += 4) {
      if (data[i + 3] < 128) continue; // skip transparent
      pixels.push({ r: data[i], g: data[i + 1], b: data[i + 2] });
    }

    onProgress?.(40, 'Running k-means...');
    const palette = kMeans(pixels, k);

    // Sort by luminance
    palette.sort((a, b) => (0.299 * b.r + 0.587 * b.g + 0.114 * b.b) - (0.299 * a.r + 0.587 * a.g + 0.114 * a.b));

    onProgress?.(100, 'Done');

    const result = palette.map((c) => ({
      hex: toHex(c),
      rgb: `rgb(${c.r}, ${c.g}, ${c.b})`,
      r: c.r,
      g: c.g,
      b: c.b,
    }));

    return {
      type: 'json',
      data: result,
      summary: `Extracted ${k} dominant colors`,
    };
  },
};

registry.register(tool);
export default tool;
