import { registry } from '../../core/registry'
import type { Tool } from '../../core/types'

const tool: Tool = {
  id: 'gif-reverse',
  name: 'Reverse GIF',
  description: 'Reverse the frame order of an animated GIF',
  category: 'gif',
  tags: ['gif', 'reverse', 'backwards', 'rewind', 'flip', 'frames'],
  inputs: [
    { id: 'file', label: 'GIF File', type: 'file', accept: 'image/gif' },
  ],
  options: [],
  output: { type: 'file', defaultFilename: 'reversed.gif', defaultMimeType: 'image/gif' },
  apiSupported: false,
  async run(inputs, _options, onProgress) {
    const file = inputs.file as File
    const bytes = new Uint8Array(await file.arrayBuffer())

    onProgress?.(10, 'Parsing GIF frames...')

    const { frames, header, logicalScreenDescriptor, globalColorTable, trailer } = parseGif(bytes)

    if (frames.length <= 1) {
      throw new Error('GIF has only one frame — nothing to reverse.')
    }

    onProgress?.(50, `Reversing ${frames.length} frames...`)

    const reversedFrames = [...frames].reverse()
    const output = buildGif(header, logicalScreenDescriptor, globalColorTable, reversedFrames, trailer)

    onProgress?.(90, 'Building output GIF...')

    const blob = new Blob([output.buffer as ArrayBuffer], { type: 'image/gif' })
    const baseName = file.name.replace(/\.[^.]+$/, '')
    return {
      type: 'file',
      data: blob,
      filename: `${baseName}-reversed.gif`,
      mimeType: 'image/gif',
      summary: `Reversed ${frames.length} frames — ${(blob.size / 1024).toFixed(1)} KB`,
    }
  },
}

interface GifFrame {
  data: Uint8Array
}

interface ParsedGif {
  header: Uint8Array
  logicalScreenDescriptor: Uint8Array
  globalColorTable: Uint8Array
  frames: GifFrame[]
  trailer: Uint8Array
}

function parseGif(bytes: Uint8Array): ParsedGif {
  let i = 0

  // Header (6 bytes: GIF87a or GIF89a)
  const header = bytes.slice(i, i + 6)
  i += 6

  // Logical Screen Descriptor (7 bytes)
  const logicalScreenDescriptor = bytes.slice(i, i + 7)
  const gctFlags = bytes[i + 4]
  const hasGCT = (gctFlags & 0x80) !== 0
  i += 7

  // Global Color Table
  let globalColorTable = new Uint8Array(0)
  if (hasGCT) {
    const gctSize = 3 * (1 << ((gctFlags & 0x07) + 1))
    globalColorTable = bytes.slice(i, i + gctSize)
    i += gctSize
  }

  const frames: GifFrame[] = []

  while (i < bytes.length) {
    const blockType = bytes[i]

    if (blockType === 0x3b) break // Trailer

    if (blockType === 0x21) {
      // Extension block — could be Graphic Control Extension (precedes frame) or other
      const extLabel = bytes[i + 1]
      const frameStart = i

      if (extLabel === 0xf9) {
        // Graphic Control Extension: read it and the following image descriptor as one frame
        i += 2
        while (i < bytes.length) {
          const subSize = bytes[i]; i++
          if (subSize === 0) break
          i += subSize
        }
        // Now read Image Descriptor + data
        if (bytes[i] === 0x2c) {
          i += 10
          const localFlags = bytes[i - 1]
          const hasLCT = (localFlags & 0x80) !== 0
          if (hasLCT) {
            const lctSize = 3 * (1 << ((localFlags & 0x07) + 1))
            i += lctSize
          }
          i++ // LZW min code size
          while (i < bytes.length) {
            const subSize = bytes[i]; i++
            if (subSize === 0) break
            i += subSize
          }
        }
        frames.push({ data: bytes.slice(frameStart, i) })
      } else {
        // Non-frame extension — skip
        i += 2
        while (i < bytes.length) {
          const subSize = bytes[i]; i++
          if (subSize === 0) break
          i += subSize
        }
      }
    } else if (blockType === 0x2c) {
      // Image Descriptor without preceding GCE
      const frameStart = i
      i += 10
      const localFlags = bytes[i - 1]
      const hasLCT = (localFlags & 0x80) !== 0
      if (hasLCT) {
        const lctSize = 3 * (1 << ((localFlags & 0x07) + 1))
        i += lctSize
      }
      i++ // LZW min code size
      while (i < bytes.length) {
        const subSize = bytes[i]; i++
        if (subSize === 0) break
        i += subSize
      }
      frames.push({ data: bytes.slice(frameStart, i) })
    } else {
      break
    }
  }

  const trailer = new Uint8Array([0x3b])
  return { header, logicalScreenDescriptor, globalColorTable, frames, trailer }
}

function buildGif(
  header: Uint8Array,
  lsd: Uint8Array,
  gct: Uint8Array,
  frames: GifFrame[],
  trailer: Uint8Array
): Uint8Array {
  const parts: Uint8Array[] = [header, lsd, gct, ...frames.map(f => f.data), trailer]
  const total = parts.reduce((sum, p) => sum + p.length, 0)
  const out = new Uint8Array(total)
  let offset = 0
  for (const part of parts) {
    out.set(part, offset)
    offset += part.length
  }
  return out
}

registry.register(tool)
export default tool
