import { registry } from '../../core/registry';
import type { Tool } from '../../core/types';

const FAVICON_SIZES = [16, 32, 48, 64, 128, 180, 192, 512];

/** Resize image to given size using Canvas, returns PNG Uint8Array */
async function resizeToPng(bitmap: ImageBitmap, size: number): Promise<Uint8Array> {
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d')!;
  ctx.drawImage(bitmap, 0, 0, size, size);
  return new Promise<Uint8Array>((resolve, reject) => {
    canvas.toBlob((b) => {
      if (!b) return reject(new Error(`Failed to render ${size}px`));
      b.arrayBuffer().then((buf) => resolve(new Uint8Array(buf))).catch(reject);
    }, 'image/png');
  });
}

const tool: Tool = {
  id: 'favicon-gen',
  name: 'Favicon Generator',
  description: 'Generate a favicon package (ICO + multiple PNG sizes) from an image',
  category: 'image',
  tags: ['image', 'favicon', 'ico', 'png', 'icon', 'web', 'generator'],
  inputs: [
    {
      id: 'image',
      label: 'Source Image (PNG or SVG)',
      type: 'file',
      accept: 'image/png,image/svg+xml',
    },
  ],
  options: FAVICON_SIZES.map((size) => ({
    id: `size_${size}`,
    label: `${size}x${size}px`,
    type: 'checkbox' as const,
    default: true,
  })),
  output: {
    type: 'file',
    defaultFilename: 'favicons.zip',
    defaultMimeType: 'application/zip',
  },
  apiSupported: false,

  async run(inputs, options, onProgress) {
    const file = inputs['image'] as File;
    const { zipSync } = await import('fflate');

    const bitmap = await createImageBitmap(file);

    const selectedSizes = FAVICON_SIZES.filter((s) => options[`size_${s}`] as boolean);
    if (selectedSizes.length === 0) throw new Error('Select at least one size');

    const files: Record<string, Uint8Array> = {};
    const pngBuffers: Uint8Array[] = [];

    for (let i = 0; i < selectedSizes.length; i++) {
      const size = selectedSizes[i];
      onProgress?.(Math.round((i / selectedSizes.length) * 80), `Rendering ${size}x${size}...`);
      const png = await resizeToPng(bitmap, size);
      files[`favicon-${size}x${size}.png`] = png;
      if (size === 16 || size === 32 || size === 48) {
        pngBuffers.push(png);
      }
    }

    bitmap.close();

    // Build minimal ICO from 16, 32, 48px PNGs (if selected)
    const icoSizes = [16, 32, 48].filter((s) => selectedSizes.includes(s));
    if (icoSizes.length > 0) {
      const icoImages: Uint8Array[] = [];
      for (const s of icoSizes) {
        icoImages.push(files[`favicon-${s}x${s}.png`]);
      }
      files['favicon.ico'] = buildIco(icoImages, icoSizes);
    }

    onProgress?.(90, 'Zipping...');
    const zip = zipSync(files);
    onProgress?.(100, 'Done');

    return {
      type: 'file',
      data: new Blob([zip], { type: 'application/zip' }),
      filename: 'favicons.zip',
      mimeType: 'application/zip',
      summary: `Generated ${Object.keys(files).length} files (${selectedSizes.length} PNGs${icoSizes.length > 0 ? ' + ICO' : ''})`,
    };
  },
};

/** Build a simple ICO file from PNG byte arrays */
function buildIco(pngs: Uint8Array[], sizes: number[]): Uint8Array {
  const headerSize = 6;
  const dirEntrySize = 16;
  const dirSize = headerSize + dirEntrySize * pngs.length;

  let imageOffset = dirSize;
  const offsets: number[] = [];
  for (const png of pngs) {
    offsets.push(imageOffset);
    imageOffset += png.byteLength;
  }

  const total = imageOffset;
  const buf = new ArrayBuffer(total);
  const view = new DataView(buf);
  const u8 = new Uint8Array(buf);

  // ICO header
  view.setUint16(0, 0, true);   // reserved
  view.setUint16(2, 1, true);   // type: ICO
  view.setUint16(4, pngs.length, true);

  // Directory entries
  for (let i = 0; i < pngs.length; i++) {
    const base = headerSize + i * dirEntrySize;
    const s = sizes[i];
    u8[base] = s >= 256 ? 0 : s;       // width (0 = 256)
    u8[base + 1] = s >= 256 ? 0 : s;   // height
    u8[base + 2] = 0;                   // color count
    u8[base + 3] = 0;                   // reserved
    view.setUint16(base + 4, 1, true);  // planes
    view.setUint16(base + 6, 32, true); // bit count
    view.setUint32(base + 8, pngs[i].byteLength, true);
    view.setUint32(base + 12, offsets[i], true);
  }

  // Image data
  for (let i = 0; i < pngs.length; i++) {
    u8.set(pngs[i], offsets[i]);
  }

  return u8;
}

registry.register(tool);
export default tool;
