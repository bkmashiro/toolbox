import { registry } from '../../core/registry';
import type { Tool } from '../../core/types';

const PRESETS: Record<string, { width?: number; height?: number }> = {
  thumbnail: { width: 150 },
  hd: { width: 1280 },
  '4k': { width: 3840 },
  '50pct': {},
  '25pct': {},
};

const tool: Tool = {
  id: 'image-resize',
  name: 'Image Resize',
  description: 'Resize images with aspect ratio lock and common presets',
  category: 'image',
  tags: ['image', 'resize', 'scale', 'width', 'height', 'thumbnail', 'hd', '4k'],
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
      id: 'preset',
      label: 'Preset',
      type: 'select',
      default: 'custom',
      options: [
        { label: 'Custom', value: 'custom' },
        { label: 'Thumbnail (150px)', value: 'thumbnail' },
        { label: 'HD (1280px wide)', value: 'hd' },
        { label: '4K (3840px wide)', value: '4k' },
        { label: '50%', value: '50pct' },
        { label: '25%', value: '25pct' },
      ],
    },
    {
      id: 'width',
      label: 'Width (px)',
      type: 'number',
      default: 0,
      min: 1,
      max: 16384,
      showWhen: { optionId: 'preset', value: 'custom' },
    },
    {
      id: 'height',
      label: 'Height (px)',
      type: 'number',
      default: 0,
      min: 1,
      max: 16384,
      showWhen: { optionId: 'preset', value: 'custom' },
    },
    {
      id: 'lockAspect',
      label: 'Lock Aspect Ratio',
      type: 'checkbox',
      default: true,
    },
  ],
  output: {
    type: 'file',
    defaultFilename: 'resized.png',
    defaultMimeType: 'image/png',
  },
  apiSupported: false,

  async run(inputs, options) {
    const file = inputs['image'] as File;
    const preset = options['preset'] as string;
    const lockAspect = options['lockAspect'] as boolean;

    const bitmap = await createImageBitmap(file);
    const origW = bitmap.width;
    const origH = bitmap.height;

    let targetW: number;
    let targetH: number;

    if (preset === 'custom') {
      const w = options['width'] as number;
      const h = options['height'] as number;
      if (w <= 0 && h <= 0) throw new Error('Specify at least one dimension');
      if (lockAspect) {
        if (w > 0 && h > 0) {
          const ratio = Math.min(w / origW, h / origH);
          targetW = Math.round(origW * ratio);
          targetH = Math.round(origH * ratio);
        } else if (w > 0) {
          targetW = w;
          targetH = Math.round(origH * (w / origW));
        } else {
          targetH = h;
          targetW = Math.round(origW * (h / origH));
        }
      } else {
        targetW = w > 0 ? w : origW;
        targetH = h > 0 ? h : origH;
      }
    } else if (preset === '50pct') {
      targetW = Math.round(origW * 0.5);
      targetH = Math.round(origH * 0.5);
    } else if (preset === '25pct') {
      targetW = Math.round(origW * 0.25);
      targetH = Math.round(origH * 0.25);
    } else {
      const p = PRESETS[preset];
      if (p.width) {
        targetW = p.width;
        targetH = Math.round(origH * (p.width / origW));
      } else {
        targetW = origW;
        targetH = origH;
      }
    }

    const canvas = document.createElement('canvas');
    canvas.width = targetW;
    canvas.height = targetH;
    const ctx = canvas.getContext('2d')!;
    ctx.drawImage(bitmap, 0, 0, targetW, targetH);
    bitmap.close();

    const mime = file.type || 'image/png';
    const blob = await new Promise<Blob>((resolve, reject) => {
      canvas.toBlob(
        (b) => (b ? resolve(b) : reject(new Error('Resize failed'))),
        mime,
        0.92
      );
    });

    const ext = mime.split('/')[1]?.replace('jpeg', 'jpg') || 'png';
    const baseName = file.name.replace(/\.[^.]+$/, '');
    return {
      type: 'file',
      data: blob,
      filename: `${baseName}-${targetW}x${targetH}.${ext}`,
      mimeType: mime,
      summary: `Resized from ${origW}x${origH} to ${targetW}x${targetH}`,
    };
  },
};

registry.register(tool);
export default tool;
