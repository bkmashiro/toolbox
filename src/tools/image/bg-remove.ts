import { registry } from '../../core/registry';
import type { Tool } from '../../core/types';

const tool: Tool = {
  id: 'bg-remove',
  name: 'Background Removal',
  description: 'Remove image background client-side using ML model — no upload, fully private',
  category: 'image',
  tags: ['image', 'background', 'remove', 'transparent', 'ai', 'ml', 'cutout', 'png'],
  inputs: [
    {
      id: 'file',
      label: 'Image',
      type: 'file',
      accept: 'image/jpeg,image/png,image/webp',
      required: true,
    },
  ],
  options: [],
  output: {
    type: 'file',
    defaultFilename: 'no-bg.png',
    defaultMimeType: 'image/png',
  },
  heavyDeps: ['@imgly/background-removal'],
  apiSupported: false,

  async run(inputs, _options, onProgress) {
    const file = inputs.file as File;
    const { removeBackground } = await import('@imgly/background-removal');

    onProgress?.(10, 'Loading model...');
    const blob = await removeBackground(file, {
      progress: (_key: string, current: number, total: number) => {
        onProgress?.(10 + Math.round((current / total) * 85), 'Removing background...');
      },
    });
    onProgress?.(100, 'Done');

    return {
      type: 'file',
      data: blob,
      filename: 'no-bg.png',
      mimeType: 'image/png',
    };
  },
};

registry.register(tool);
export default tool;
