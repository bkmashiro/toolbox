import { registry } from '../../core/registry';
import type { Tool } from '../../core/types';

const tool: Tool = {
  id: 'image-compress',
  name: 'Image Compress',
  description: 'Batch compress images with quality control and per-file size reduction stats',
  category: 'image',
  tags: ['image', 'compress', 'reduce', 'size', 'batch', 'optimize', 'jpeg', 'webp', 'png'],
  inputs: [
    {
      id: 'images',
      label: 'Images',
      type: 'multifile',
      accept: 'image/*',
    },
  ],
  options: [
    {
      id: 'quality',
      label: 'Quality',
      type: 'range',
      default: 75,
      min: 1,
      max: 100,
      step: 1,
    },
    {
      id: 'maxWidth',
      label: 'Max Width (px, 0 = no limit)',
      type: 'number',
      default: 0,
      min: 0,
      max: 16384,
    },
    {
      id: 'maxHeight',
      label: 'Max Height (px, 0 = no limit)',
      type: 'number',
      default: 0,
      min: 0,
      max: 16384,
    },
    {
      id: 'format',
      label: 'Output Format',
      type: 'select',
      default: 'original',
      options: [
        { label: 'Original', value: 'original' },
        { label: 'JPEG', value: 'jpeg' },
        { label: 'WebP', value: 'webp' },
      ],
    },
  ],
  output: {
    type: 'files',
  },
  heavyDeps: ['browser-image-compression'],
  apiSupported: false,

  async run(inputs, options, onProgress) {
    const files = inputs['images'] as File[];
    const quality = (options['quality'] as number) / 100;
    const maxWidth = options['maxWidth'] as number;
    const maxHeight = options['maxHeight'] as number;
    const format = options['format'] as string;

    const { default: imageCompression } = await import('browser-image-compression');

    const blobs: Blob[] = [];
    const filenames: string[] = [];
    const summaryLines: string[] = [];

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      onProgress?.(Math.round((i / files.length) * 90), `Compressing ${file.name}...`);

      const compOptions: Parameters<typeof imageCompression>[1] = {
        initialQuality: quality,
        useWebWorker: false,
      };
      if (maxWidth > 0) compOptions.maxWidthOrHeight = Math.max(maxWidth, maxHeight || 0);
      if (format === 'jpeg') compOptions.fileType = 'image/jpeg';
      if (format === 'webp') compOptions.fileType = 'image/webp';

      const compressed = await imageCompression(file, compOptions);
      const reduction = (((file.size - compressed.size) / file.size) * 100).toFixed(1);
      const fromKB = (file.size / 1024).toFixed(1);
      const toKB = (compressed.size / 1024).toFixed(1);
      summaryLines.push(`${file.name}: ${fromKB} KB → ${toKB} KB (${reduction}% smaller)`);

      blobs.push(compressed);
      filenames.push(file.name.replace(/\.[^.]+$/, '') + '-compressed.' + (compressed.type.split('/')[1] || 'jpg'));
    }

    onProgress?.(100, 'Done');

    return {
      type: 'files',
      data: blobs,
      filenames,
      summary: summaryLines.join('\n'),
    };
  },
};

registry.register(tool);
export default tool;
