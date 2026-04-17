import { registry } from '../../core/registry'
import { getFFmpeg, writeInputFile, readOutputFile, cleanupFiles } from '../../core/ffmpeg'
import type { Tool } from '../../core/types'

const tool: Tool = {
  id: 'gif-crop',
  name: 'Crop GIF',
  description: 'Crop an animated GIF to a rectangular region',
  category: 'gif',
  tags: ['gif', 'crop', 'cut', 'trim', 'rectangle', 'region'],
  inputs: [
    { id: 'file', label: 'GIF File', type: 'file', accept: 'image/gif' },
  ],
  options: [
    {
      id: 'x',
      label: 'X Offset (pixels from left)',
      type: 'number',
      default: 0,
      min: 0,
      step: 1,
    },
    {
      id: 'y',
      label: 'Y Offset (pixels from top)',
      type: 'number',
      default: 0,
      min: 0,
      step: 1,
    },
    {
      id: 'width',
      label: 'Crop Width (pixels)',
      type: 'number',
      default: 320,
      min: 1,
      step: 1,
    },
    {
      id: 'height',
      label: 'Crop Height (pixels)',
      type: 'number',
      default: 240,
      min: 1,
      step: 1,
    },
  ],
  output: { type: 'file', defaultFilename: 'cropped.gif', defaultMimeType: 'image/gif' },
  apiSupported: false,
  heavyDeps: ['ffmpeg'],
  async run(inputs, options, onProgress) {
    const file = inputs.file as File
    const x = options.x as number
    const y = options.y as number
    const w = options.width as number
    const h = options.height as number

    const ffmpeg = await getFFmpeg(onProgress)

    await writeInputFile(ffmpeg, 'input.gif', file)

    // Two-pass palette re-generation for best quality after crop
    const pass1Args = [
      '-i', 'input.gif',
      '-vf', `crop=${w}:${h}:${x}:${y},palettegen=stats_mode=diff`,
      '-y', 'palette.png',
    ]
    await ffmpeg.exec(pass1Args)

    const pass2Args = [
      '-i', 'input.gif',
      '-i', 'palette.png',
      '-filter_complex', `crop=${w}:${h}:${x}:${y}[cropped];[cropped][1:v]paletteuse`,
      '-y', 'output.gif',
    ]
    await ffmpeg.exec(pass2Args)

    const blob = await readOutputFile(ffmpeg, 'output.gif', 'image/gif')
    await cleanupFiles(ffmpeg, ['input.gif', 'palette.png', 'output.gif'])

    const baseName = file.name.replace(/\.[^.]+$/, '')
    return {
      type: 'file',
      data: blob,
      filename: `${baseName}-cropped.gif`,
      mimeType: 'image/gif',
      summary: `Cropped to ${w}×${h} at (${x}, ${y}) — ${(blob.size / 1024).toFixed(1)} KB`,
    }
  },
}

registry.register(tool)
export default tool
