import { describe, it, expect, vi, beforeEach } from 'vitest'

vi.mock('../../../core/registry', () => ({
  registry: { register: vi.fn() },
}))

const mockExec = vi.fn().mockResolvedValue(undefined)
const mockWriteFile = vi.fn().mockResolvedValue(undefined)
// Simulate 3 frames then throw (to stop the frame collection loop)
let readFileCallCount = 0
const mockReadFile = vi.fn().mockImplementation((_name: string) => {
  readFileCallCount++
  if (readFileCallCount <= 3) {
    return Promise.resolve(new Uint8Array([0x89, 0x50, 0x4e, 0x47])) // PNG header
  }
  return Promise.reject(new Error('File not found'))
})
const mockDeleteFile = vi.fn().mockResolvedValue(undefined)

vi.mock('../../../core/ffmpeg', () => ({
  getFFmpeg: vi.fn().mockResolvedValue({
    exec: mockExec,
    writeFile: mockWriteFile,
    readFile: mockReadFile,
    deleteFile: mockDeleteFile,
    on: vi.fn(),
  }),
  writeInputFile: vi.fn().mockResolvedValue(undefined),
  cleanupFiles: vi.fn().mockResolvedValue(undefined),
}))

vi.mock('fflate', () => ({
  strToU8: vi.fn((s: string) => new TextEncoder().encode(s)),
  zipSync: vi.fn(() => new Uint8Array([0x50, 0x4b, 0x05, 0x06])), // minimal ZIP
}))

describe('video-extract-frames', () => {
  let tool: { run: Function }

  beforeEach(async () => {
    vi.clearAllMocks()
    readFileCallCount = 0
    vi.resetModules()
    const mod = await import('../video-extract-frames')
    tool = mod.default
  })

  function makeFile(name = 'test.mp4'): File {
    return new File([new Uint8Array(100)], name, { type: 'video/mp4' })
  }

  it('should use fps filter in interval mode', async () => {
    const { getFFmpeg } = await import('../../../core/ffmpeg')
    const ffmpeg = await getFFmpeg()

    await tool.run(
      { file: makeFile() },
      { mode: 'interval', interval: 2, frameCount: 10, format: 'png', jpegQuality: 85 },
      undefined
    )

    const args = (ffmpeg.exec as ReturnType<typeof vi.fn>).mock.calls[0][0] as string[]
    const vfArg = args[args.indexOf('-vf') + 1]
    expect(vfArg).toContain('fps=1/2')
  })

  it('should use select filter in count mode', async () => {
    const { getFFmpeg } = await import('../../../core/ffmpeg')
    const ffmpeg = await getFFmpeg()

    await tool.run(
      { file: makeFile() },
      { mode: 'count', interval: 1, frameCount: 20, format: 'png', jpegQuality: 85 },
      undefined
    )

    const args = (ffmpeg.exec as ReturnType<typeof vi.fn>).mock.calls[0][0] as string[]
    const vfArg = args[args.indexOf('-vf') + 1]
    expect(vfArg).toContain('select=')
    expect(vfArg).toContain('nb_frames/20')
  })

  it('should include jpeg quality arg for jpg format', async () => {
    const { getFFmpeg } = await import('../../../core/ffmpeg')
    const ffmpeg = await getFFmpeg()

    await tool.run(
      { file: makeFile() },
      { mode: 'interval', interval: 1, frameCount: 10, format: 'jpg', jpegQuality: 90 },
      undefined
    )

    const args = (ffmpeg.exec as ReturnType<typeof vi.fn>).mock.calls[0][0] as string[]
    expect(args).toContain('-q:v')
  })

  it('should not include quality arg for png format', async () => {
    const { getFFmpeg } = await import('../../../core/ffmpeg')
    const ffmpeg = await getFFmpeg()

    await tool.run(
      { file: makeFile() },
      { mode: 'interval', interval: 1, frameCount: 10, format: 'png', jpegQuality: 85 },
      undefined
    )

    const args = (ffmpeg.exec as ReturnType<typeof vi.fn>).mock.calls[0][0] as string[]
    expect(args).not.toContain('-q:v')
  })

  it('should output a ZIP file', async () => {
    const result = await tool.run(
      { file: makeFile('video.mp4') },
      { mode: 'interval', interval: 1, frameCount: 10, format: 'png', jpegQuality: 85 },
      undefined
    )

    expect(result.mimeType).toBe('application/zip')
    expect(result.filename).toContain('.zip')
  })
})
