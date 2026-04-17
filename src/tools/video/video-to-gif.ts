import { registry } from '../../core/registry'
import { getFFmpeg, writeInputFile, readOutputFile, cleanupFiles } from '../../core/ffmpeg'
import type { Tool } from '../../core/types'

const tool: Tool = {
  id: 'video-to-gif',
  name: 'Video to GIF',
  description: 'Convert video to animated GIF with advanced palette optimization',
  category: 'video',
  tags: ['video', 'gif', 'convert', 'animate', 'animated'],
  inputs: [
    { id: 'file', label: 'Video File', type: 'file', accept: 'video/*' },
  ],
  options: [
    {
      id: 'fps',
      label: 'Frame Rate (FPS)',
      type: 'select',
      default: '12',
      options: [
        { label: '6 fps', value: '6' },
        { label: '8 fps', value: '8' },
        { label: '12 fps', value: '12' },
        { label: '15 fps', value: '15' },
        { label: '24 fps', value: '24' },
      ],
    },
    {
      id: 'width',
      label: 'Width',
      type: 'select',
      default: '480',
      options: [
        { label: '240px', value: '240' },
        { label: '360px', value: '360' },
        { label: '480px', value: '480' },
        { label: '640px', value: '640' },
        { label: 'Original', value: '-1' },
      ],
    },
    {
      id: 'startTime',
      label: 'Start Time',
      type: 'text',
      default: '',
      placeholder: '00:00:00',
      helpText: 'Clip start (HH:MM:SS or seconds). Leave empty for beginning.',
    },
    {
      id: 'endTime',
      label: 'End Time',
      type: 'text',
      default: '',
      placeholder: '00:00:10',
      helpText: 'Clip end (HH:MM:SS or seconds). Leave empty for end.',
    },
    {
      id: 'dither',
      label: 'Dithering',
      type: 'select',
      default: 'bayer',
      options: [
        { label: 'Bayer (sharp, less banding)', value: 'bayer' },
        { label: 'Sierra2_4a (smoother)', value: 'sierra2_4a' },
        { label: 'None', value: 'none' },
      ],
    },
    {
      id: 'loop',
      label: 'Loop Count',
      type: 'number',
      default: 0,
      min: 0,
      max: 100,
      helpText: '0 = infinite loop',
    },
    {
      id: 'optimizePalette',
      label: 'Optimize Palette',
      type: 'checkbox',
      default: true,
      helpText: 'Generate a per-GIF optimal palette for better quality.',
    },
  ],
  output: { type: 'file', defaultFilename: 'output.gif', defaultMimeType: 'image/gif' },
  apiSupported: false,
  heavyDeps: ['ffmpeg'],
  async run(inputs, options, onProgress) {
    const file = inputs.file as File
    const fps = options.fps as string
    const width = options.width as string
    const startTime = (options.startTime as string).trim()
    const endTime = (options.endTime as string).trim()
    const dither = options.dither as string
    const loop = options.loop as number
    const optimizePalette = options.optimizePalette as boolean

    const ffmpeg = await getFFmpeg(onProgress)
    const ext = file.name.split('.').pop() || 'mp4'
    const inputName = `input.${ext}`
    const paletteName = 'palette.png'
    const outputName = 'output.gif'

    await writeInputFile(ffmpeg, inputName, file)

    const scaleFilter = `fps=${fps},scale=${width}:-1:flags=lanczos`

    if (optimizePalette) {
      // Pass 1: generate palette
      const pass1Args: string[] = []
      if (startTime) pass1Args.push('-ss', startTime)
      pass1Args.push('-i', inputName)
      if (endTime) pass1Args.push('-to', endTime)
      pass1Args.push('-vf', `${scaleFilter},palettegen=stats_mode=diff`)
      pass1Args.push('-y', paletteName)
      await ffmpeg.exec(pass1Args)

      // Pass 2: render GIF
      const ditherStr = dither === 'none' ? 'none' : `${dither}:bayer_scale=5`
      const pass2Args: string[] = []
      if (startTime) pass2Args.push('-ss', startTime)
      pass2Args.push('-i', inputName)
      if (endTime) pass2Args.push('-to', endTime)
      pass2Args.push('-i', paletteName)
      pass2Args.push('-filter_complex', `${scaleFilter}[x];[x][1:v]paletteuse=dither=${ditherStr}`)
      pass2Args.push('-loop', String(loop))
      pass2Args.push('-y', outputName)
      await ffmpeg.exec(pass2Args)
    } else {
      const args: string[] = []
      if (startTime) args.push('-ss', startTime)
      args.push('-i', inputName)
      if (endTime) args.push('-to', endTime)
      args.push('-vf', scaleFilter)
      args.push('-loop', String(loop))
      args.push('-y', outputName)
      await ffmpeg.exec(args)
    }

    const blob = await readOutputFile(ffmpeg, outputName, 'image/gif')
    await cleanupFiles(ffmpeg, [inputName, paletteName, outputName])

    const baseName = file.name.replace(/\.[^.]+$/, '')
    return {
      type: 'file',
      data: blob,
      filename: `${baseName}.gif`,
      mimeType: 'image/gif',
      summary: `GIF created: ${(blob.size / 1024 / 1024).toFixed(2)} MB at ${fps} fps, ${width === '-1' ? 'original' : width + 'px'} wide`,
    }
  },
}

registry.register(tool)
export default tool
