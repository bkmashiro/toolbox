import { registry } from '../../core/registry'
import { getFFmpeg, cleanupFiles } from '../../core/ffmpeg'
import type { Tool } from '../../core/types'

const tool: Tool = {
  id: 'gif-make',
  name: 'Make GIF',
  description: 'Assemble multiple images into an animated GIF',
  category: 'gif',
  tags: ['gif', 'make', 'create', 'animate', 'images', 'frames', 'assemble'],
  inputs: [
    { id: 'files', label: 'Images (in order)', type: 'multifile', accept: 'image/*' },
  ],
  options: [
    {
      id: 'fps',
      label: 'Frames Per Second',
      type: 'range',
      default: 10,
      min: 1,
      max: 30,
      step: 1,
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
      id: 'resizeWidth',
      label: 'Resize Width',
      type: 'select',
      default: 'original',
      options: [
        { label: 'Original', value: 'original' },
        { label: '240px', value: '240' },
        { label: '360px', value: '360' },
        { label: '480px', value: '480' },
        { label: '640px', value: '640' },
      ],
    },
  ],
  output: { type: 'file', defaultFilename: 'animation.gif', defaultMimeType: 'image/gif' },
  apiSupported: false,
  heavyDeps: ['ffmpeg'],
  async run(inputs, options, onProgress) {
    const files = inputs.files as File[]
    if (!files || files.length === 0) throw new Error('Please provide at least one image.')

    const fps = options.fps as number
    const loop = options.loop as number
    const resizeWidth = options.resizeWidth as string

    const ffmpeg = await getFFmpeg(onProgress)
    const filenames: string[] = []

    onProgress?.(10, `Loading ${files.length} images...`)
    for (let i = 0; i < files.length; i++) {
      const ext = files[i].name.split('.').pop() || 'png'
      const name = `frame_${String(i).padStart(4, '0')}.${ext}`
      const data = new Uint8Array(await files[i].arrayBuffer())
      await ffmpeg.writeFile(name, data)
      filenames.push(name)
    }

    onProgress?.(40, 'Building GIF...')

    // Use concat demuxer for proper ordering
    const concatContent = filenames.map(f => `file '${f}'\nduration ${(1 / fps).toFixed(4)}`).join('\n')
    const concatData = new TextEncoder().encode(concatContent)
    await ffmpeg.writeFile('concat.txt', concatData)

    const scaleFilter = resizeWidth !== 'original'
      ? `scale=${resizeWidth}:-1:flags=lanczos,split[s0][s1];[s0]palettegen[p];[s1][p]paletteuse`
      : 'split[s0][s1];[s0]palettegen[p];[s1][p]paletteuse'

    const args: string[] = [
      '-f', 'concat',
      '-safe', '0',
      '-i', 'concat.txt',
      '-filter_complex', scaleFilter,
      '-loop', String(loop),
      '-y', 'output.gif',
    ]

    await ffmpeg.exec(args)

    const data = await ffmpeg.readFile('output.gif')
    const buf = data instanceof Uint8Array ? data.buffer.slice(0) : data
    const blob = new Blob([buf as ArrayBuffer], { type: 'image/gif' })

    await cleanupFiles(ffmpeg, [...filenames, 'concat.txt', 'output.gif'])

    return {
      type: 'file',
      data: blob,
      filename: 'animation.gif',
      mimeType: 'image/gif',
      summary: `GIF created from ${files.length} frames at ${fps} fps — ${(blob.size / 1024 / 1024).toFixed(2)} MB`,
    }
  },
}

registry.register(tool)
export default tool
