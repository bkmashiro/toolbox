import { registry } from '../../core/registry'
import { getFFmpeg, cleanupFiles } from '../../core/ffmpeg'
import type { Tool } from '../../core/types'

const tool: Tool = {
  id: 'audio-merge',
  name: 'Merge Audio',
  description: 'Concatenate multiple audio files into one, with optional crossfade',
  category: 'audio',
  tags: ['audio', 'merge', 'join', 'concatenate', 'combine', 'append', 'crossfade'],
  inputs: [
    { id: 'files', label: 'Audio Files (in order)', type: 'multifile', accept: 'audio/*' },
  ],
  options: [
    {
      id: 'outputFormat',
      label: 'Output Format',
      type: 'select',
      default: 'mp3',
      options: [
        { label: 'MP3', value: 'mp3' },
        { label: 'WAV', value: 'wav' },
        { label: 'OGG', value: 'ogg' },
      ],
    },
    {
      id: 'crossfade',
      label: 'Crossfade Duration (seconds)',
      type: 'range',
      default: 0,
      min: 0,
      max: 5,
      step: 0.5,
      helpText: '0 = no crossfade (hard cut), > 0 = blend between tracks.',
    },
  ],
  output: { type: 'file' },
  apiSupported: false,
  heavyDeps: ['ffmpeg'],
  async run(inputs, options, onProgress) {
    const files = inputs.files as File[]
    if (!files || files.length < 2) throw new Error('Please provide at least 2 audio files to merge.')

    const outputFormat = options.outputFormat as string
    const crossfade = options.crossfade as number

    const ffmpeg = await getFFmpeg(onProgress)
    const filenames: string[] = []

    onProgress?.(10, `Loading ${files.length} audio files...`)
    for (let i = 0; i < files.length; i++) {
      const ext = files[i].name.split('.').pop() || 'mp3'
      const name = `input_${i}.${ext}`
      const data = new Uint8Array(await files[i].arrayBuffer())
      await ffmpeg.writeFile(name, data)
      filenames.push(name)
    }

    const outputName = `output.${outputFormat}`
    const codecMap: Record<string, string> = {
      mp3: 'libmp3lame',
      wav: 'pcm_s16le',
      ogg: 'libvorbis',
    }
    const codec = codecMap[outputFormat] || 'libmp3lame'

    onProgress?.(40, 'Merging audio...')

    if (crossfade === 0 || files.length < 2) {
      // Simple concat via concat filter
      const concatContent = filenames.map(f => `file '${f}'`).join('\n')
      const concatData = new TextEncoder().encode(concatContent)
      await ffmpeg.writeFile('concat.txt', concatData)

      await ffmpeg.exec([
        '-f', 'concat',
        '-safe', '0',
        '-i', 'concat.txt',
        '-codec:a', codec,
        '-y', outputName,
      ])
      filenames.push('concat.txt')
    } else {
      // Crossfade using acrossfade filter (works for 2 inputs at a time)
      // Build a chain: [0][1] -> xfade1, [xfade1][2] -> xfade2, etc.
      const args: string[] = []
      filenames.forEach(f => args.push('-i', f))

      // Build complex filter for crossfade chain
      let filterComplex = ''
      if (files.length === 2) {
        filterComplex = `[0:a][1:a]acrossfade=d=${crossfade}:c1=tri:c2=tri[out]`
        args.push('-filter_complex', filterComplex, '-map', '[out]')
      } else {
        // Chain multiple crossfades
        const parts: string[] = []
        parts.push(`[0:a][1:a]acrossfade=d=${crossfade}:c1=tri:c2=tri[cf0]`)
        for (let i = 2; i < files.length; i++) {
          const prev = i === 2 ? 'cf0' : `cf${i - 2}`
          const next = i === files.length - 1 ? 'out' : `cf${i - 1}`
          parts.push(`[${prev}][${i}:a]acrossfade=d=${crossfade}:c1=tri:c2=tri[${next}]`)
        }
        filterComplex = parts.join(';')
        args.push('-filter_complex', filterComplex, '-map', '[out]')
      }

      args.push('-codec:a', codec, '-y', outputName)
      await ffmpeg.exec(args)
    }

    const data = await ffmpeg.readFile(outputName)
    const buf = data instanceof Uint8Array ? data.buffer.slice(0) : data
    const mimeMap: Record<string, string> = {
      mp3: 'audio/mpeg', wav: 'audio/wav', ogg: 'audio/ogg',
    }
    const mimeType = mimeMap[outputFormat] || 'audio/mpeg'
    const blob = new Blob([buf as ArrayBuffer], { type: mimeType })

    await cleanupFiles(ffmpeg, [...filenames, outputName])

    return {
      type: 'file',
      data: blob,
      filename: `merged.${outputFormat}`,
      mimeType,
      summary: `Merged ${files.length} files into ${outputFormat.toUpperCase()} — ${(blob.size / 1024 / 1024).toFixed(2)} MB`,
    }
  },
}

registry.register(tool)
export default tool
