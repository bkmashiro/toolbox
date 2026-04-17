import { registry } from '../../core/registry'
import type { Tool } from '../../core/types'

const tool: Tool = {
  id: 'gif-speed',
  name: 'GIF Speed',
  description: 'Change the playback speed of an animated GIF by adjusting frame delays',
  category: 'gif',
  tags: ['gif', 'speed', 'slow', 'fast', 'delay', 'fps', 'tempo'],
  inputs: [
    { id: 'file', label: 'GIF File', type: 'file', accept: 'image/gif' },
  ],
  options: [
    {
      id: 'speed',
      label: 'Speed Multiplier',
      type: 'select',
      default: '2',
      options: [
        { label: '0.25x (very slow)', value: '0.25' },
        { label: '0.5x (slow)', value: '0.5' },
        { label: '0.75x (slightly slow)', value: '0.75' },
        { label: '1.5x (slightly fast)', value: '1.5' },
        { label: '2x (double speed)', value: '2' },
        { label: '4x (quadruple)', value: '4' },
      ],
    },
  ],
  output: { type: 'file', defaultFilename: 'speed-adjusted.gif', defaultMimeType: 'image/gif' },
  apiSupported: false,
  async run(inputs, options, onProgress) {
    const file = inputs.file as File
    const speed = parseFloat(options.speed as string)
    const bytes = new Uint8Array(await file.arrayBuffer())

    onProgress?.(20, 'Adjusting GIF frame delays...')

    const output = adjustGifSpeed(bytes, speed)

    onProgress?.(90, 'Done')

    const blob = new Blob([output.buffer as ArrayBuffer], { type: 'image/gif' })
    const baseName = file.name.replace(/\.[^.]+$/, '')
    return {
      type: 'file',
      data: blob,
      filename: `${baseName}-${speed}x.gif`,
      mimeType: 'image/gif',
      summary: `GIF speed changed to ${speed}x — ${(blob.size / 1024).toFixed(1)} KB`,
    }
  },
}

/**
 * Adjust GIF playback speed by modifying Graphic Control Extension delay fields.
 * GIF delay is stored in units of 1/100 second (centiseconds).
 */
function adjustGifSpeed(bytes: Uint8Array, speed: number): Uint8Array {
  const output = new Uint8Array(bytes)
  let i = 0

  // Skip header (6) + logical screen descriptor (7)
  i = 6 + 7

  // Skip global color table
  const gctFlags = bytes[10]
  const hasGCT = (gctFlags & 0x80) !== 0
  if (hasGCT) {
    const gctSize = 3 * (1 << ((gctFlags & 0x07) + 1))
    i += gctSize
  }

  while (i < bytes.length) {
    const blockType = bytes[i]

    if (blockType === 0x3b) break // Trailer

    if (blockType === 0x21) {
      const label = bytes[i + 1]
      if (label === 0xf9) {
        // Graphic Control Extension
        // Structure: 0x21 0xf9 0x04 <packed> <delay-lo> <delay-hi> <transparent> 0x00
        const delayLo = bytes[i + 4]
        const delayHi = bytes[i + 5]
        const currentDelay = delayLo + (delayHi << 8) // centiseconds
        const minDelay = 2 // minimum 2 centiseconds (20ms)
        const newDelay = Math.max(minDelay, Math.round(currentDelay / speed))
        output[i + 4] = newDelay & 0xff
        output[i + 5] = (newDelay >> 8) & 0xff
        i += 8 // skip the fixed 8-byte GCE block
      } else {
        i += 2
        while (i < bytes.length) {
          const subSize = bytes[i]; i++
          if (subSize === 0) break
          i += subSize
        }
      }
    } else if (blockType === 0x2c) {
      // Image descriptor
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
    } else {
      break
    }
  }

  return output
}

registry.register(tool)
export default tool
