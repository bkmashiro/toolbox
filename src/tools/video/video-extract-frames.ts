import { registry } from '../../core/registry'
import { getFFmpeg, writeInputFile, cleanupFiles } from '../../core/ffmpeg'
import type { Tool } from '../../core/types'

const tool: Tool = {
  id: 'video-extract-frames',
  name: 'Extract Frames',
  description: 'Extract frames from video as PNG or JPEG images, delivered as a ZIP archive',
  category: 'video',
  tags: ['video', 'frames', 'extract', 'png', 'jpeg', 'images', 'zip', 'screenshot'],
  inputs: [
    { id: 'file', label: 'Video File', type: 'file', accept: 'video/*' },
  ],
  options: [
    {
      id: 'mode',
      label: 'Extraction Mode',
      type: 'select',
      default: 'interval',
      options: [
        { label: 'Every N seconds', value: 'interval' },
        { label: 'Total N frames', value: 'count' },
      ],
    },
    {
      id: 'interval',
      label: 'Interval (seconds)',
      type: 'number',
      default: 1,
      min: 0.1,
      max: 3600,
      step: 0.1,
      helpText: 'Extract one frame every N seconds.',
      showWhen: { optionId: 'mode', value: 'interval' },
    },
    {
      id: 'frameCount',
      label: 'Number of Frames',
      type: 'number',
      default: 10,
      min: 1,
      max: 500,
      step: 1,
      helpText: 'Extract this many frames evenly distributed throughout the video.',
      showWhen: { optionId: 'mode', value: 'count' },
    },
    {
      id: 'format',
      label: 'Image Format',
      type: 'select',
      default: 'png',
      options: [
        { label: 'PNG (lossless)', value: 'png' },
        { label: 'JPEG (smaller)', value: 'jpg' },
      ],
    },
    {
      id: 'jpegQuality',
      label: 'JPEG Quality',
      type: 'range',
      default: 85,
      min: 60,
      max: 100,
      step: 1,
      showWhen: { optionId: 'format', value: 'jpg' },
    },
  ],
  output: { type: 'file', defaultFilename: 'frames.zip', defaultMimeType: 'application/zip' },
  apiSupported: false,
  heavyDeps: ['ffmpeg'],
  async run(inputs, options, onProgress) {
    const file = inputs.file as File
    const mode = options.mode as string
    const interval = options.interval as number
    const frameCount = options.frameCount as number
    const format = options.format as string
    const jpegQuality = options.jpegQuality as number

    const ffmpeg = await getFFmpeg(onProgress)
    const ext = file.name.split('.').pop() || 'mp4'
    const inputName = `input.${ext}`

    await writeInputFile(ffmpeg, inputName, file)
    onProgress?.(10, 'Video loaded, extracting frames...')

    const args: string[] = ['-i', inputName]

    if (mode === 'interval') {
      args.push('-vf', `fps=1/${interval}`)
    } else {
      // Use select filter to pick evenly spaced frames
      args.push('-vf', `select='not(mod(n\\,max(1\\,trunc(nb_frames/${frameCount}))))',setpts=N/FRAME_RATE/TB`)
      args.push('-vsync', 'vfr')
    }

    if (format === 'jpg') {
      args.push('-q:v', String(Math.round((100 - jpegQuality) / 100 * 31 + 1)))
    }

    args.push(`frame_%04d.${format}`)
    await ffmpeg.exec(args)

    onProgress?.(70, 'Frames extracted, building ZIP...')

    // Collect all output frames
    const { strToU8, zipSync } = await import('fflate')
    const files: Record<string, Uint8Array> = {}
    let idx = 1
    const fileList: string[] = []

    while (true) {
      const frameName = `frame_${String(idx).padStart(4, '0')}.${format}`
      try {
        const data = await ffmpeg.readFile(frameName)
        files[frameName] = data instanceof Uint8Array ? data : strToU8(data as string)
        fileList.push(frameName)
        idx++
      } catch {
        break
      }
    }

    if (fileList.length === 0) {
      throw new Error('No frames were extracted. Check the video file and options.')
    }

    const zipped = zipSync(files)
    const blob = new Blob([zipped.buffer as ArrayBuffer], { type: 'application/zip' })

    await cleanupFiles(ffmpeg, [inputName, ...fileList])

    const baseName = file.name.replace(/\.[^.]+$/, '')
    return {
      type: 'file',
      data: blob,
      filename: `${baseName}-frames.zip`,
      mimeType: 'application/zip',
      summary: `Extracted ${fileList.length} frames as ${format.toUpperCase()} images (${(blob.size / 1024 / 1024).toFixed(2)} MB ZIP)`,
    }
  },
}

registry.register(tool)
export default tool
