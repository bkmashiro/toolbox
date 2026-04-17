import { registry } from '../../core/registry'
import { getFFmpeg, writeInputFile, readOutputFile, cleanupFiles } from '../../core/ffmpeg'
import type { Tool } from '../../core/types'

const tool: Tool = {
  id: 'video-add-subtitle',
  name: 'Add Subtitle',
  description: 'Burn SRT/VTT/ASS subtitle file into video (hardcoded subtitles)',
  category: 'video',
  tags: ['video', 'subtitle', 'caption', 'srt', 'vtt', 'ass', 'burn', 'hardcode'],
  inputs: [
    { id: 'file', label: 'Video File', type: 'file', accept: 'video/*' },
    { id: 'subtitle', label: 'Subtitle File', type: 'file', accept: '.srt,.vtt,.ass,.ssa' },
  ],
  options: [
    {
      id: 'fontSize',
      label: 'Font Size',
      type: 'range',
      default: 24,
      min: 16,
      max: 48,
      step: 1,
    },
    {
      id: 'position',
      label: 'Position',
      type: 'select',
      default: 'bottom',
      options: [
        { label: 'Bottom', value: 'bottom' },
        { label: 'Top', value: 'top' },
      ],
    },
    {
      id: 'fontColor',
      label: 'Font Color',
      type: 'color',
      default: '#ffffff',
    },
  ],
  output: { type: 'file' },
  apiSupported: false,
  heavyDeps: ['ffmpeg'],
  async run(inputs, options, onProgress) {
    const file = inputs.file as File
    const subtitleFile = inputs.subtitle as File
    const fontSize = options.fontSize as number
    const position = options.position as string
    const fontColor = (options.fontColor as string).replace('#', '')

    const ffmpeg = await getFFmpeg(onProgress)
    const ext = file.name.split('.').pop() || 'mp4'
    const subExt = subtitleFile.name.split('.').pop() || 'srt'
    const inputName = `input.${ext}`
    const subName = `subtitle.${subExt}`
    const outputName = 'output.mp4'

    await writeInputFile(ffmpeg, inputName, file)
    await writeInputFile(ffmpeg, subName, subtitleFile)

    // MarginV: distance from edge; 10 = bottom, negative for top
    const marginV = position === 'top' ? -10 : 10
    // Convert hex color to ASS format (&HAABBGGRR), alpha=00 (opaque)
    const r = fontColor.slice(0, 2)
    const g = fontColor.slice(2, 4)
    const b = fontColor.slice(4, 6)
    const assColor = `&H00${b}${g}${r}`

    const subtitleFilter = `subtitles=${subName}:force_style='FontSize=${fontSize},PrimaryColour=${assColor},MarginV=${Math.abs(marginV)},Alignment=${position === 'top' ? 6 : 2}'`

    const args: string[] = [
      '-i', inputName,
      '-vf', subtitleFilter,
      '-codec:v', 'libx264', '-preset', 'fast', '-crf', '23',
      '-codec:a', 'copy',
      '-y', outputName,
    ]

    await ffmpeg.exec(args)

    const blob = await readOutputFile(ffmpeg, outputName, 'video/mp4')
    await cleanupFiles(ffmpeg, [inputName, subName, outputName])

    const baseName = file.name.replace(/\.[^.]+$/, '')
    return {
      type: 'file',
      data: blob,
      filename: `${baseName}-subtitled.mp4`,
      mimeType: 'video/mp4',
      summary: `Subtitle burned in at ${position}, font size ${fontSize} — ${(blob.size / 1024 / 1024).toFixed(2)} MB`,
    }
  },
}

registry.register(tool)
export default tool
