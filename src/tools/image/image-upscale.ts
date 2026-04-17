import { registry } from '../../core/registry';
import type { Tool } from '../../core/types';

const tool: Tool = {
  id: 'image-upscale',
  name: 'Image Upscale',
  description: 'Upscale images 2× or 4× using high-quality Canvas interpolation — fully client-side',
  category: 'image',
  tags: ['image', 'upscale', 'enlarge', 'resize', 'enhance', 'scale', '2x', '4x'],
  inputs: [
    {
      id: 'file',
      label: 'Image',
      type: 'file',
      accept: 'image/*',
      required: true,
    },
  ],
  options: [
    {
      id: 'scale',
      label: 'Scale Factor',
      type: 'select',
      default: '2',
      options: [
        { value: '2', label: '2×' },
        { value: '4', label: '4×' },
      ],
    },
    {
      id: 'quality',
      label: 'Interpolation',
      type: 'select',
      default: 'smooth',
      options: [
        { value: 'smooth', label: 'Smooth (bilinear)' },
        { value: 'pixelated', label: 'Pixelated (nearest-neighbor)' },
      ],
    },
  ],
  output: {
    type: 'file',
    defaultMimeType: 'image/png',
  },
  apiSupported: false,

  async run(inputs, options, onProgress) {
    const file = inputs.file as File;
    const scale = parseInt((options.scale as string) || '2');
    const smooth = (options.quality as string) !== 'pixelated';

    onProgress?.(20, 'Loading image...');
    const img = await createImageBitmap(file);
    const canvas = new OffscreenCanvas(img.width * scale, img.height * scale);
    const ctx = canvas.getContext('2d')!;
    ctx.imageSmoothingEnabled = smooth;
    ctx.imageSmoothingQuality = 'high';
    ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
    onProgress?.(80, 'Encoding...');
    const blob = await canvas.convertToBlob({ type: 'image/png' });
    onProgress?.(100, 'Done');

    const ext = file.name.replace(/\.[^.]+$/, '');
    return {
      type: 'file',
      data: blob,
      filename: `${ext}_${scale}x.png`,
      mimeType: 'image/png',
    };
  },
};

registry.register(tool);
export default tool;
