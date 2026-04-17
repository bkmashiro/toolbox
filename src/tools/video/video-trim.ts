import { registry } from '../../core/registry'
import { getFFmpeg, writeInputFile, readOutputFile, cleanupFiles } from '../../core/ffmpeg'
import type { Tool } from '../../core/types'

const tool: Tool = {
  id: 'video-trim',
  name: 'Trim Video',
  description: 'Trim video to a specific time range with fast copy or re-encode mode',
  category: 'video',
  tags: ['video', 'trim', 'cut', 'clip', 'shorten', 'crop', 'time'],
  inputs: [
    { id: 'file', label: 'Video File', type: 'file', accept: 'video/*' },
  ],
  options: [
    {
      id: 'startTime',
      label: 'Start Time',
      type: 'text',
      default: '00:00:00',
      placeholder: '00:00:00',
      helpText: 'Trim start time (HH:MM:SS or seconds)',
    },
    {
      id: 'endTime',
      label: 'End Time',
      type: 'text',
      default: '',
      placeholder: '00:01:00',
      helpText: 'Trim end time (HH:MM:SS or seconds). Leave empty for end of video.',
    },
    {
      id: 'reencode',
      label: 'Re-encode',
      type: 'checkbox',
      default: false,
      helpText: 'Re-encode for frame-accurate cuts (slower). Fast copy mode may have slight imprecision near keyframes.',
    },
  ],
  output: { type: 'file' },
  apiSupported: false,
  heavyDeps: ['ffmpeg'],
  async run(inputs, options, onProgress) {
    const file = inputs.file as File
    const startTime = (options.startTime as string).trim() || '0'
    const endTime = (options.endTime as string).trim()
    const reencode = options.reencode as boolean

    const ffmpeg = await getFFmpeg(onProgress)
    const ext = file.name.split('.').pop() || 'mp4'
    const inputName = `input.${ext}`
    const outputName = `output.${ext}`

    await writeInputFile(ffmpeg, inputName, file)

    const args: string[] = ['-ss', startTime, '-i', inputName]
    if (endTime) args.push('-to', endTime)

    if (reencode) {
      args.push('-codec:v', 'libx264', '-codec:a', 'aac', '-preset', 'fast', '-crf', '23')
    } else {
      args.push('-codec', 'copy')
    }

    args.push('-y', outputName)
    await ffmpeg.exec(args)

    const mimeMap: Record<string, string> = {
      mp4: 'video/mp4',
      webm: 'video/webm',
      mov: 'video/quicktime',
      avi: 'video/x-msvideo',
      mkv: 'video/x-matroska',
    }
    const mimeType = mimeMap[ext] || 'video/mp4'
    const blob = await readOutputFile(ffmpeg, outputName, mimeType)
    await cleanupFiles(ffmpeg, [inputName, outputName])

    const baseName = file.name.replace(/\.[^.]+$/, '')
    return {
      type: 'file',
      data: blob,
      filename: `${baseName}-trimmed.${ext}`,
      mimeType,
      summary: `Trimmed from ${startTime} to ${endTime || 'end'} (${(blob.size / 1024 / 1024).toFixed(2)} MB)`,
    }
  },
}

registry.register(tool)
export default tool
