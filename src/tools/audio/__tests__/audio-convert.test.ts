import { describe, it, expect, vi, beforeEach } from 'vitest'

vi.mock('../../../core/registry', () => ({
  registry: { register: vi.fn() },
}))

const mockExec = vi.fn().mockResolvedValue(undefined)

vi.mock('../../../core/ffmpeg', () => ({
  getFFmpeg: vi.fn().mockResolvedValue({
    exec: mockExec,
    writeFile: vi.fn().mockResolvedValue(undefined),
    readFile: vi.fn().mockResolvedValue(new Uint8Array(100)),
    deleteFile: vi.fn().mockResolvedValue(undefined),
    on: vi.fn(),
  }),
  writeInputFile: vi.fn().mockResolvedValue(undefined),
  readOutputFile: vi.fn().mockResolvedValue(new Blob(['audio'], { type: 'audio/mpeg' })),
  cleanupFiles: vi.fn().mockResolvedValue(undefined),
}))

describe('audio-convert', () => {
  let tool: { run: Function }

  beforeEach(async () => {
    vi.clearAllMocks()
    vi.resetModules()
    const mod = await import('../audio-convert')
    tool = mod.default
  })

  function makeFile(name = 'test.mp3'): File {
    return new File([new Uint8Array(100)], name, { type: 'audio/mpeg' })
  }

  it('should use libmp3lame codec for mp3 output', async () => {
    const { getFFmpeg } = await import('../../../core/ffmpeg')
    const ffmpeg = await getFFmpeg()

    await tool.run(
      { file: makeFile() },
      { format: 'mp3', bitrate: '192k', sampleRate: '44100' },
      undefined
    )

    const args = (ffmpeg.exec as ReturnType<typeof vi.fn>).mock.calls[0][0] as string[]
    const codecIdx = args.indexOf('-codec:a')
    expect(codecIdx).toBeGreaterThanOrEqual(0)
    expect(args[codecIdx + 1]).toBe('libmp3lame')
  })

  it('should use libvorbis codec for ogg output', async () => {
    const { getFFmpeg } = await import('../../../core/ffmpeg')
    const ffmpeg = await getFFmpeg()

    await tool.run(
      { file: makeFile() },
      { format: 'ogg', bitrate: '192k', sampleRate: '44100' },
      undefined
    )

    const args = (ffmpeg.exec as ReturnType<typeof vi.fn>).mock.calls[0][0] as string[]
    const codecIdx = args.indexOf('-codec:a')
    expect(args[codecIdx + 1]).toBe('libvorbis')
  })

  it('should use flac codec for flac output', async () => {
    const { getFFmpeg } = await import('../../../core/ffmpeg')
    const ffmpeg = await getFFmpeg()

    await tool.run(
      { file: makeFile() },
      { format: 'flac', bitrate: '192k', sampleRate: '44100' },
      undefined
    )

    const args = (ffmpeg.exec as ReturnType<typeof vi.fn>).mock.calls[0][0] as string[]
    const codecIdx = args.indexOf('-codec:a')
    expect(args[codecIdx + 1]).toBe('flac')
  })

  it('should use pcm_s16le codec for wav output', async () => {
    const { getFFmpeg } = await import('../../../core/ffmpeg')
    const ffmpeg = await getFFmpeg()

    await tool.run(
      { file: makeFile() },
      { format: 'wav', bitrate: '192k', sampleRate: '44100' },
      undefined
    )

    const args = (ffmpeg.exec as ReturnType<typeof vi.fn>).mock.calls[0][0] as string[]
    const codecIdx = args.indexOf('-codec:a')
    expect(args[codecIdx + 1]).toBe('pcm_s16le')
  })

  it('should use aac codec for aac output', async () => {
    const { getFFmpeg } = await import('../../../core/ffmpeg')
    const ffmpeg = await getFFmpeg()

    await tool.run(
      { file: makeFile() },
      { format: 'aac', bitrate: '192k', sampleRate: '48000' },
      undefined
    )

    const args = (ffmpeg.exec as ReturnType<typeof vi.fn>).mock.calls[0][0] as string[]
    const codecIdx = args.indexOf('-codec:a')
    expect(args[codecIdx + 1]).toBe('aac')
  })

  it('should use libopus codec for opus output', async () => {
    const { getFFmpeg } = await import('../../../core/ffmpeg')
    const ffmpeg = await getFFmpeg()

    await tool.run(
      { file: makeFile() },
      { format: 'opus', bitrate: '128k', sampleRate: '48000' },
      undefined
    )

    const args = (ffmpeg.exec as ReturnType<typeof vi.fn>).mock.calls[0][0] as string[]
    const codecIdx = args.indexOf('-codec:a')
    expect(args[codecIdx + 1]).toBe('libopus')
  })

  it('should NOT include -b:a for lossless formats (wav, flac)', async () => {
    const { getFFmpeg } = await import('../../../core/ffmpeg')
    const ffmpeg = await getFFmpeg()

    await tool.run(
      { file: makeFile() },
      { format: 'wav', bitrate: '192k', sampleRate: '44100' },
      undefined
    )

    const args = (ffmpeg.exec as ReturnType<typeof vi.fn>).mock.calls[0][0] as string[]
    expect(args).not.toContain('-b:a')
  })

  it('should include -b:a bitrate for lossy formats', async () => {
    const { getFFmpeg } = await import('../../../core/ffmpeg')
    const ffmpeg = await getFFmpeg()

    await tool.run(
      { file: makeFile() },
      { format: 'mp3', bitrate: '256k', sampleRate: '44100' },
      undefined
    )

    const args = (ffmpeg.exec as ReturnType<typeof vi.fn>).mock.calls[0][0] as string[]
    const bitrateIdx = args.indexOf('-b:a')
    expect(bitrateIdx).toBeGreaterThanOrEqual(0)
    expect(args[bitrateIdx + 1]).toBe('256k')
  })

  it('should set the sample rate via -ar flag', async () => {
    const { getFFmpeg } = await import('../../../core/ffmpeg')
    const ffmpeg = await getFFmpeg()

    await tool.run(
      { file: makeFile() },
      { format: 'mp3', bitrate: '192k', sampleRate: '22050' },
      undefined
    )

    const args = (ffmpeg.exec as ReturnType<typeof vi.fn>).mock.calls[0][0] as string[]
    const arIdx = args.indexOf('-ar')
    expect(arIdx).toBeGreaterThanOrEqual(0)
    expect(args[arIdx + 1]).toBe('22050')
  })
})
