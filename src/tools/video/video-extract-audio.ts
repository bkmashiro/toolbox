import { registry } from '../../core/registry'
import { getFFmpeg, writeInputFile, readOutputFile, cleanupFiles } from '../../core/ffmpeg'
import type { Tool } from '../../core/types'

const tool: Tool = {
  id: 'video-extract-audio',
  name: 'Extract Audio',
  description: 'Extract the audio track from a video file as MP3, WAV, OGG, or FLAC',
  category: 'video',
  tags: ['video', 'audio', 'extract', 'mp3', 'wav', 'ogg', 'flac', 'rip', 'soundtrack'],
  inputs: [
    { id: 'file', label: 'Video File', type: 'file', accept: 'video/*' },
  ],
  options: [
    {
      id: 'format',
      label: 'Audio Format',
      type: 'select',
      default: 'mp3',
      options: [
        { label: 'MP3', value: 'mp3' },
        { label: 'WAV (lossless)', value: 'wav' },
        { label: 'OGG Vorbis', value: 'ogg' },
        { label: 'FLAC (lossless)', value: 'flac' },
      ],
    },
    {
      id: 'bitrate',
      label: 'Bitrate (lossy formats)',
      type: 'select',
      default: '192k',
      options: [
        { label: '96k', value: '96k' },
        { label: '128k', value: '128k' },
        { label: '192k', value: '192k' },
        { label: '256k', value: '256k' },
        { label: '320k', value: '320k' },
      ],
      helpText: 'Ignored for WAV and FLAC (lossless formats).',
    },
  ],
  output: { type: 'file' },
  apiSupported: false,
  heavyDeps: ['ffmpeg'],
  async run(inputs, options, onProgress) {
    const file = inputs.file as File
    const format = options.format as string
    const bitrate = options.bitrate as string

    const ffmpeg = await getFFmpeg(onProgress)
    const ext = file.name.split('.').pop() || 'mp4'
    const inputName = `input.${ext}`
    const outputName = `output.${format}`

    await writeInputFile(ffmpeg, inputName, file)

    const args: string[] = ['-i', inputName, '-vn']

    if (format === 'mp3') {
      args.push('-codec:a', 'libmp3lame', '-b:a', bitrate)
    } else if (format === 'ogg') {
      args.push('-codec:a', 'libvorbis', '-b:a', bitrate)
    } else if (format === 'flac') {
      args.push('-codec:a', 'flac')
    } else {
      // wav
      args.push('-codec:a', 'pcm_s16le')
    }

    args.push('-y', outputName)
    await ffmpeg.exec(args)

    const mimeMap: Record<string, string> = {
      mp3: 'audio/mpeg',
      wav: 'audio/wav',
      ogg: 'audio/ogg',
      flac: 'audio/flac',
    }
    const mimeType = mimeMap[format] || 'audio/mpeg'
    const blob = await readOutputFile(ffmpeg, outputName, mimeType)
    await cleanupFiles(ffmpeg, [inputName, outputName])

    const baseName = file.name.replace(/\.[^.]+$/, '')
    return {
      type: 'file',
      data: blob,
      filename: `${baseName}.${format}`,
      mimeType,
      summary: `Audio extracted as ${format.toUpperCase()} — ${(blob.size / 1024 / 1024).toFixed(2)} MB`,
    }
  },
}

registry.register(tool)
export default tool
