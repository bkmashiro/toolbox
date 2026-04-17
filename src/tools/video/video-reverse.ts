import { registry } from '../../core/registry'
import { getFFmpeg, writeInputFile, readOutputFile, cleanupFiles } from '../../core/ffmpeg'
import type { Tool } from '../../core/types'

const tool: Tool = {
  id: 'video-reverse',
  name: 'Reverse Video',
  description: 'Reverse video playback, optionally including audio',
  category: 'video',
  tags: ['video', 'reverse', 'backwards', 'rewind', 'flip'],
  inputs: [
    { id: 'file', label: 'Video File', type: 'file', accept: 'video/*' },
  ],
  options: [
    {
      id: 'includeAudio',
      label: 'Include Audio (reversed)',
      type: 'checkbox',
      default: false,
      helpText: 'Reverse the audio track as well. Note: this requires loading the entire file into memory.',
    },
  ],
  output: { type: 'file' },
  apiSupported: false,
  heavyDeps: ['ffmpeg'],
  async run(inputs, options, onProgress) {
    const file = inputs.file as File
    const includeAudio = options.includeAudio as boolean

    const ffmpeg = await getFFmpeg(onProgress)
    const ext = file.name.split('.').pop() || 'mp4'
    const inputName = `input.${ext}`
    const outputName = 'output.mp4'

    await writeInputFile(ffmpeg, inputName, file)

    const args: string[] = ['-i', inputName]

    if (includeAudio) {
      args.push('-vf', 'reverse', '-af', 'areverse')
    } else {
      args.push('-vf', 'reverse', '-an')
    }

    args.push('-codec:v', 'libx264', '-preset', 'fast', '-crf', '23', '-y', outputName)

    await ffmpeg.exec(args)

    const blob = await readOutputFile(ffmpeg, outputName, 'video/mp4')
    await cleanupFiles(ffmpeg, [inputName, outputName])

    const baseName = file.name.replace(/\.[^.]+$/, '')
    return {
      type: 'file',
      data: blob,
      filename: `${baseName}-reversed.mp4`,
      mimeType: 'video/mp4',
      summary: `Video reversed${includeAudio ? ' (with audio)' : ' (video only)'} — ${(blob.size / 1024 / 1024).toFixed(2)} MB`,
    }
  },
}

registry.register(tool)
export default tool
