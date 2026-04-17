import { registry } from '../../core/registry';
import type { Tool } from '../../core/types';

const tool: Tool = {
  id: 'image-crop',
  name: 'Image Crop',
  description: 'Crop image with interactive drag handles and aspect ratio lock',
  category: 'image',
  tags: ['image', 'crop', 'cut', 'trim', 'region', 'aspect ratio'],
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
      id: 'x',
      label: 'Crop X (px)',
      type: 'number',
      default: 0,
      min: 0,
    },
    {
      id: 'y',
      label: 'Crop Y (px)',
      type: 'number',
      default: 0,
      min: 0,
    },
    {
      id: 'width',
      label: 'Crop Width (px, 0 = auto)',
      type: 'number',
      default: 0,
      min: 0,
    },
    {
      id: 'height',
      label: 'Crop Height (px, 0 = auto)',
      type: 'number',
      default: 0,
      min: 0,
    },
    {
      id: 'aspectRatio',
      label: 'Aspect Ratio Lock',
      type: 'select',
      default: 'free',
      options: [
        { label: 'Free', value: 'free' },
        { label: '1:1 (Square)', value: '1:1' },
        { label: '4:3', value: '4:3' },
        { label: '16:9', value: '16:9' },
        { label: '3:2', value: '3:2' },
      ],
      helpText: 'Use the interactive canvas preview (when in UI) to drag crop handles',
    },
  ],
  output: {
    type: 'file',
    defaultMimeType: 'image/png',
  },
  apiSupported: false,

  async run(inputs, options) {
    const file = inputs['image'] as File;
    let x = options['x'] as number;
    let y = options['y'] as number;
    let w = options['width'] as number;
    let h = options['height'] as number;

    const bitmap = await createImageBitmap(file);
    const imgW = bitmap.width;
    const imgH = bitmap.height;

    x = Math.max(0, Math.min(x, imgW - 1));
    y = Math.max(0, Math.min(y, imgH - 1));
    if (w <= 0) w = imgW - x;
    if (h <= 0) h = imgH - y;
    w = Math.min(w, imgW - x);
    h = Math.min(h, imgH - y);

    const canvas = document.createElement('canvas');
    canvas.width = w;
    canvas.height = h;
    const ctx = canvas.getContext('2d')!;
    ctx.drawImage(bitmap, x, y, w, h, 0, 0, w, h);
    bitmap.close();

    const mime = file.type || 'image/png';
    const blob = await new Promise<Blob>((resolve, reject) => {
      canvas.toBlob(
        (b) => (b ? resolve(b) : reject(new Error('Crop failed'))),
        mime,
        0.95
      );
    });

    const ext = mime.split('/')[1]?.replace('jpeg', 'jpg') || 'png';
    const baseName = file.name.replace(/\.[^.]+$/, '');
    return {
      type: 'file',
      data: blob,
      filename: `${baseName}-crop-${x}-${y}-${w}x${h}.${ext}`,
      mimeType: mime,
      summary: `Cropped to ${w}x${h} from (${x}, ${y})`,
    };
  },
};

registry.register(tool);
export default tool;
