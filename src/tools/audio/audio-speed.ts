import { registry } from '../../core/registry'
import { getFFmpeg, writeInputFile, readOutputFile, cleanupFiles } from '../../core/ffmpeg'
import type { Tool } from '../../core/types'

const tool: Tool = {
  id: 'audio-speed',
  name: 'Audio Speed',
  description: 'Change audio playback speed using the atempo filter, with optional pitch preservation',
  category: 'audio',
  tags: ['audio', 'speed', 'tempo', 'fast', 'slow', 'pitch', 'atempo'],
  inputs: [
    { id: 'file', label: 'Audio File', type: 'file', accept: 'audio/*' },
  ],
  options: [
    {
      id: 'speed',
      label: 'Speed',
      type: 'select',
      default: '1.5',
      options: [
        { label: '0.5x (half speed)', value: '0.5' },
        { label: '0.75x', value: '0.75' },
        { label: '1.25x', value: '1.25' },
        { label: '1.5x', value: '1.5' },
        { label: '2x (double speed)', value: '2' },
      ],
    },
    {
      id: 'preservePitch',
      label: 'Preserve Pitch',
      type: 'checkbox',
      default: true,
      helpText: 'Keep original pitch when changing speed (uses atempo filter). Unchecked = pitch shifts with speed.',
    },
  ],
  output: { type: 'file' },
  apiSupported: false,
  heavyDeps: ['ffmpeg'],
  async run(inputs, options, onProgress) {
    const file = inputs.file as File
    const speed = parseFloat(options.speed as string)
    const preservePitch = options.preservePitch as boolean

    const ffmpeg = await getFFmpeg(onProgress)
    const ext = file.name.split('.').pop() || 'mp3'
    const inputName = `input.${ext}`
    const outputName = `output.${ext}`

    await writeInputFile(ffmpeg, inputName, file)

    const audioCodecMap: Record<string, string> = {
      mp3: 'libmp3lame', ogg: 'libvorbis', flac: 'flac',
      wav: 'pcm_s16le', aac: 'aac', opus: 'libopus', m4a: 'aac',
    }
    const codec = audioCodecMap[ext] || 'libmp3lame'

    let audioFilter: string
    if (preservePitch) {
      // atempo only works in [0.5, 2.0], chain for values outside range
      const chain: string[] = []
      let remaining = speed
      if (speed > 2) {
        while (remaining > 2) { chain.push('atempo=2.0'); remaining /= 2 }
        chain.push(`atempo=${remaining.toFixed(4)}`)
      } else if (speed < 0.5) {
        while (remaining < 0.5) { chain.push('atempo=0.5'); remaining /= 0.5 }
        chain.push(`atempo=${remaining.toFixed(4)}`)
      } else {
        chain.push(`atempo=${speed}`)
      }
      audioFilter = chain.join(',')
    } else {
      // Use asetrate trick: change sample rate to shift pitch with speed
      const originalRate = 44100
      audioFilter = `asetrate=${Math.round(originalRate * speed)},aresample=${originalRate}`
    }

    const args: string[] = [
      '-i', inputName,
      '-af', audioFilter,
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
      filename: `${baseName}-${speed}x.${ext}`,
      mimeType,
      summary: `Speed changed to ${speed}x${preservePitch ? ' (pitch preserved)' : ''} — ${(blob.size / 1024 / 1024).toFixed(2)} MB`,
    }
  },
}

registry.register(tool)
export default tool
