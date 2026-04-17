import { describe, it, expect, vi, beforeEach } from 'vitest'

// Mock the registry
vi.mock('../../../core/registry', () => ({
  registry: { register: vi.fn() },
}))

// Mock FFmpeg module
const mockExec = vi.fn().mockResolvedValue(undefined)
const mockWriteFile = vi.fn().mockResolvedValue(undefined)
const mockReadFile = vi.fn().mockResolvedValue(new Uint8Array([0x47, 0x49, 0x46]))
const mockDeleteFile = vi.fn().mockResolvedValue(undefined)
const mockOn = vi.fn()

vi.mock('../../../core/ffmpeg', () => ({
  getFFmpeg: vi.fn().mockResolvedValue({
    exec: mockExec,
    writeFile: mockWriteFile,
    readFile: mockReadFile,
    deleteFile: mockDeleteFile,
    on: mockOn,
  }),
  writeInputFile: vi.fn().mockResolvedValue(undefined),
  readOutputFile: vi.fn().mockResolvedValue(new Blob(['gif'], { type: 'image/gif' })),
  cleanupFiles: vi.fn().mockResolvedValue(undefined),
}))

describe('video-to-gif', () => {
  let tool: { run: Function }

  beforeEach(async () => {
    vi.clearAllMocks()
    vi.resetModules()
    const mod = await import('../video-to-gif')
    tool = mod.default
  })

  function makeFile(name = 'test.mp4'): File {
    return new File([new Uint8Array(100)], name, { type: 'video/mp4' })
  }

  it('should use two-pass palette generation when optimizePalette is true', async () => {
    const { getFFmpeg } = await import('../../../core/ffmpeg')
    const ffmpeg = await getFFmpeg()

    await tool.run(
      { file: makeFile() },
      { fps: '12', width: '480', startTime: '', endTime: '', dither: 'bayer', loop: 0, optimizePalette: true },
      undefined
    )

    // Should call exec twice: once for palette, once for render
    expect(ffmpeg.exec).toHaveBeenCalledTimes(2)

    const firstCallArgs = (ffmpeg.exec as ReturnType<typeof vi.fn>).mock.calls[0][0] as string[]
    // palettegen is embedded in a -vf filter string, not a standalone arg
    const firstArgsStr = firstCallArgs.join(' ')
    expect(firstArgsStr).toContain('palettegen')

    const secondCallArgs = (ffmpeg.exec as ReturnType<typeof vi.fn>).mock.calls[1][0] as string[]
    const secondArgsStr = secondCallArgs.join(' ')
    expect(secondArgsStr).toContain('palette.png')
    expect(secondArgsStr).toContain('paletteuse')
  })

  it('should use single pass when optimizePalette is false', async () => {
    const { getFFmpeg } = await import('../../../core/ffmpeg')
    const ffmpeg = await getFFmpeg()

    await tool.run(
      { file: makeFile() },
      { fps: '12', width: '480', startTime: '', endTime: '', dither: 'bayer', loop: 0, optimizePalette: false },
      undefined
    )

    expect(ffmpeg.exec).toHaveBeenCalledTimes(1)
  })

  it('should include fps and width in filter args', async () => {
    const { getFFmpeg } = await import('../../../core/ffmpeg')
    const ffmpeg = await getFFmpeg()

    await tool.run(
      { file: makeFile() },
      { fps: '15', width: '240', startTime: '', endTime: '', dither: 'bayer', loop: 0, optimizePalette: false },
      undefined
    )

    const args = (ffmpeg.exec as ReturnType<typeof vi.fn>).mock.calls[0][0] as string[]
    const filterArg = args.find(a => a.includes('fps=15'))
    expect(filterArg).toBeDefined()
    expect(filterArg).toContain('scale=240')
  })

  it('should pass -ss startTime before input when startTime is set', async () => {
    const { getFFmpeg } = await import('../../../core/ffmpeg')
    const ffmpeg = await getFFmpeg()

    await tool.run(
      { file: makeFile() },
      { fps: '12', width: '480', startTime: '00:00:05', endTime: '00:00:15', dither: 'bayer', loop: 0, optimizePalette: false },
      undefined
    )

    const args = (ffmpeg.exec as ReturnType<typeof vi.fn>).mock.calls[0][0] as string[]
    const ssIdx = args.indexOf('-ss')
    const iIdx = args.indexOf('-i')
    expect(ssIdx).toBeGreaterThanOrEqual(0)
    expect(ssIdx).toBeLessThan(iIdx)
    expect(args[ssIdx + 1]).toBe('00:00:05')
  })

  it('should use correct loop value', async () => {
    const { getFFmpeg } = await import('../../../core/ffmpeg')
    const ffmpeg = await getFFmpeg()

    await tool.run(
      { file: makeFile() },
      { fps: '12', width: '480', startTime: '', endTime: '', dither: 'bayer', loop: 3, optimizePalette: false },
      undefined
    )

    const args = (ffmpeg.exec as ReturnType<typeof vi.fn>).mock.calls[0][0] as string[]
    const loopIdx = args.indexOf('-loop')
    expect(loopIdx).toBeGreaterThanOrEqual(0)
    expect(args[loopIdx + 1]).toBe('3')
  })

  it('should use sierra2_4a dither when specified (optimizePalette=true)', async () => {
    const { getFFmpeg } = await import('../../../core/ffmpeg')
    const ffmpeg = await getFFmpeg()

    await tool.run(
      { file: makeFile() },
      { fps: '12', width: '480', startTime: '', endTime: '', dither: 'sierra2_4a', loop: 0, optimizePalette: true },
      undefined
    )

    const secondCallArgs = (ffmpeg.exec as ReturnType<typeof vi.fn>).mock.calls[1][0] as string[]
    const filterArg = secondCallArgs.find(a => a.includes('paletteuse'))
    expect(filterArg).toBeDefined()
    expect(filterArg).toContain('sierra2_4a')
  })

  it('should return a gif output with correct filename', async () => {
    const result = await tool.run(
      { file: makeFile('my-video.mp4') },
      { fps: '12', width: '480', startTime: '', endTime: '', dither: 'bayer', loop: 0, optimizePalette: false },
      undefined
    )

    expect(result.filename).toBe('my-video.gif')
    expect(result.mimeType).toBe('image/gif')
  })
})
