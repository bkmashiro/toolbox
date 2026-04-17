import { registry } from '../../core/registry'
import { getFFmpeg, writeInputFile, readOutputFile, cleanupFiles } from '../../core/ffmpeg'
import type { Tool } from '../../core/types'

const tool: Tool = {
  id: 'audio-normalize',
  name: 'Normalize Audio',
  description: 'Normalize audio volume to a target loudness using FFmpeg EBU R128 loudnorm filter',
  category: 'audio',
  tags: ['audio', 'normalize', 'volume', 'loudness', 'lufs', 'ebu', 'r128', 'level'],
  inputs: [
    { id: 'file', label: 'Audio File', type: 'file', accept: 'audio/*' },
  ],
  options: [
    {
      id: 'targetLoudness',
      label: 'Target Loudness (LUFS)',
      type: 'range',
      default: -16,
      min: -24,
      max: -14,
      step: 1,
      helpText: '-16 LUFS = streaming standard (Spotify/YouTube). -14 LUFS = louder.',
    },
    {
      id: 'truePeak',
      label: 'True Peak Limit (dBTP)',
      type: 'range',
      default: -1,
      min: -3,
      max: 0,
      step: 0.5,
      helpText: 'Maximum true peak level. -1 dBTP is recommended.',
    },
  ],
  output: { type: 'file' },
  apiSupported: false,
  heavyDeps: ['ffmpeg'],
  async run(inputs, options, onProgress) {
    const file = inputs.file as File
    const targetLoudness = options.targetLoudness as number
    const truePeak = options.truePeak as number

    const ffmpeg = await getFFmpeg(onProgress)
    const ext = file.name.split('.').pop() || 'mp3'
    const inputName = `input.${ext}`
    const outputName = `output.${ext}`

    await writeInputFile(ffmpeg, inputName, file)

    onProgress?.(20, 'Analyzing audio loudness (pass 1)...')

    // Two-pass loudnorm: pass 1 analyzes, pass 2 applies
    // Pass 1: print analysis to stderr and parse
    // For simplicity, use single-pass linear normalization
    const audioCodecMap: Record<string, string> = {
      mp3: 'libmp3lame', ogg: 'libvorbis', flac: 'flac',
      wav: 'pcm_s16le', aac: 'aac', opus: 'libopus', m4a: 'aac',
    }
    const codec = audioCodecMap[ext] || 'libmp3lame'

    const args: string[] = [
      '-i', inputName,
      '-af', `loudnorm=I=${targetLoudness}:TP=${truePeak}:LRA=11:print_format=summary`,
      '-codec:a', codec,
      '-y', outputName,
    ]

    await ffmpeg.exec(args)

    const mimeMap: Record<string, string> = {
      mp3: 'audio/mpeg', wav: 'audio/wav', ogg: 'audio/ogg',
      flac: 'audio/flac', aac: 'audio/aac', opus: 'audio/opus', m4a: 'audio/mp4',
    }
    const mimeType = mimeMap[ext] || 'audio/mpeg'
    const blob = await readOutputFile(ffmpeg, outputName, mimeType)
    await cleanupFiles(ffmpeg, [inputName, outputName])

    const baseName = file.name.replace(/\.[^.]+$/, '')
    return {
      type: 'file',
      data: blob,
      filename: `${baseName}-normalized.${ext}`,
      mimeType,
      summary: `Normalized to ${targetLoudness} LUFS, true peak ${truePeak} dBTP — ${(blob.size / 1024 / 1024).toFixed(2)} MB`,
    }
  },
}

registry.register(tool)
export default tool
