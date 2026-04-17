import { registry } from '../../core/registry'
import { getFFmpeg, writeInputFile, readOutputFile, cleanupFiles } from '../../core/ffmpeg'
import type { Tool } from '../../core/types'

const tool: Tool = {
  id: 'video-screenshot',
  name: 'Video Screenshot',
  description: 'Extract a single frame from a video at a specific timestamp',
  category: 'video',
  tags: ['video', 'screenshot', 'frame', 'capture', 'still', 'image', 'thumbnail'],
  inputs: [
    { id: 'file', label: 'Video File', type: 'file', accept: 'video/*' },
  ],
  options: [
    {
      id: 'timestamp',
      label: 'Timestamp',
      type: 'text',
      default: '00:00:01',
      placeholder: '00:00:01',
      helpText: 'Time to capture frame (HH:MM:SS.ms or seconds)',
    },
    {
      id: 'format',
      label: 'Output Format',
      type: 'select',
      default: 'png',
      options: [
        { label: 'PNG (lossless)', value: 'png' },
        { label: 'JPEG', value: 'jpg' },
      ],
    },
  ],
  output: { type: 'file' },
  apiSupported: false,
  heavyDeps: ['ffmpeg'],
  async run(inputs, options, onProgress) {
    const file = inputs.file as File
    const timestamp = (options.timestamp as string).trim() || '00:00:01'
    const format = options.format as string

    const ffmpeg = await getFFmpeg(onProgress)
    const ext = file.name.split('.').pop() || 'mp4'
    const inputName = `input.${ext}`
    const outputName = `screenshot.${format}`

    await writeInputFile(ffmpeg, inputName, file)

    const args: string[] = [
      '-ss', timestamp,
      '-i', inputName,
      '-frames:v', '1',
      '-y', outputName,
    ]

    await ffmpeg.exec(args)

    const mimeType = format === 'png' ? 'image/png' : 'image/jpeg'
    const blob = await readOutputFile(ffmpeg, outputName, mimeType)
    await cleanupFiles(ffmpeg, [inputName, outputName])

    const baseName = file.name.replace(/\.[^.]+$/, '')
    return {
      type: 'file',
      data: blob,
      filename: `${baseName}-screenshot-${timestamp.replace(/:/g, '-')}.${format}`,
      mimeType,
      summary: `Frame captured at ${timestamp} (${(blob.size / 1024).toFixed(1)} KB)`,
    }
  },
}

registry.register(tool)
export default tool
