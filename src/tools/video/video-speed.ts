import { registry } from '../../core/registry'
import { getFFmpeg, writeInputFile, readOutputFile, cleanupFiles } from '../../core/ffmpeg'
import type { Tool } from '../../core/types'

const tool: Tool = {
  id: 'video-speed',
  name: 'Video Speed',
  description: 'Change video playback speed using setpts and atempo filters',
  category: 'video',
  tags: ['video', 'speed', 'fast', 'slow', 'tempo', 'slow-motion', 'timelapse'],
  inputs: [
    { id: 'file', label: 'Video File', type: 'file', accept: 'video/*' },
  ],
  options: [
    {
      id: 'speed',
      label: 'Speed',
      type: 'select',
      default: '2',
      options: [
        { label: '0.25x (very slow)', value: '0.25' },
        { label: '0.5x (slow)', value: '0.5' },
        { label: '1.5x (fast)', value: '1.5' },
        { label: '2x (double speed)', value: '2' },
        { label: '4x (quadruple)', value: '4' },
      ],
    },
    {
      id: 'adjustPitch',
      label: 'Adjust Audio Pitch',
      type: 'checkbox',
      default: true,
      helpText: 'Keep audio pitch natural when changing speed (avoids chipmunk/deep voice effect).',
    },
  ],
  output: { type: 'file' },
  apiSupported: false,
  heavyDeps: ['ffmpeg'],
  async run(inputs, options, onProgress) {
    const file = inputs.file as File
    const speed = parseFloat(options.speed as string)
    const adjustPitch = options.adjustPitch as boolean

    const ffmpeg = await getFFmpeg(onProgress)
    const ext = file.name.split('.').pop() || 'mp4'
    const inputName = `input.${ext}`
    const outputName = 'output.mp4'

    await writeInputFile(ffmpeg, inputName, file)

    // setpts: 1/speed means frames come faster (speed up) or slower (slow down)
    const vPts = 1 / speed
    const videoFilter = `setpts=${vPts}*PTS`

    // atempo only works in range [0.5, 2.0], chain if needed
    let audioFilter: string
    if (!adjustPitch) {
      // Just stretch/compress without pitch correction
      audioFilter = `atempo=${speed}`
    } else {
      // Build chained atempo for values outside [0.5, 2.0]
      const atempoChain: string[] = []
      let remaining = speed
      if (speed > 2) {
        while (remaining > 2) {
          atempoChain.push('atempo=2.0')
          remaining /= 2
        }
        atempoChain.push(`atempo=${remaining.toFixed(4)}`)
      } else if (speed < 0.5) {
        while (remaining < 0.5) {
          atempoChain.push('atempo=0.5')
          remaining /= 0.5
        }
        atempoChain.push(`atempo=${remaining.toFixed(4)}`)
      } else {
        atempoChain.push(`atempo=${speed}`)
      }
      audioFilter = atempoChain.join(',')
    }

    const args: string[] = [
      '-i', inputName,
      '-filter:v', videoFilter,
      '-filter:a', audioFilter,
      '-codec:v', 'libx264',
      '-codec:a', 'aac',
      '-preset', 'fast',
      '-y', outputName,
    ]

    await ffmpeg.exec(args)

    const blob = await readOutputFile(ffmpeg, outputName, 'video/mp4')
    await cleanupFiles(ffmpeg, [inputName, outputName])

    const baseName = file.name.replace(/\.[^.]+$/, '')
    const speedLabel = speed < 1 ? `${speed}x` : `${speed}x`
    return {
      type: 'file',
      data: blob,
      filename: `${baseName}-${speedLabel}-speed.mp4`,
      mimeType: 'video/mp4',
      summary: `Video speed changed to ${speedLabel} (${(blob.size / 1024 / 1024).toFixed(2)} MB)`,
    }
  },
}

registry.register(tool)
export default tool
