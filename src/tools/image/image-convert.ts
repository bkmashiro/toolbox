import { registry } from '../../core/registry';
import type { Tool } from '../../core/types';

const tool: Tool = {
  id: 'image-convert',
  name: 'Image Convert',
  description: 'Convert between image formats (PNG, JPEG, WebP, AVIF, BMP, GIF, SVG)',
  category: 'image',
  tags: ['image', 'convert', 'png', 'jpeg', 'jpg', 'webp', 'avif', 'bmp', 'gif', 'svg', 'format'],
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
      id: 'format',
      label: 'Output Format',
      type: 'select',
      default: 'png',
      options: [
        { label: 'PNG', value: 'png' },
        { label: 'JPEG', value: 'jpeg' },
        { label: 'WebP', value: 'webp' },
        { label: 'AVIF', value: 'avif' },
      ],
    },
    {
      id: 'quality',
      label: 'Quality (lossy formats)',
      type: 'range',
      default: 85,
      min: 1,
      max: 100,
      step: 1,
      helpText: 'Applies to JPEG, WebP, AVIF',
    },
    {
      id: 'resizeWidth',
      label: 'Resize Width (px)',
      type: 'number',
      default: 0,
      min: 0,
      max: 16384,
      helpText: 'Set to 0 to keep original width',
    },
    {
      id: 'resizeHeight',
      label: 'Resize Height (px)',
      type: 'number',
      default: 0,
      min: 0,
      max: 16384,
      helpText: 'Set to 0 to keep original height',
    },
    {
      id: 'maintainAspect',
      label: 'Maintain Aspect Ratio',
      type: 'checkbox',
      default: true,
    },
  ],
  output: {
    type: 'file',
    defaultFilename: 'converted.png',
    defaultMimeType: 'image/png',
  },
  apiSupported: false,

  async run(inputs, options) {
    const file = inputs['image'] as File;
    const format = options['format'] as string;
    const quality = (options['quality'] as number) / 100;
    const resizeWidth = options['resizeWidth'] as number;
    const resizeHeight = options['resizeHeight'] as number;
    const maintainAspect = options['maintainAspect'] as boolean;

    const mimeMap: Record<string, string> = {
      png: 'image/png',
      jpeg: 'image/jpeg',
      webp: 'image/webp',
      avif: 'image/avif',
    };
    const extMap: Record<string, string> = {
      png: 'png',
      jpeg: 'jpg',
      webp: 'webp',
      avif: 'avif',
    };

    const mime = mimeMap[format] ?? 'image/png';
    const ext = extMap[format] ?? 'png';

    const bitmap = await createImageBitmap(file);
    let targetW = bitmap.width;
    let targetH = bitmap.height;

    if (resizeWidth > 0 && resizeHeight > 0) {
      if (maintainAspect) {
        const ratio = Math.min(resizeWidth / bitmap.width, resizeHeight / bitmap.height);
        targetW = Math.round(bitmap.width * ratio);
        targetH = Math.round(bitmap.height * ratio);
      } else {
        targetW = resizeWidth;
        targetH = resizeHeight;
      }
    } else if (resizeWidth > 0) {
      if (maintainAspect) {
        const ratio = resizeWidth / bitmap.width;
        targetW = resizeWidth;
        targetH = Math.round(bitmap.height * ratio);
      } else {
        targetW = resizeWidth;
      }
    } else if (resizeHeight > 0) {
      if (maintainAspect) {
        const ratio = resizeHeight / bitmap.height;
        targetH = resizeHeight;
        targetW = Math.round(bitmap.width * ratio);
      } else {
        targetH = resizeHeight;
      }
    }

    const canvas = document.createElement('canvas');
    canvas.width = targetW;
    canvas.height = targetH;
    const ctx = canvas.getContext('2d')!;
    ctx.drawImage(bitmap, 0, 0, targetW, targetH);
    bitmap.close();

    const blob = await new Promise<Blob>((resolve, reject) => {
      canvas.toBlob(
        (b) => (b ? resolve(b) : reject(new Error('Conversion failed'))),
        mime,
        format === 'png' ? undefined : quality
      );
    });

    const baseName = file.name.replace(/\.[^.]+$/, '');
    return {
      type: 'file',
      data: blob,
      filename: `${baseName}.${ext}`,
      mimeType: mime,
    };
  },
};

registry.register(tool);
export default tool;
