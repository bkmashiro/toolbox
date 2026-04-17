import { registry } from '../../core/registry'
import { getFFmpeg, writeInputFile, readOutputFile, cleanupFiles } from '../../core/ffmpeg'
import type { Tool } from '../../core/types'

const tool: Tool = {
  id: 'video-convert',
  name: 'Video Convert',
  description: 'Convert video between formats (MP4, MOV, AVI, WebM, MKV, 3GP → MP4, WebM, GIF, MP3, WAV, OGG)',
  category: 'video',
  tags: ['video', 'convert', 'mp4', 'webm', 'mov', 'avi', 'mkv', 'gif', 'mp3', 'wav', 'ogg', 'transcode'],
  inputs: [
    { id: 'file', label: 'Video File', type: 'file', accept: 'video/*' },
  ],
  options: [
    {
      id: 'format',
      label: 'Output Format',
      type: 'select',
      default: 'mp4',
      options: [
        { label: 'MP4', value: 'mp4' },
        { label: 'WebM', value: 'webm' },
        { label: 'GIF', value: 'gif' },
        { label: 'MP3 (audio only)', value: 'mp3' },
        { label: 'WAV (audio only)', value: 'wav' },
        { label: 'OGG (audio only)', value: 'ogg' },
      ],
    },
    {
      id: 'quality',
      label: 'Quality (CRF, lower = better)',
      type: 'range',
      default: 28,
      min: 18,
      max: 51,
      step: 1,
      helpText: '18 = high quality, 51 = low quality. Ignored for audio outputs.',
    },
    {
      id: 'resolution',
      label: 'Resolution',
      type: 'select',
      default: 'original',
      options: [
        { label: 'Original', value: 'original' },
        { label: '1080p', value: '1920x1080' },
        { label: '720p', value: '1280x720' },
        { label: '480p', value: '854x480' },
        { label: '360p', value: '640x360' },
      ],
      helpText: 'Scale video. Ignored for audio outputs.',
    },
    {
      id: 'startTime',
      label: 'Start Time',
      type: 'text',
      default: '',
      placeholder: '00:00:00',
      helpText: 'Trim start (HH:MM:SS or seconds). Leave empty for beginning.',
    },
    {
      id: 'endTime',
      label: 'End Time',
      type: 'text',
      default: '',
      placeholder: '00:01:30',
      helpText: 'Trim end (HH:MM:SS or seconds). Leave empty for end.',
    },
  ],
  output: { type: 'file' },
  apiSupported: false,
  heavyDeps: ['ffmpeg'],
  async run(inputs, options, onProgress) {
    const file = inputs.file as File
    const format = options.format as string
    const quality = options.quality as number
    const resolution = options.resolution as string
    const startTime = (options.startTime as string).trim()
    const endTime = (options.endTime as string).trim()

    const ffmpeg = await getFFmpeg(onProgress)
    const ext = file.name.split('.').pop() || 'mp4'
    const inputName = `input.${ext}`
    const outputName = `output.${format}`

    await writeInputFile(ffmpeg, inputName, file)

    const args: string[] = []

    if (startTime) args.push('-ss', startTime)
    args.push('-i', inputName)
    if (endTime) args.push('-to', endTime)

    const audioFormats = ['mp3', 'wav', 'ogg']
    if (audioFormats.includes(format)) {
      args.push('-vn')
      if (format === 'mp3') args.push('-codec:a', 'libmp3lame', '-qscale:a', '2')
      else if (format === 'ogg') args.push('-codec:a', 'libvorbis', '-qscale:a', '4')
    } else {
      if (resolution !== 'original') {
        const [w, h] = resolution.split('x')
        args.push('-vf', `scale=${w}:${h}`)
      }
      if (format === 'gif') {
        const filterArgs = resolution !== 'original'
          ? `scale=${resolution.split('x')[0]}:-1:flags=lanczos,split[s0][s1];[s0]palettegen[p];[s1][p]paletteuse`
          : 'split[s0][s1];[s0]palettegen[p];[s1][p]paletteuse'
        args.push('-filter_complex', filterArgs)
      } else {
        args.push('-crf', String(quality))
        if (format === 'webm') {
          args.push('-codec:v', 'libvpx-vp9', '-codec:a', 'libopus')
        } else {
          args.push('-codec:v', 'libx264', '-codec:a', 'aac', '-preset', 'fast')
        }
      }
    }

    args.push(outputName)
    await ffmpeg.exec(args)

    const mimeMap: Record<string, string> = {
      mp4: 'video/mp4',
      webm: 'video/webm',
      gif: 'image/gif',
      mp3: 'audio/mpeg',
      wav: 'audio/wav',
      ogg: 'audio/ogg',
    }
    const mimeType = mimeMap[format] || 'application/octet-stream'
    const blob = await readOutputFile(ffmpeg, outputName, mimeType)
    await cleanupFiles(ffmpeg, [inputName, outputName])

    const baseName = file.name.replace(/\.[^.]+$/, '')
    return {
      type: 'file',
      data: blob,
      filename: `${baseName}.${format}`,
      mimeType,
      summary: `Converted ${file.name} to ${format.toUpperCase()} (${(blob.size / 1024 / 1024).toFixed(2)} MB)`,
    }
  },
}

registry.register(tool)
export default tool
