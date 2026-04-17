import { registry } from '../../core/registry'
import { getFFmpeg, writeInputFile, readOutputFile, cleanupFiles } from '../../core/ffmpeg'
import type { Tool } from '../../core/types'

const tool: Tool = {
  id: 'gif-optimize',
  name: 'Optimize GIF',
  description: 'Reduce GIF file size by limiting palette and re-encoding with FFmpeg',
  category: 'gif',
  tags: ['gif', 'optimize', 'compress', 'reduce', 'size', 'smaller', 'palette'],
  inputs: [
    { id: 'file', label: 'GIF File', type: 'file', accept: 'image/gif' },
  ],
  options: [
    {
      id: 'colorCount',
      label: 'Color Count',
      type: 'select',
      default: '128',
      options: [
        { label: '16 colors (smallest)', value: '16' },
        { label: '32 colors', value: '32' },
        { label: '64 colors', value: '64' },
        { label: '128 colors', value: '128' },
        { label: '256 colors (best quality)', value: '256' },
      ],
      helpText: 'Fewer colors = smaller file but lower quality.',
    },
    {
      id: 'lossyLevel',
      label: 'Lossy Level',
      type: 'range',
      default: 80,
      min: 0,
      max: 200,
      step: 10,
      helpText: '0 = lossless, higher = smaller file with more artifacts.',
    },
  ],
  output: { type: 'file', defaultFilename: 'optimized.gif', defaultMimeType: 'image/gif' },
  apiSupported: false,
  heavyDeps: ['ffmpeg'],
  async run(inputs, options, onProgress) {
    const file = inputs.file as File
    const colorCount = parseInt(options.colorCount as string)
    const lossyLevel = options.lossyLevel as number

    const ffmpeg = await getFFmpeg(onProgress)

    await writeInputFile(ffmpeg, 'input.gif', file)

    // Two-pass palette optimization
    const paletteArgs = [
      '-i', 'input.gif',
      '-vf', `palettegen=max_colors=${colorCount}:stats_mode=diff`,
      '-y', 'palette.png',
    ]
    await ffmpeg.exec(paletteArgs)

    const ditherArg = lossyLevel > 0 ? 'bayer:bayer_scale=5' : 'none'
    const renderArgs = [
      '-i', 'input.gif',
      '-i', 'palette.png',
      '-filter_complex', `paletteuse=dither=${ditherArg}`,
      '-y', 'output.gif',
    ]
    await ffmpeg.exec(renderArgs)

    const blob = await readOutputFile(ffmpeg, 'output.gif', 'image/gif')
    await cleanupFiles(ffmpeg, ['input.gif', 'palette.png', 'output.gif'])

    const baseName = file.name.replace(/\.[^.]+$/, '')
    const reduction = file.size > blob.size
      ? ` (${(((file.size - blob.size) / file.size) * 100).toFixed(1)}% smaller)`
      : ''
    return {
      type: 'file',
      data: blob,
      filename: `${baseName}-optimized.gif`,
      mimeType: 'image/gif',
      summary: `${(file.size / 1024 / 1024).toFixed(2)} MB → ${(blob.size / 1024 / 1024).toFixed(2)} MB${reduction}`,
    }
  },
}

registry.register(tool)
export default tool
