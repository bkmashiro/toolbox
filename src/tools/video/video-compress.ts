import { registry } from '../../core/registry'
import { getFFmpeg, writeInputFile, readOutputFile, cleanupFiles } from '../../core/ffmpeg'
import type { Tool } from '../../core/types'

const tool: Tool = {
  id: 'video-compress',
  name: 'Compress Video',
  description: 'Reduce video file size using CRF quality slider and optional resolution scaling',
  category: 'video',
  tags: ['video', 'compress', 'reduce', 'size', 'smaller', 'crf', 'quality'],
  inputs: [
    { id: 'file', label: 'Video File', type: 'file', accept: 'video/*' },
  ],
  options: [
    {
      id: 'crf',
      label: 'CRF Quality (higher = smaller file)',
      type: 'range',
      default: 32,
      min: 18,
      max: 51,
      step: 1,
      helpText: '18 = near lossless, 32 = medium compression, 51 = maximum compression',
    },
    {
      id: 'maxBitrate',
      label: 'Max Video Bitrate',
      type: 'select',
      default: '',
      options: [
        { label: 'No limit', value: '' },
        { label: '500k', value: '500k' },
        { label: '1M', value: '1M' },
        { label: '2M', value: '2M' },
        { label: '4M', value: '4M' },
        { label: '8M', value: '8M' },
      ],
    },
    {
      id: 'audioBitrate',
      label: 'Audio Bitrate',
      type: 'select',
      default: '128k',
      options: [
        { label: '64k', value: '64k' },
        { label: '96k', value: '96k' },
        { label: '128k', value: '128k' },
        { label: '192k', value: '192k' },
      ],
    },
    {
      id: 'resolution',
      label: 'Resolution',
      type: 'select',
      default: 'original',
      options: [
        { label: 'Original', value: 'original' },
        { label: '1080p', value: '1920:1080' },
        { label: '720p', value: '1280:720' },
        { label: '480p', value: '854:480' },
        { label: '360p', value: '640:360' },
      ],
    },
  ],
  output: { type: 'file' },
  apiSupported: false,
  heavyDeps: ['ffmpeg'],
  async run(inputs, options, onProgress) {
    const file = inputs.file as File
    const crf = options.crf as number
    const maxBitrate = (options.maxBitrate as string).trim()
    const audioBitrate = options.audioBitrate as string
    const resolution = options.resolution as string

    const ffmpeg = await getFFmpeg(onProgress)
    const ext = file.name.split('.').pop() || 'mp4'
    const inputName = `input.${ext}`
    const outputName = 'output.mp4'

    await writeInputFile(ffmpeg, inputName, file)

    const args: string[] = ['-i', inputName, '-codec:v', 'libx264', '-crf', String(crf), '-preset', 'medium']

    if (resolution !== 'original') {
      const [w, h] = resolution.split(':')
      args.push('-vf', `scale=${w}:${h}`)
    }

    if (maxBitrate) {
      args.push('-maxrate', maxBitrate, '-bufsize', `${parseInt(maxBitrate) * 2}k`)
    }

    args.push('-codec:a', 'aac', '-b:a', audioBitrate)
    args.push('-movflags', '+faststart', '-y', outputName)

    await ffmpeg.exec(args)

    const blob = await readOutputFile(ffmpeg, outputName, 'video/mp4')
    await cleanupFiles(ffmpeg, [inputName, outputName])

    const baseName = file.name.replace(/\.[^.]+$/, '')
    const reduction = (((file.size - blob.size) / file.size) * 100).toFixed(1)
    return {
      type: 'file',
      data: blob,
      filename: `${baseName}-compressed.mp4`,
      mimeType: 'video/mp4',
      summary: `${(file.size / 1024 / 1024).toFixed(2)} MB → ${(blob.size / 1024 / 1024).toFixed(2)} MB (${reduction}% smaller)`,
    }
  },
}

registry.register(tool)
export default tool
