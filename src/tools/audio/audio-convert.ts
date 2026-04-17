import { registry } from '../../core/registry'
import { getFFmpeg, writeInputFile, readOutputFile, cleanupFiles } from '../../core/ffmpeg'
import type { Tool } from '../../core/types'

const tool: Tool = {
  id: 'audio-convert',
  name: 'Audio Convert',
  description: 'Convert between audio formats: MP3, WAV, OGG, FLAC, AAC, M4A, OPUS',
  category: 'audio',
  tags: ['audio', 'convert', 'mp3', 'wav', 'ogg', 'flac', 'aac', 'm4a', 'opus', 'transcode'],
  inputs: [
    { id: 'file', label: 'Audio File', type: 'file', accept: 'audio/*' },
  ],
  options: [
    {
      id: 'format',
      label: 'Output Format',
      type: 'select',
      default: 'mp3',
      options: [
        { label: 'MP3', value: 'mp3' },
        { label: 'WAV (lossless)', value: 'wav' },
        { label: 'OGG Vorbis', value: 'ogg' },
        { label: 'FLAC (lossless)', value: 'flac' },
        { label: 'AAC', value: 'aac' },
        { label: 'OPUS', value: 'opus' },
      ],
    },
    {
      id: 'bitrate',
      label: 'Bitrate (lossy formats)',
      type: 'select',
      default: '192k',
      options: [
        { label: '64k', value: '64k' },
        { label: '96k', value: '96k' },
        { label: '128k', value: '128k' },
        { label: '192k', value: '192k' },
        { label: '256k', value: '256k' },
        { label: '320k', value: '320k' },
      ],
      helpText: 'Ignored for WAV and FLAC (lossless).',
    },
    {
      id: 'sampleRate',
      label: 'Sample Rate',
      type: 'select',
      default: '44100',
      options: [
        { label: '22050 Hz', value: '22050' },
        { label: '44100 Hz (CD quality)', value: '44100' },
        { label: '48000 Hz (professional)', value: '48000' },
      ],
    },
  ],
  output: { type: 'file' },
  apiSupported: false,
  heavyDeps: ['ffmpeg'],
  async run(inputs, options, onProgress) {
    const file = inputs.file as File
    const format = options.format as string
    const bitrate = options.bitrate as string
    const sampleRate = options.sampleRate as string

    const ffmpeg = await getFFmpeg(onProgress)
    const ext = file.name.split('.').pop() || 'mp3'
    const inputName = `input.${ext}`
    const outputName = `output.${format}`

    await writeInputFile(ffmpeg, inputName, file)

    const args: string[] = ['-i', inputName, '-ar', sampleRate]

    const codecMap: Record<string, string> = {
      mp3: 'libmp3lame',
      ogg: 'libvorbis',
      aac: 'aac',
      opus: 'libopus',
      flac: 'flac',
      wav: 'pcm_s16le',
    }

    args.push('-codec:a', codecMap[format] || 'libmp3lame')

    const losslessFormats = ['flac', 'wav']
    if (!losslessFormats.includes(format)) {
      args.push('-b:a', bitrate)
    }

    args.push('-y', outputName)
    await ffmpeg.exec(args)

    const mimeMap: Record<string, string> = {
      mp3: 'audio/mpeg',
      wav: 'audio/wav',
      ogg: 'audio/ogg',
      flac: 'audio/flac',
      aac: 'audio/aac',
      opus: 'audio/opus',
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
      summary: `Converted to ${format.toUpperCase()} at ${sampleRate} Hz — ${(blob.size / 1024 / 1024).toFixed(2)} MB`,
    }
  },
}

registry.register(tool)
export default tool
