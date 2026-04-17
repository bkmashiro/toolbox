import { registry } from '../../core/registry'
import { getFFmpeg, writeInputFile, readOutputFile, cleanupFiles } from '../../core/ffmpeg'
import type { Tool } from '../../core/types'

const tool: Tool = {
  id: 'audio-trim',
  name: 'Trim Audio',
  description: 'Trim audio to a specific time range with optional fade in/out',
  category: 'audio',
  tags: ['audio', 'trim', 'cut', 'clip', 'shorten', 'fade', 'time'],
  inputs: [
    { id: 'file', label: 'Audio File', type: 'file', accept: 'audio/*' },
  ],
  options: [
    {
      id: 'startTime',
      label: 'Start Time',
      type: 'text',
      default: '00:00:00',
      placeholder: '00:00:00',
      helpText: 'Trim start (HH:MM:SS or seconds)',
    },
    {
      id: 'endTime',
      label: 'End Time',
      type: 'text',
      default: '',
      placeholder: '00:01:00',
      helpText: 'Trim end (HH:MM:SS or seconds). Leave empty for end of file.',
    },
    {
      id: 'fadeIn',
      label: 'Fade In (ms)',
      type: 'number',
      default: 0,
      min: 0,
      max: 5000,
      step: 100,
      helpText: 'Apply fade-in at start (milliseconds)',
    },
    {
      id: 'fadeOut',
      label: 'Fade Out (ms)',
      type: 'number',
      default: 0,
      min: 0,
      max: 5000,
      step: 100,
      helpText: 'Apply fade-out at end (milliseconds)',
    },
  ],
  output: { type: 'file' },
  apiSupported: false,
  heavyDeps: ['ffmpeg'],
  async run(inputs, options, onProgress) {
    const file = inputs.file as File
    const startTime = (options.startTime as string).trim() || '0'
    const endTime = (options.endTime as string).trim()
    const fadeIn = options.fadeIn as number
    const fadeOut = options.fadeOut as number

    const ffmpeg = await getFFmpeg(onProgress)
    const ext = file.name.split('.').pop() || 'mp3'
    const inputName = `input.${ext}`
    const outputName = `output.${ext}`

    await writeInputFile(ffmpeg, inputName, file)

    const args: string[] = ['-ss', startTime, '-i', inputName]
    if (endTime) args.push('-to', endTime)

    const filters: string[] = []
    if (fadeIn > 0) filters.push(`afade=t=in:st=0:d=${fadeIn / 1000}`)
    if (fadeOut > 0 && endTime) {
      // Calculate fade out start from end time
      const toSecs = parseTimestamp(endTime) - parseTimestamp(startTime)
      const fadeOutStart = Math.max(0, toSecs - fadeOut / 1000)
      filters.push(`afade=t=out:st=${fadeOutStart}:d=${fadeOut / 1000}`)
    }

    if (filters.length > 0) {
      args.push('-af', filters.join(','))
    }

    args.push('-codec:a', 'copy', '-y', outputName)

    // If fade filters are applied, we need to re-encode
    if (filters.length > 0) {
      // Replace -codec:a copy with appropriate encoder
      const codecIdx = args.indexOf('-codec:a')
      if (codecIdx !== -1) {
        const audioCodecMap: Record<string, string> = {
          mp3: 'libmp3lame', ogg: 'libvorbis', flac: 'flac',
          wav: 'pcm_s16le', aac: 'aac', opus: 'libopus', m4a: 'aac',
        }
        args[codecIdx + 1] = audioCodecMap[ext] || 'libmp3lame'
      }
    }

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
      filename: `${baseName}-trimmed.${ext}`,
      mimeType,
      summary: `Trimmed from ${startTime} to ${endTime || 'end'} — ${(blob.size / 1024 / 1024).toFixed(2)} MB`,
    }
  },
}

function parseTimestamp(ts: string): number {
  if (!isNaN(parseFloat(ts))) return parseFloat(ts)
  const parts = ts.split(':').map(Number)
  if (parts.length === 3) return parts[0] * 3600 + parts[1] * 60 + parts[2]
  if (parts.length === 2) return parts[0] * 60 + parts[1]
  return 0
}

registry.register(tool)
export default tool
