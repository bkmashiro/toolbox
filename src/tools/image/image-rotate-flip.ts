import { registry } from '../../core/registry';
import type { Tool } from '../../core/types';

const tool: Tool = {
  id: 'image-rotate-flip',
  name: 'Rotate & Flip',
  description: 'Rotate or flip images using Canvas',
  category: 'image',
  tags: ['image', 'rotate', 'flip', 'mirror', 'horizontal', 'vertical', '90', '180', '270'],
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
      id: 'rotation',
      label: 'Rotation',
      type: 'select',
      default: '0',
      options: [
        { label: 'No rotation', value: '0' },
        { label: '90° clockwise', value: '90' },
        { label: '180°', value: '180' },
        { label: '270° clockwise', value: '270' },
      ],
    },
    {
      id: 'flipH',
      label: 'Flip Horizontal',
      type: 'checkbox',
      default: false,
    },
    {
      id: 'flipV',
      label: 'Flip Vertical',
      type: 'checkbox',
      default: false,
    },
  ],
  output: {
    type: 'file',
    defaultMimeType: 'image/png',
  },
  apiSupported: false,

  async run(inputs, options) {
    const file = inputs['image'] as File;
    const rotation = parseInt(options['rotation'] as string, 10);
    const flipH = options['flipH'] as boolean;
    const flipV = options['flipV'] as boolean;

    const bitmap = await createImageBitmap(file);
    const w = bitmap.width;
    const h = bitmap.height;

    const canvas = document.createElement('canvas');
    const swapped = rotation === 90 || rotation === 270;
    canvas.width = swapped ? h : w;
    canvas.height = swapped ? w : h;

    const ctx = canvas.getContext('2d')!;
    ctx.translate(canvas.width / 2, canvas.height / 2);
    ctx.rotate((rotation * Math.PI) / 180);
    ctx.scale(flipH ? -1 : 1, flipV ? -1 : 1);
    ctx.drawImage(bitmap, -w / 2, -h / 2);
    bitmap.close();

    const mime = file.type || 'image/png';
    const blob = await new Promise<Blob>((resolve, reject) => {
      canvas.toBlob(
        (b) => (b ? resolve(b) : reject(new Error('Rotate/flip failed'))),
        mime,
        0.92
      );
    });

    const ext = mime.split('/')[1]?.replace('jpeg', 'jpg') || 'png';
    const baseName = file.name.replace(/\.[^.]+$/, '');
    const suffix = [rotation !== 0 ? `rot${rotation}` : '', flipH ? 'flipH' : '', flipV ? 'flipV' : '']
      .filter(Boolean)
      .join('-') || 'unchanged';

    return {
      type: 'file',
      data: blob,
      filename: `${baseName}-${suffix}.${ext}`,
      mimeType: mime,
    };
  },
};

registry.register(tool);
export default tool;
