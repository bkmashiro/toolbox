import { registry } from '../../core/registry';
import type { Tool, ToolResult } from '../../core/types';

/** Parse basic EXIF fields from a JPEG ArrayBuffer */
function parseExif(buffer: ArrayBuffer): Record<string, string> {
  const view = new DataView(buffer);
  const result: Record<string, string> = {};

  // Look for EXIF marker 0xFFE1
  let offset = 2;
  while (offset < view.byteLength - 4) {
    const marker = view.getUint16(offset);
    if (marker === 0xFFE1) {
      // Found APP1
      const segLen = view.getUint16(offset + 2);
      const exifHeader = String.fromCharCode(
        view.getUint8(offset + 4),
        view.getUint8(offset + 5),
        view.getUint8(offset + 6),
        view.getUint8(offset + 7)
      );
      if (exifHeader !== 'Exif') break;

      const tiffStart = offset + 10;
      const byteOrder = view.getUint16(tiffStart);
      const littleEndian = byteOrder === 0x4949;

      const getU16 = (o: number) => view.getUint16(tiffStart + o, littleEndian);
      const getU32 = (o: number) => view.getUint32(tiffStart + o, littleEndian);

      const ifdOffset = getU32(4);
      const entries = getU16(ifdOffset);

      const tagNames: Record<number, string> = {
        0x010F: 'Make',
        0x0110: 'Model',
        0x0112: 'Orientation',
        0x0132: 'DateTime',
        0x013B: 'Artist',
        0x8827: 'ISOSpeedRatings',
        0x920A: 'FocalLength',
        0x829A: 'ExposureTime',
        0x829D: 'FNumber',
        0x8822: 'ExposureProgram',
        0x9003: 'DateTimeOriginal',
        0x9004: 'DateTimeDigitized',
        0x0213: 'YCbCrPositioning',
        0x8769: 'ExifIFDPointer',
      };

      for (let i = 0; i < entries; i++) {
        const entryOffset = ifdOffset + 2 + i * 12;
        const tag = getU16(entryOffset);
        const type = getU16(entryOffset + 2);
        const count = getU32(entryOffset + 4);
        const valOffset = entryOffset + 8;

        const name = tagNames[tag];
        if (!name) continue;

        if (type === 2) {
          // ASCII string
          const strOffset = count <= 4 ? valOffset : getU32(valOffset);
          let str = '';
          for (let j = 0; j < count - 1; j++) {
            const charCode = view.getUint8(tiffStart + strOffset + j);
            if (charCode === 0) break;
            str += String.fromCharCode(charCode);
          }
          result[name] = str;
        } else if (type === 3 && count === 1) {
          // SHORT
          result[name] = String(getU16(valOffset));
        } else if (type === 4 && count === 1) {
          // LONG
          result[name] = String(getU32(valOffset));
        } else if (type === 5 && count === 1) {
          // RATIONAL
          const ratOffset = getU32(valOffset);
          const num = getU32(ratOffset);
          const den = getU32(ratOffset + 4);
          result[name] = den !== 0 ? `${num}/${den}` : String(num);
        }
      }
      break;
    } else if ((marker & 0xFF00) !== 0xFF00) {
      break;
    } else {
      offset += 2 + view.getUint16(offset + 2);
    }
  }

  return result;
}

/** Strip EXIF from JPEG by rebuilding without APP1 segment */
function stripExifFromJpeg(buffer: ArrayBuffer): ArrayBuffer {
  const view = new DataView(buffer);
  const chunks: Uint8Array[] = [];

  // SOI marker
  chunks.push(new Uint8Array(buffer, 0, 2));
  let offset = 2;

  while (offset < view.byteLength - 1) {
    const marker = view.getUint16(offset);
    if (marker === 0xFFD9) {
      // EOI
      chunks.push(new Uint8Array(buffer, offset, 2));
      break;
    }
    if (marker === 0xFFDA) {
      // SOS — rest is image data
      chunks.push(new Uint8Array(buffer, offset));
      break;
    }
    const segLen = view.getUint16(offset + 2) + 2;
    if (marker !== 0xFFE1) {
      chunks.push(new Uint8Array(buffer, offset, segLen));
    }
    offset += segLen;
  }

  const total = chunks.reduce((s, c) => s + c.byteLength, 0);
  const out = new Uint8Array(total);
  let pos = 0;
  for (const c of chunks) {
    out.set(c, pos);
    pos += c.byteLength;
  }
  return out.buffer;
}

const tool: Tool = {
  id: 'image-exif',
  name: 'EXIF Viewer',
  description: 'View EXIF metadata from images and optionally strip it',
  category: 'image',
  tags: ['image', 'exif', 'metadata', 'camera', 'gps', 'strip', 'jpeg'],
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
      id: 'stripExif',
      label: 'Strip EXIF and download cleaned image',
      type: 'checkbox',
      default: false,
    },
  ],
  output: {
    type: 'text',
  },
  apiSupported: false,

  async run(inputs, options): Promise<ToolResult> {
    const file = inputs['image'] as File;
    const stripExif = options['stripExif'] as boolean;
    const buffer = await file.arrayBuffer();

    const exif = parseExif(buffer);
    const exifText = Object.keys(exif).length > 0
      ? Object.entries(exif).map(([k, v]) => `${k}: ${v}`).join('\n')
      : 'No EXIF data found';

    if (stripExif) {
      const isJpeg = file.type === 'image/jpeg' || file.name.toLowerCase().endsWith('.jpg') || file.name.toLowerCase().endsWith('.jpeg');
      if (!isJpeg) {
        return { type: 'text', data: 'EXIF stripping is only supported for JPEG images.\n\n' + exifText };
      }
      const stripped = stripExifFromJpeg(buffer);
      const blob = new Blob([stripped], { type: 'image/jpeg' });
      const baseName = file.name.replace(/\.[^.]+$/, '');
      return {
        type: 'file',
        data: blob,
        filename: `${baseName}-no-exif.jpg`,
        mimeType: 'image/jpeg',
        summary: `Stripped EXIF. Original: ${(file.size / 1024).toFixed(1)} KB → ${(stripped.byteLength / 1024).toFixed(1)} KB`,
      };
    }

    return { type: 'text', data: exifText };
  },
};

registry.register(tool);
export default tool;
