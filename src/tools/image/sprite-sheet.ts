import { registry } from '../../core/registry';
import type { Tool } from '../../core/types';

const tool: Tool = {
  id: 'sprite-sheet',
  name: 'Sprite Sheet',
  description: 'Combine multiple images into a grid sprite sheet',
  category: 'image',
  tags: ['image', 'sprite', 'sheet', 'grid', 'combine', 'atlas', 'game'],
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
      id: 'columns',
      label: 'Columns (0 = auto square)',
      type: 'number',
      default: 0,
      min: 0,
      max: 20,
    },
    {
      id: 'padding',
      label: 'Padding (px)',
      type: 'range',
      default: 2,
      min: 0,
      max: 50,
      step: 1,
    },
    {
      id: 'bgColor',
      label: 'Background',
      type: 'select',
      default: 'transparent',
      options: [
        { label: 'Transparent', value: 'transparent' },
        { label: 'White', value: '#ffffff' },
        { label: 'Black', value: '#000000' },
      ],
    },
  ],
  output: {
    type: 'file',
    defaultFilename: 'spritesheet.png',
    defaultMimeType: 'image/png',
  },
  apiSupported: false,

  async run(inputs, options, onProgress) {
    const files = inputs['images'] as File[];
    const padding = options['padding'] as number;
    const bgColor = options['bgColor'] as string;
    let cols = options['columns'] as number;

    if (files.length === 0) throw new Error('No images provided');

    if (cols <= 0) {
      cols = Math.ceil(Math.sqrt(files.length));
    }
    const rows = Math.ceil(files.length / cols);

    onProgress?.(10, 'Loading images...');

    const bitmaps = await Promise.all(files.map((f) => createImageBitmap(f)));
    const cellW = Math.max(...bitmaps.map((b) => b.width));
    const cellH = Math.max(...bitmaps.map((b) => b.height));

    const totalW = cols * cellW + (cols + 1) * padding;
    const totalH = rows * cellH + (rows + 1) * padding;

    onProgress?.(40, 'Drawing sprite sheet...');

    const canvas = document.createElement('canvas');
    canvas.width = totalW;
    canvas.height = totalH;
    const ctx = canvas.getContext('2d')!;

    if (bgColor !== 'transparent') {
      ctx.fillStyle = bgColor;
      ctx.fillRect(0, 0, totalW, totalH);
    }

    for (let i = 0; i < bitmaps.length; i++) {
      const col = i % cols;
      const row = Math.floor(i / cols);
      const x = padding + col * (cellW + padding);
      const y = padding + row * (cellH + padding);
      ctx.drawImage(bitmaps[i], x, y, bitmaps[i].width, bitmaps[i].height);
      bitmaps[i].close();
    }

    onProgress?.(80, 'Encoding...');

    const blob = await new Promise<Blob>((resolve, reject) => {
      canvas.toBlob(
        (b) => (b ? resolve(b) : reject(new Error('Sprite sheet render failed'))),
        'image/png'
      );
    });

    // Generate CSS
    const cssLines: string[] = [`.sprite { background-image: url('spritesheet.png'); background-repeat: no-repeat; }`];
    for (let i = 0; i < files.length; i++) {
      const col = i % cols;
      const row = Math.floor(i / cols);
      const x = padding + col * (cellW + padding);
      const y = padding + row * (cellH + padding);
      const name = files[i].name.replace(/\.[^.]+$/, '').replace(/[^a-z0-9-_]/gi, '_');
      cssLines.push(`.sprite-${name} { background-position: -${x}px -${y}px; width: ${bitmaps[i]?.width ?? cellW}px; height: ${bitmaps[i]?.height ?? cellH}px; }`);
    }

    onProgress?.(100, 'Done');

    return {
      type: 'file',
      data: blob,
      filename: 'spritesheet.png',
      mimeType: 'image/png',
      summary: `${files.length} images in ${cols}x${rows} grid (${totalW}x${totalH}px)\n\nCSS:\n${cssLines.join('\n')}`,
    };
  },
};

registry.register(tool);
export default tool;
