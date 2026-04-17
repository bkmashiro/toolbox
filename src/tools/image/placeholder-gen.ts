import { registry } from '../../core/registry';
import type { Tool } from '../../core/types';

const tool: Tool = {
  id: 'placeholder-gen',
  name: 'Placeholder Image',
  description: 'Generate a placeholder image with custom dimensions, color, and label',
  category: 'image',
  tags: ['image', 'placeholder', 'generate', 'dummy', 'mock', 'design', 'canvas'],
  inputs: [],
  options: [
    {
      id: 'width',
      label: 'Width (px)',
      type: 'number',
      default: 640,
      min: 1,
      max: 4096,
    },
    {
      id: 'height',
      label: 'Height (px)',
      type: 'number',
      default: 480,
      min: 1,
      max: 4096,
    },
    {
      id: 'bgColor',
      label: 'Background Color',
      type: 'color',
      default: '#cccccc',
    },
    {
      id: 'textColor',
      label: 'Text Color',
      type: 'color',
      default: '#666666',
    },
    {
      id: 'label',
      label: 'Label Text (empty = WxH)',
      type: 'text',
      default: '',
      placeholder: '640x480',
    },
    {
      id: 'fontSize',
      label: 'Font Size (px, 0 = auto)',
      type: 'number',
      default: 0,
      min: 0,
      max: 200,
    },
  ],
  output: {
    type: 'file',
    defaultFilename: 'placeholder.png',
    defaultMimeType: 'image/png',
  },
  apiSupported: true,

  async run(inputs, options) {
    const w = Math.max(1, options['width'] as number);
    const h = Math.max(1, options['height'] as number);
    const bgColor = options['bgColor'] as string;
    const textColor = options['textColor'] as string;
    let label = (options['label'] as string).trim() || `${w}x${h}`;
    let fontSize = options['fontSize'] as number;
    if (fontSize <= 0) {
      fontSize = Math.max(12, Math.min(Math.floor(Math.min(w, h) / 5), 72));
    }

    const canvas = document.createElement('canvas');
    canvas.width = w;
    canvas.height = h;
    const ctx = canvas.getContext('2d')!;

    ctx.fillStyle = bgColor;
    ctx.fillRect(0, 0, w, h);

    ctx.fillStyle = textColor;
    ctx.font = `bold ${fontSize}px sans-serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(label, w / 2, h / 2);

    const blob = await new Promise<Blob>((resolve, reject) => {
      canvas.toBlob(
        (b) => (b ? resolve(b) : reject(new Error('Generation failed'))),
        'image/png'
      );
    });

    return {
      type: 'file',
      data: blob,
      filename: `placeholder-${w}x${h}.png`,
      mimeType: 'image/png',
    };
  },
};

registry.register(tool);
export default tool;
