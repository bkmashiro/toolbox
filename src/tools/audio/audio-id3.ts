import { registry } from '../../core/registry'
import { getFFmpeg, writeInputFile, readOutputFile, cleanupFiles } from '../../core/ffmpeg'
import type { Tool } from '../../core/types'

const tool: Tool = {
  id: 'audio-id3',
  name: 'ID3 Editor',
  description: 'View and edit audio file metadata tags (title, artist, album, year, genre, cover art)',
  category: 'audio',
  tags: ['audio', 'id3', 'metadata', 'tags', 'title', 'artist', 'album', 'genre', 'cover', 'mp3'],
  inputs: [
    { id: 'file', label: 'Audio File', type: 'file', accept: 'audio/*' },
  ],
  options: [
    {
      id: 'title',
      label: 'Title',
      type: 'text',
      default: '',
      placeholder: 'Song title',
    },
    {
      id: 'artist',
      label: 'Artist',
      type: 'text',
      default: '',
      placeholder: 'Artist name',
    },
    {
      id: 'album',
      label: 'Album',
      type: 'text',
      default: '',
      placeholder: 'Album name',
    },
    {
      id: 'year',
      label: 'Year',
      type: 'text',
      default: '',
      placeholder: '2024',
    },
    {
      id: 'genre',
      label: 'Genre',
      type: 'text',
      default: '',
      placeholder: 'Pop, Rock, Jazz...',
    },
    {
      id: 'trackNumber',
      label: 'Track Number',
      type: 'text',
      default: '',
      placeholder: '1/12',
    },
    {
      id: 'coverArt',
      label: 'Cover Art (optional)',
      type: 'file',
      default: null,
      accept: 'image/*',
      helpText: 'Replace the cover art image (JPEG or PNG recommended).',
    },
  ],
  output: { type: 'file' },
  apiSupported: false,
  heavyDeps: ['ffmpeg'],
  async run(inputs, options, onProgress) {
    const file = inputs.file as File
    const coverArt = inputs.coverArt as File | undefined
    const title = (options.title as string).trim()
    const artist = (options.artist as string).trim()
    const album = (options.album as string).trim()
    const year = (options.year as string).trim()
    const genre = (options.genre as string).trim()
    const trackNumber = (options.trackNumber as string).trim()

    const ffmpeg = await getFFmpeg(onProgress)
    const ext = file.name.split('.').pop() || 'mp3'
    const inputName = `input.${ext}`
    const outputName = `output.${ext}`

    await writeInputFile(ffmpeg, inputName, file)

    const args: string[] = ['-i', inputName]
    const toClean: string[] = [inputName, outputName]

    if (coverArt) {
      const coverExt = coverArt.name.split('.').pop() || 'jpg'
      const coverName = `cover.${coverExt}`
      await writeInputFile(ffmpeg, coverName, coverArt)
      args.push('-i', coverName)
      args.push('-map', '0:a', '-map', '1:v')
      args.push('-disposition:v:0', 'attached_pic')
      toClean.push(coverName)
    } else {
      args.push('-map', '0')
    }

    // Add metadata tags
    const metaMap: Record<string, string> = {
      title, artist, album, date: year, genre, track: trackNumber,
    }
    for (const [key, value] of Object.entries(metaMap)) {
      if (value) args.push('-metadata', `${key}=${value}`)
    }

    // Copy codec to avoid re-encoding
    args.push('-codec', 'copy', '-y', outputName)

    await ffmpeg.exec(args)

    const mimeMap: Record<string, string> = {
      mp3: 'audio/mpeg', wav: 'audio/wav', ogg: 'audio/ogg',
      flac: 'audio/flac', aac: 'audio/aac', opus: 'audio/opus', m4a: 'audio/mp4',
    }
    const mimeType = mimeMap[ext] || 'audio/mpeg'
    const blob = await readOutputFile(ffmpeg, outputName, mimeType)
    await cleanupFiles(ffmpeg, toClean)

    const baseName = file.name.replace(/\.[^.]+$/, '')
    const tagsSummary = [title && `"${title}"`, artist && `by ${artist}`, album && `(${album})`]
      .filter(Boolean).join(' ') || 'tags updated'

    return {
      type: 'file',
      data: blob,
      filename: `${baseName}-tagged.${ext}`,
      mimeType,
      summary: `ID3 tags updated: ${tagsSummary} — ${(blob.size / 1024 / 1024).toFixed(2)} MB`,
    }
  },
}

registry.register(tool)
export default tool
